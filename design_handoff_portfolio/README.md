# Handoff: Felipe Ramos da Silva — Portfolio website

## Overview
One-page personal site for a senior Rust/Go engineer targeting senior backend / distributed-systems / real-time-media roles. Built in the **Modernist** design system: flat, red-on-off-white, Archivo only, zero radius, 2px rules, visible grid. Signature element: live canvas motion graphics (a 16.7 ms frame-budget readout in the hero and one motif per work/project card), plus scroll-choreographed reveals.

## About the Design Files
Files in this bundle are **design references written in HTML** (a Design Component format: template markup + a JS logic class). They are not production code to ship. Recreate them in the target codebase (React/Next, Astro, SvelteKit, or plain HTML+JS — anything static-host friendly; no backend needed). Open `Felipe Portfolio.dc.html` in a browser (needs `support.js` and `_ds/` alongside) to see the reference live.

## Fidelity
**High-fidelity.** Layout, type, color, spacing, copy and animation behaviour are final. Recreate 1:1 using the tokens below.

## Files
- `Felipe Portfolio.dc.html` — **the site**. Template = everything between `<x-dc>`…`</x-dc>` (minus `<helmet>`). Logic class = the `<script data-dc-script>` at the bottom: all canvas animations, timeline data, project data, counters, IntersectionObserver reveals, scroll progress.
- `Hero 1a Tiles.dc.html`, `Hero 1c Dewarp.dc.html` — rejected hero explorations (reference only; their canvas code is reused as the Cosm motif). `Hero 1b Budget.dc.html` — the chosen hero, superseded by the full page.
- `_ds/…/styles.css` — **design tokens + component classes** (`.nav`, `.btn`, `.tag`, `.grayscale`). Copy the `:root` block verbatim. `_ds/…/readme.md` — the system guide.
- `assets/portrait.jpg` (render grayscale), `assets/Felipe-Ramos-da-Silva-Resume.pdf`.
- `support.js`, `_ds_bundle.js` — runtime for the reference format only; do **not** port.

## Design Tokens (from styles.css)
- Ground `#f3f2f2`, surface `#eae9e9`, ink `#201e1d`, accent `#ec3013`, divider = ink at 40% (`color-mix(in srgb,#201e1d 40%,transparent)`), 2px.
- Accent ramp: 100 `#fff2ef`, 200 `#ffe0d9`, 300 `#ffc4b8`, 400 `#ff9783`, 500 `#ff563c`, 600 `#dd2b0f` (hover), 700 `#ae1800` (accent text on ground), 800 `#7c1405`, 900 `#4d170e`.
- Neutral 700 `#605d5d` (secondary text).
- Font: Archivo 400/600/800 (Google Fonts). Heading weight 800.
- Spacing: 4, 8, 12, 16, 24, 32 px. Radius 0 everywhere. No shadows used.
- Page gutter: `clamp(20px,5vw,72px)`; content max-width 1200px; section padding `clamp(48px,6vw,88px)` vertical; every section separated by a 2px divider.
- Kicker style (used everywhere): 13px, uppercase, letter-spacing .08em, accent-700 (or neutral-700 for meta), `font-feature-settings:'tnum'`.
- Labels flush left, including inside buttons (`justify-content:flex-start`).

## Screens / Sections (top → bottom)

### Nav (sticky)
`.nav` bar, 56px, ground bg, 2px bottom rule; brand "Felipe Ramos da Silva" left (Archivo 800), links Work / Projects / Timeline / Contact. A 2px accent line along the bottom edge scales X 0→1 with scroll progress (`transform-origin:left`).

### Hero
2-col grid `repeat(auto-fit,minmax(min(100%,380px),1fr))`, min-height `calc(100vh - 56px)`.
Left column (padding `clamp(40px,7vw,104px)` × gutter, flex column, space-between):
- Kicker with 10px red square: "Senior Rust & Go Engineer · Real-time media · Distributed systems"
- H1 `clamp(48px,6.4vw,112px)`, line-height .98, letter-spacing -.03em, margin-left -.058em, three lines: "Systems that" / "answer in" / "milliseconds." (third line accent red).
- Intro 17px/28px, max 52ch: "I'm Felipe, a senior software engineer working in Rust and Go. I build backends that can't be late: distributed systems, real-time media, and the infrastructure underneath them."
- Buttons: `.btn-primary` "See the work →" (→ #work), `.btn-secondary` "Résumé (PDF)" (download). min-width 180px each, gap 12px.
Right column: solid accent `#ec3013` panel, min-height 460px, full-bleed `<canvas>` — **Frame-budget animation** (see Motion).
Below hero: 2px rule + stat strip, grid `auto-fit minmax(150px,1fr)`, kicker style: Core → "Rust · Go · Distributed systems"; Specialty → "Real-time media · GPU video"; Also → "Cloud · Frontend · Web3 · AI agents"; Base → "Londrina, BR · Remote US / EU".

### 01 — Professional highlights (#work)
H2 `clamp(32px,4vw,56px)`: "Two roles where latency, concurrency and correctness were the whole job."
Two articles, grid `auto-fit minmax(min(100%,340px),1fr)`, column-gap `clamp(16px,3vw,48px)`, each with 2px bottom rule, vertical padding 32px, inner gap 16px:
1. **Cosm · via Kake** | May 2025 — present. H3 `clamp(24px,2.4vw,32px)` "GPU-accelerated 8K virtual camera at 60 fps". Canvas 220px tall (tile grid + virtual camera motif). Paragraph + 2 bullets (10px red square bullets, grid `10px 1fr`) — copy in file. Tags (`.tag-neutral`): Rust, Go, C++, CUDA, NVDEC / NVENC, HEVC, WebRTC, AWS.
2. **FOX · via X-Team** | Mar 2021 — May 2025. "Live-streaming backend, from 6 minutes to 3 seconds". Canvas 220px (validation-loop collapse motif). Tags: Go, Rust, TypeScript, Kubernetes, AWS, HLS / DASH, SRT, pprof.

### 02 — Featured projects (#projects)
H2 "From the bytes up: protocols, consensus, and agents that remember."
Grid `auto-fit minmax(260px,1fr)`, 2px gap filled with divider color (cells have ground bg → reads as a ruled table). Each card: kicker row (kicker + right-aligned meta, nowrap), 150px canvas motif, H3 22px, body 14px/22px, stack line 12px neutral-700, full-width `.btn-secondary`.
Cards (data array `projects` in the logic class): socket-flow (★ 75), Artemis Network (★ 18), Kioku (記憶), RoleMiner → roleminer.app.

### 03 — Career timeline (#timeline)
H2 "2015 → now. Industrial automation to GPU video." 72px canvas strip (year ticks 2015–2026, role bars, sweeping playhead), then rows grid `minmax(120px,160px) 1.2fr 1fr` — period (13px neutral) | **role** — company | stack (13px neutral), 1px rule between rows. 11 roles in the `roles` array (with numeric from/to used by the canvas).

### 04 — Open source (#opensource)
Two-col `auto-fit minmax(240px,1fr)`. Left: H2 "Built in public.", paragraph, `.btn-secondary` "github.com/felipemeriga →". Right: 2×2 stat blocks, 2px top rule each, number in Archivo 800 `clamp(40px,4vw,56px)` accent red: 80+ Public repos · 169 Followers · 75 Stars · socket-flow · "crates.io" Published · socket-flow. Numbers count up from 0 over 1.4s (cubic ease-out) on mount.

### 05 — Content & community (#content)
H2 "What I've learned, out loud." Grid `auto-fit minmax(min(100%,300px),1fr)`, column gap 16px, 2px top rule, each link card 1px bottom rule, padding 16px 0, hover → accent text: YouTube · EN @felipemerigadon; YouTube · PT "Careers abroad" (**link TBD — currently points to EN channel**); Blog "Writing on Hashnode" (felipemeriga.hashnode.dev); Instagram @f.meriga.

### 06 — Education
Grid `minmax(120px,160px) 1fr`: BEng Electrical Engineering, UEL 2011–2016 (Embedded Software); Technical Course Chemistry, ETEC Conselheiro Antônio Prado 2007–2009; languages line.

### 07 — Hire me (#contact) — poster close
Full-bleed accent `#ec3013` background, ground-colored text. Grid `auto-fit minmax(min(100%,360px),1fr)`. Left: kicker, H2 `clamp(40px,5.6vw,88px)` "Need a backend that holds under load?", paragraph, then a stack of links in Archivo 800 `clamp(20px,2.2vw,28px)` with 2px ground-colored top rules (last also bottom): email, linkedin.com/in/felipersil, github.com/felipemeriga, "Download résumé (PDF) ↓". Hover → accent-200. Right: portrait, `object-fit:cover`, position 50% 25%, **grayscale**.
Footer: 13px neutral-700 two-ended row.

## Motion (all canvas, 2D context, DPR-aware, one shared rAF loop; skip canvases off-screen; pause when `motion=off`)
Colors used on canvases: INK `#201e1d`, RED `#ec3013`, BG `#f3f2f2`, TINT `#ffe0d9`, DEEP `#ae1800`, DARK `#4d170e`. Labels: Archivo 600/800, 10–12px, uppercase. All labels truncate with "…" to panel width.
1. **Hero — frame budget** (red panel, light ink). Top: GOP conveyor of 26px squares sliding left at 60 squares/s, labelled I/P/B (I every 12th = tint 300, current = light with red letter; current turns dark-900 with light letter when over budget). Big number: per-frame total ms of 4 stages (DECODE 3.6±, PROCESS 4.2±, ENCODE 4.0±, DELIVER 1.4± via sine jitter; rare +2.5 ms spikes), Archivo 800 `min(150, W*.28, H*.2)`px, letter-spacing -.04em, "ms" at 28% size; turns dark-900 when > 16.7. Status line "FRAME n · PTS · BUDGET 16.7 ms · ON TIME/OVER BUDGET". Stage bar 24px: dark-900 track = 16.7 ms, alternating light/tint-300 segments with labels. Bottom: 60-column history (last 1 s), current column light, over-budget columns accent-700, 16.7 line at 1px.
2. **Cosm — tiles + virtual cam**: 9×5 grid, dashed vertical split labelled NVDEC 0 / NVDEC 1; a red 16:9 crop (30% width) eases (k=.07) toward a "puck" point drifting with periodic dashes; intersected tiles fill tint-200; red label "VIRTUAL CAM 60 FPS" clamped inside panel.
3. **FOX — 6:00 → 0:03**: 6 s cycle; progress bar + big mm:ss.s counter eases (cubic) from 6:00 to 0:02.7, turns red at the end; 12 goroutine lanes whose blocks widen/slow before and shrink/speed up after; caption switches BEFORE / PROFILING / AFTER.
4. **socket-flow**: three rows of 12px byte squares streaming left; header bytes red with FIN/TXT/BIN/PNG tag, masked bytes tint-300.
5. **Artemis**: 76px blocks slide left every ~1.7 s; newest block outlined red with a spinning nonce; older blocks show #height, 00000-prefixed hash, tx count, linked by rules.
6. **Kioku**: 22 nodes on slow orbit; the query node (red) cycles; edges fade by distance; hits within radius turn accent-700; caption shows top-k count.
7. **RoleMiner**: 6 tool chips, current one red; 8 iteration pips; 4 memory lines breathing in opacity; "MEM0 + PG" red square.
8. **Timeline strip**: year ticks, role bars (first three red), playhead sweeps 2015→2026 every ~13 s.
Scroll choreography: elements with `data-reveal` start opacity 0, translateY 18px; on IntersectionObserver (threshold .15, rootMargin -8% bottom) animate 0.7 s `cubic-bezier(.2,.7,.2,1)` to visible, once. Hero lines stagger .05/.18/.31 s, intro .45 s, buttons .55 s. `prefers-reduced-motion` disables all reveals (canvases may keep running or freeze at a frame).
States: `:focus-visible` 2px accent outline offset 2px; link hover accent-600; button states per styles.css.

## State
No app state beyond: counter values (mount-time tween), scroll progress, reveal flags. Two design toggles exist in the reference (`motion`: cinematic/calm/off — calm = half speed; `denseTimeline`: 11 vs 5 rows) — optional to port.

## Assets
- `assets/portrait.jpg` — user photo, render through a grayscale filter.
- `assets/Felipe-Ramos-da-Silva-Resume.pdf` — résumé download target.
- Icons: none used (arrows are text glyphs). If icons are added, use Lucide.

## Open items
- Portuguese YouTube channel URL (placeholder → EN channel).
- GitHub numbers are static (80+, 169, 75) — optionally fetch live from the GitHub API at build time.
