# RoleMiner — An AI Job Hunter With a Memory

## Project Overview

**RoleMiner** is a personal project I designed and built end-to-end: an opinionated, single-user AI job hunter built around an **agent that remembers you**.

The premise is simple but demanding: instead of forcing the user to fill in a preferences form, the system should **get better at you the more you use it**. Every action — every search, dismissal, application, and outcome — is a signal that flows back into the agent's context. Ask it "find me senior Rust roles in EU TZ, no on-call" and it searches structured, AI-enriched job postings, tracks each application through a kanban pipeline, and progressively learns what you actually want.

I built the full stack myself — a FastAPI agent backend, a React SPA, a Postgres/Supabase data layer, a dual-store memory system, billing, scheduling, and an admin surface — as a way to go deep on **LLM agent design, tool-calling loops, and behavioural memory systems**.

The differentiator, and the part I care about most, is the memory system: turning what the user *did* into context the agent can act on.

---

## What It Does

- **Chat with an agent** that searches jobs, reads your resume, scores roles against your profile, and proposes saving preferences as patterns form.
- **Manual search UI** with one control per filter — a fallback for when you know exactly what you want.
- **Kanban pipeline** — Saved → Applied → Screening → Interview → Offer → Closed, with drag-and-drop status changes.
- **Jira-style timeline** on every applied job — status transitions and free-text notes interleaved.
- **Long-term memory** with categories, provenance, decay, and deduplication, browsable by category on a Memories page.
- **Pattern detection** on recent searches and dismissals, so the agent can proactively ask "I noticed you keep filtering for Remote Solely — should I remember that?"
- **Outcome capture** on terminal status changes, so rejections, offers, and acceptances feed back into the agent's worldview.
- **In-chat resume upload** with recency-aware highlight extraction (active vs. dormant skills).
- **Scheduled email digests** for saved searches, driven by a background cron scheduler.
- **Free + Pro tiers** wired through Stripe Checkout + Customer Portal, with per-action daily rate limits and contextual upgrade nudges.

---

## Architecture

RoleMiner is a multi-service application: a FastAPI backend hosting the agent loop, a React SPA, a Supabase/Postgres data layer, and two external intelligence sources (Anthropic for reasoning, Mem0 for long-term memory), fed by a job-data provider.

```text
                                  ┌─────────────────┐
                                  │  Fantastic.jobs │
                                  │   (job source)  │
                                  └────────┬────────┘
                                           │
                              ┌────────────▼────────────┐
   ┌──────────────────┐       │      FastAPI backend    │       ┌─────────┐
   │  React + MUI     │◀─────▶│  /api/{search,chat,...}  │◀─────▶│  Mem0   │
   │  Vite frontend   │  SSE  │      Anthropic loop     │       │ (prefs) │
   └──────────────────┘       └────────┬────────────────┘       └─────────┘
                                       │
                              ┌────────▼────────┐
                              │    Supabase     │
                              │ (auth · pg · st)│
                              └─────────────────┘
```

- **Backend** — FastAPI + Pydantic v2. Houses the Anthropic tool-calling agent loop, the search orchestrator, the dual-store memory service, the applications pipeline, the dismissed-jobs ledger, the cron scheduler, Stripe billing webhooks, and admin cost/broadcast surfaces. Streams agent turns via SSE.
- **Frontend** — React 19 + TypeScript + MUI v7 SPA with chat, search, kanban, profile, scheduled alerts, and an admin section.
- **Database** — Postgres via Supabase, RLS-enforced per user.
- **External services** — Anthropic (Sonnet for chat, Haiku for titles, Opus for deep reasoning), Mem0 (long-term memory), Fantastic.jobs (job data).

---

## The Agent Loop

The chat experience is an **Anthropic tool-calling loop** wrapped in an SSE stream. Each turn builds a system prompt (base prompt + budgeted memory entries + dynamic pattern/nudge blocks), then iterates up to a hard ceiling of **8 iterations**, letting the model decide when to stop:

```text
1. Persist user message
2. Build system_text  (base prompt + Mem0 entries + patterns + nudge)
        ↓
for iteration in 1..MAX_ITERATIONS(8):
    anthropic.messages.create()
    if stop_reason == "end_turn": break
    execute tool_uses
    if save_preference landed: rebuild system_text
    persist tool_results
        ↓
3. Persist assistant message
4. Touch conversation
5. SSE end event
```

The agent has an **18-tool surface** grouped by concern:

- **Search & data** — `search_jobs`, `enrich_jobs`, `score_jobs_against_profile`, `list_user_jobs`
- **Application lifecycle** — `apply_to_job`, `add_application_comment`, `update_application_status`, `dismiss_job`
- **Memory** — `recall_preferences`, `recall_by_category`, `save_preference`, `recall_recent_searches`
- **Saved searches** — `list_saved_searches`, `save_search`
- **Scheduling** — `schedule_cron_notification`
- **CV tailoring / ATS** — `score_resume_against_role`, `ats_check_resume`, `tailor_cv_for_role`

Everything is streamed to the frontend as typed SSE events (`text`, `tool_use`, `tool_result`, `title`, `error`, `end`), and every message (user, assistant, tool results) is persisted so a conversation can be fully reconstructed on reload.

---

## The Memory System (the differentiator)

The most interesting engineering in RoleMiner is a **two-store memory design** that separates what the user *said* from what the user *did*:

| Store | Purpose | Lifetime |
|---|---|---|
| **Mem0** | User-stated preferences with semantic recall | Long-term, cross-session |
| **Supabase** | Behavioural signals (searches, dismissals, applications) | Bounded rolling windows |

The compelling feedback loop is where behaviour crosses that boundary — a repeated behavioural signal gets *proposed back to the user* as a preference and, on confirmation, becomes a durable Mem0 entry.

### Categorized, decaying, deduplicated memory

Every Mem0 entry carries one of five categories — `hard_constraint`, `preference`, `dislike`, `personal_fact`, `outcome` — and the category isn't cosmetic. It drives:

- **Injection budget** — the system prompt reserves slots for hard constraints first, then fills by recency, bounding the prefix so 30 saved memories don't blow out the prompt (and to keep prompt-cache hits meaningful).
- **Two-stage decay** — entries render as `(may be outdated)` after 180 days and drop out of injection entirely after 365, while `hard_constraint` and `personal_fact` are immune (visas and years-of-experience don't expire on a timer).
- **Dedup on save** — a naive `add()` would let "I want remote" and "prefers remote-only" become two entries. I wrap saves to search for the nearest existing memory and `update()` instead of `add()` above a tuned 0.85 similarity threshold, with a fall-back-to-add safety net (a duplicate is better than a lost save).

Every save also stamps provenance — category, source conversation, timestamp — surfaced in the UI so a stale memory can be traced back and re-confirmed.

### Behavioural signals & proactive nudges

On the Supabase side I built:

- A **recent-searches rolling buffer** (last 5 queries) with **pattern detection** — a filter value appearing in ≥3 of the last 5 searches is flagged and piggy-backed onto the `search_jobs` tool result, so the agent sees the signal exactly when it's summarizing results (no extra round-trip).
- A **dismissed-jobs ledger** (capped at 200) that both filters dismissed roles out of results permanently and runs its own pattern synthesis over industry/org/taxonomy.
- A **save-preference nudge** that fires precisely when the user is generating uncaptured signal (a full search buffer with no save since), surfacing both a system-prompt heads-up and a UI banner.
- **Outcome capture** on terminal application transitions — the strongest signal in the system — where the backend hands the agent a `propose_outcome` hint to ASK the user about, never writing outcomes unilaterally.

### Correctness guardrails

Two details I'm particularly happy with:

- **Save-then-search ordering rule** — the system prompt is composed once per turn, so a `save_preference` + `search_jobs` in the same batch would search against the pre-save prompt. I enforce ordering at the loop level: the save runs first, the search gets a structured refusal, and `system_text` is rebuilt so later iterations see the new memory. This survives model behaviour drift, not just prompt instructions.
- **Graceful degradation everywhere** — a Mem0 or Supabase blip never blocks a conversation; recalls return empty, saves report failure, and the prompt falls back to the bare base. The invariant: memory infrastructure failures never stop the user from talking to the agent.

---

## Cost Control & Caching

Model selection is task-routed for cost/quality: **Sonnet** for the normal chat loop, **Haiku** for first-turn auto-titling, **Opus** behind an opt-in deep-reasoning toggle. On top of that I use Anthropic's "system + last N messages" **prompt caching** pattern — cache breakpoints on the system block and the last user message — so multi-turn replays get warm-cache hits as long as memory state and the conversation prefix are stable.

The app also has per-tier **daily rate limits** per action (chat / search / resume-score / CV-tailor), Stripe-backed **Free/Pro billing**, and an admin **cost dashboard** fed by a fire-and-forget upstream-call telemetry ledger.

---

## Testing & Engineering Rigor

This project is heavily tested — a deliberate choice given how much orchestration logic it contains:

- **Backend** — ~649 unit tests plus integration tests that drive the real routes and services against deterministic in-memory Mem0 + Supabase substitutes, verifying orchestration without external dependencies. (220+ of those tests cover memory primitives alone.)
- **Frontend** — ~227 Vitest tests covering pages, components, the kanban drag-and-drop path, chat-history reconstruction, and markdown rendering.
- **Clean tooling on every commit** — ruff, eslint, vitest, pytest.

I made a considered decision to *not* run real Mem0 in CI (it needs an embedding backend, heavier than the marginal value), documenting the one thing the stub can't verify — the 0.85 dedup threshold calibration — as a one-time real-world exercise rather than a per-commit risk.

---

## Key Technical Contributions

Everything here was designed and built by me. The parts I'm most proud of:

- Designing an **Anthropic tool-calling agent loop** with an 18-tool surface, bounded iterations, and full SSE streaming of typed events.
- Building a **dual-store memory system** that separates stated preferences (Mem0) from behavioural signals (Supabase), with a feedback loop that promotes behaviour into durable preferences.
- Implementing **categorized memory** with a priority-aware injection budget, two-stage time decay, category-based decay immunity, and provenance tracking.
- Writing **semantic dedup-on-save** (search → update-vs-add above a tuned similarity threshold) with a fail-safe fallback.
- Building **pattern detection** over rolling search and dismissal buffers, surfaced to the agent inline on tool results with zero extra round-trips.
- Designing **proactive save-preference nudges** and **outcome capture** so the system learns from real behaviour without ever writing memory unilaterally.
- Enforcing a **save-then-search ordering invariant** at the loop level to defend against stale-prompt searches and model drift.
- Making every memory layer **degrade gracefully** so infrastructure blips never break a conversation.
- Implementing **task→model routing** (Sonnet/Haiku/Opus) and **prompt caching** for cost control.
- Building a **kanban applications pipeline** with drag-and-drop and a Jira-style event timeline.
- Adding a **CV tailoring + ATS-check pipeline** with per-tier quota gating.
- Building a **background cron scheduler** for saved-search email digests.
- Wiring **Stripe billing** (Checkout + Customer Portal + webhooks), per-action daily rate limits, and contextual upgrade nudges.
- Implementing **multi-tenant security** with Supabase Auth and Postgres Row-Level Security.
- Writing a comprehensive **test suite** (~649 backend + ~227 frontend tests) with deterministic substitutes for external services.

---

## Technologies

### Backend / AI

- Python, FastAPI, Pydantic v2
- Anthropic SDK — Sonnet (chat), Haiku (titles), Opus (deep reasoning), with task→model routing and prompt caching
- Mem0 SDK — long-term categorized memory with decay + dedup
- httpx, Supabase Python SDK
- Fantastic.jobs API (structured, AI-enriched job data)

### Frontend

- React 19, TypeScript
- Material-UI v7, React Router 7
- Vite 7, Vitest, DOMPurify
- Native HTML5 drag-and-drop (kanban)

### Data / Infrastructure

- Postgres via Supabase (JSONB rolling buffers)
- Supabase Auth (JWT verified server-side)
- Row-Level Security (per-user isolation)
- Server-Sent Events (SSE) for streaming agent turns

### Platform / Ops

- Stripe (Checkout + Customer Portal + webhooks)
- Background cron scheduler (saved-search digests)
- SMTP email (Resend, with file fallback)
- Admin cost dashboard + upstream-call telemetry ledger

### Quality

- pytest (~649 unit + integration tests), ruff
- Vitest (~227 tests), eslint, tsc

---

## Project Significance

RoleMiner is the personal project where I went deepest on **agent design and applied memory systems**. Beyond wiring an LLM to some tools, it forced me to solve the hard problems that make an agent genuinely useful over time: how to bound and prioritize context under a token budget, how to age out stale knowledge without losing durable facts, how to deduplicate restatements semantically, and how to turn passive behavioural signals into learned preferences without nagging the user or writing memory behind their back.

It also reflects how I like to build a complete product: a real agent loop with correctness invariants, a considered memory architecture with graceful degradation, cost-aware model routing, billing and rate limiting, RLS-enforced multi-tenancy, and a test suite thorough enough to refactor against with confidence — all built solo.

Repository: https://github.com/felipemeriga/role-miner
