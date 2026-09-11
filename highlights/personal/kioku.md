# Kioku (記憶) — A Self-Hosted "Second Brain" for Coding Agents

## Project Overview

**Kioku** is a personal project I designed and built end-to-end: a self-hosted, per-repo memory and knowledge system that pairs with **Claude Code** (or any MCP client) to give coding agents persistent, folder-scoped context.

The name comes from the Japanese word for *memory* (記憶), which reflects the core idea: an agent that starts every session already knowing your repo's architecture, past decisions, preferences, and findings — and that automatically captures what it learns back into memory when the session ends.

The problem it solves is one I ran into constantly: AI coding agents are stateless across sessions. They re-learn the same codebase, forget prior decisions, and lose the surrounding ecosystem context (specs, design docs, external systems) that lives outside the repo's own code. Kioku turns that ephemeral context into a durable, retrievable second brain.

I built the full stack myself — backend, retrieval pipeline, MCP server, frontend, CLI, and deployment — as a way to go deep on **agentic RAG, hybrid retrieval, and agent tooling**.

---

## What It Does

- **Per-repo briefings** — every Claude Code session starts with the repo's briefing pre-loaded (architecture, conventions, external systems), streamed in via a SessionStart hook.
- **Automatic memory capture** — a Stop hook distills each session's transcript into a few high-signal memory entries (preferences, findings, decisions, issues, session summaries) and stores them with deduplication.
- **Knowledge ingestion** — upload PDFs, DOCX, Markdown, or plain text; connect GitHub repos and Notion pages; all of it becomes searchable context scoped to the right folder.
- **One-command wiring** — a `kioku init` CLI command detects the git remote, provisions an API key, and installs the MCP config, hooks, and a `CLAUDE.md` snippet — idempotent and safe to re-run.
- **Strict per-repo scope** — unlike per-project agents, Kioku unifies a whole workspace across repos while keeping retrieval and memory strictly scoped per repo/folder.

---

## Architecture

Kioku is a multi-service system: a FastAPI backend, a React frontend, an MCP server, a dedicated memory microservice, and a TypeScript CLI, all deployable via Docker Compose.

```text
┌──────────────┐        ┌──────────────────────────────────────────┐
│   Frontend    │        │                Backend                    │
│ React 19 + MUI │──SSE──▶│  FastAPI                                  │
│  Vite + TS     │        │                                           │
└──────────────┘        │  Auth (Supabase JWT + RLS)                │
                         │                                           │
┌──────────────┐        │  Agentic RAG Pipeline                     │
│  MCP Client   │──SSE──▶│    Claude ──▶ Tool Router                 │
│ Claude Code   │        │      ├─ knowledge_base_search             │
│    Cursor     │        │      ├─ query_documents_metadata          │
└──────────────┘        │      └─ web_search                        │
                         │                                           │
┌──────────────┐        │  Services: Ingestion · Search · Rerank ·  │
│     CLI       │───────▶│  Embed · Text-to-SQL · Metadata           │
│  kioku init   │  REST  └───────────────────┬───────────────────────┘
└──────────────┘                            │
                         ┌───────────────────▼───────────────────────┐
                         │        Supabase (PostgreSQL)               │
                         │  documents (pgvector) · conversations ·    │
                         │  messages · folders · RPC functions         │
                         └────────────────────────────────────────────┘
                         ┌────────────────────────────────────────────┐
                         │  mem0-service — memory store (Mem0 wrapper) │
                         └────────────────────────────────────────────┘
```

---

## Agentic RAG Pipeline

The heart of the project is an **agentic retrieval pipeline**. Rather than a single-shot vector lookup, Claude runs an agent loop (up to 10 rounds) and autonomously decides which tools to call:

- `knowledge_base_search` — hybrid retrieval over the knowledge base
- `query_documents_metadata` — natural-language-to-SQL over document metadata
- `web_search` — a Tavily fallback when the documents don't have the answer

The retrieval itself is deliberately layered for recall and precision:

```text
User question
      ↓
(full mode) query rewriting + multi-query expansion
      ↓
Voyage AI embedding
      ↓
Vector search (pgvector cosine)   +   Keyword search (BM25 / full-text)
      ↓
Reciprocal Rank Fusion (RRF)
      ↓
Voyage Rerank-2
      ↓
Neighbor-chunk expansion
      ↓
Claude synthesizes the answer
      ↓
Stream tokens via Server-Sent Events
```

I implemented two retrieval modes:

- **Fast mode** — used by the MCP path, skips the LLM-driven query enrichment for low latency.
- **Full mode** — used by the UI, adds query rewriting and multi-query expansion for higher recall.

---

## Ingestion Pipeline

Documents flow through a deterministic ingestion path with deduplication built in:

```text
File upload
      ↓
Docling parser (PDF, DOCX, HTML, Markdown, text)
      ↓
SHA-256 dedup check
      ↓
Recursive chunking (~2048 chars, 200 overlap)
      ↓
Metadata extraction (Claude Haiku: topics + keywords)
      ↓
Voyage embeddings (1024 dimensions)
      ↓
Store in PostgreSQL with pgvector
```

---

## Centralized LLM Client & Cost Control

A design decision I care about in this project is the **centralized LLM client** with task-to-model routing. Instead of scattering model choices across the codebase, a single client routes each task to the right model:

- **Haiku** for cheap, high-frequency work — routing, metadata extraction, memory distillation
- **Sonnet / Opus** for synthesis and reasoning-heavy answers

It also applies **prompt caching** across the rewrite, multi-query, and tool-use turns, which meaningfully cuts token cost on the multi-round agent loop.

---

## Memory System

Kioku separates two complementary layers:

- **Knowledge base** (documents, RAG) — *what the domain knows*
- **Memory** (Mem0-backed microservice) — *what was learned and decided*

Memory capture is automatic and debounced. The Stop hook fires only when there are **5 new turns** or **10 minutes** since the last capture, reads the Claude Code transcript delta, and the backend distills it into 0–3 categorized entries (`preference` / `finding` / `decision` / `issue` / `session`) using Haiku. Entries are stored with content-hash deduplication so the same insight isn't saved twice.

---

## The CLI — Zero-Friction Wiring

I built a dedicated TypeScript CLI (published as `kioku`) so wiring a repo takes one command:

```bash
kioku login             # email + 6-digit OTP, tokens stored 0600
cd ~/repos/my-project
kioku init              # picks folder, wires MCP, installs hooks, done
```

`kioku init` is **idempotent** and full of smart defaults — it detects the git remote, resolves where the repo lives in the workspace (silently when there's an obvious answer), mints a scoped API key, and writes four files: `.mcp.json`, `.claude/settings.json` (hooks), `.claude/kioku-state.json`, and a `CLAUDE.md` snippet. A GitHub auth ladder tries `--github-token`, then `gh auth token`, then env vars, then an interactive PAT paste.

I also added `status` and `doctor` commands for diagnosing per-repo binding health and printing fix hints — the kind of operational polish that makes a tool actually pleasant to use.

---

## Quality: Evaluation Harness

Because retrieval quality is easy to regress silently, I built an **eval harness** gated in CI:

- IR metrics — **Recall@k, MRR, nDCG@k**
- Optional **RAGAS** metrics — faithfulness, answer relevancy, context precision/recall
- A pinned **baseline** with per-metric floors and tolerances, so every PR is checked against a regression floor

Every retrieval also emits **runtime metrics and per-stage timings** (search, rerank, cache-hit, per-stage latency), giving me observability into where time and tokens actually go.

---

## Key Technical Contributions

Everything in this project was built by me. The parts I'm most proud of:

- Designing and implementing an **agentic RAG pipeline** where the LLM autonomously orchestrates multiple retrieval tools over a bounded agent loop.
- Building **hybrid search** — vector similarity + BM25, fused with Reciprocal Rank Fusion, reranked with Voyage Rerank-2, and expanded with neighbor chunks.
- Implementing **fast vs. full retrieval modes** to trade recall against latency depending on the caller (MCP vs. UI).
- Writing a **centralized LLM client** with task→model routing and prompt caching for cost control.
- Building a robust **document ingestion pipeline** with parsing, chunking, metadata extraction, embedding, and SHA-256 deduplication.
- Implementing an **MCP server** (FastMCP over SSE) exposing knowledge and memory tools to Claude Code, Cursor, and any MCP client.
- Designing a **per-repo memory system** with automatic, debounced session capture and LLM-based distillation into categorized, deduplicated entries.
- Integrating **GitHub and Notion** as ecosystem-context sources folded into repo briefings.
- Building a polished **TypeScript CLI** with one-command wiring, smart defaults, an auth ladder, and diagnostic commands.
- Implementing a **CI-gated evaluation harness** with IR + RAGAS metrics and a regression baseline.
- Adding **runtime metrics and per-stage timing** instrumentation for observability.
- Implementing **multi-tenancy** with Supabase Auth and Row-Level Security, plus scoped API keys for programmatic ingest.
- Packaging the whole system for **self-hosted Docker Compose** deployment behind a reverse proxy.

---

## Technologies

### Languages / Runtimes

- Python (FastAPI backend, MCP server, memory service)
- TypeScript (CLI, frontend)
- SQL (PostgreSQL schema, RPC functions)

### Frontend

- React 19
- Material-UI
- Vite

### Backend / AI

- FastAPI + Uvicorn
- Claude (Opus / Sonnet / Haiku) via a centralized task→model-routing client with prompt caching
- Voyage AI — embeddings + Rerank-2
- Tavily — web search fallback
- Docling — document parsing (PDF, DOCX, HTML, Markdown, text)
- Mem0 — memory storage layer

### Retrieval / Search

- pgvector (cosine similarity)
- PostgreSQL full-text search (BM25-style keyword search)
- Reciprocal Rank Fusion (RRF)
- Neighbor-chunk expansion
- Query rewriting + multi-query expansion

### Data / Infrastructure

- Supabase (PostgreSQL + Auth + Row-Level Security)
- Docker Compose
- Nginx / Traefik reverse proxy
- Server-Sent Events (SSE) for streaming

### Protocols / Tooling

- MCP (Model Context Protocol) via FastMCP over SSE
- Claude Code hooks (SessionStart / Stop)
- CI-gated eval harness (IR metrics + RAGAS)

---

## Project Significance

Kioku is the personal project where I went deepest on **agentic systems and retrieval engineering**. It pushed me across the entire stack of a modern AI application: LLM orchestration, hybrid retrieval, embedding and reranking, cost-aware model routing, agent tooling via MCP, evaluation, observability, multi-tenant data modeling, and self-hosted deployment.

Beyond the retrieval work, it reflects how I like to build: understand the real workflow friction (stateless agents re-learning the same repo), design a system that removes it (per-repo briefings + automatic memory), and wrap it in tooling polished enough that adopting it is a single command. It's both a genuinely useful tool I use with Claude Code and a demonstration of building a complete, production-shaped AI system solo.

Repository: https://github.com/felipemeriga/kioku
