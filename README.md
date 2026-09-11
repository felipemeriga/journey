# Felipe Ramos da Silva

### Senior Rust & Go Engineer · Real-Time Media & Distributed Systems · AI Applications · Web3

> Senior software engineer with **7+ years** building distributed systems, real-time media, and low-level backend infrastructure — primarily in **Rust** and **Go**. I work where performance, concurrency, and correctness matter: GPU-accelerated video, live-streaming platforms, blockchain protocols, and applied AI (agentic workflows, long-term memory, RAG).

📍 Londrina, Paraná, Brazil  ·  🌎 Working remotely with teams across the US and Europe

| | |
|---|---|
| **Email** | felipe.meriga@gmail.com |
| **LinkedIn** | [linkedin.com/in/felipersil](https://linkedin.com/in/felipersil) |
| **GitHub** | [github.com/felipemeriga](https://github.com/felipemeriga) |
| **Blog** | [felipemeriga.hashnode.dev](https://felipemeriga.hashnode.dev/) |
| **YouTube (tech)** | [@felipemerigadon](https://www.youtube.com/@felipemerigadon) |
| **Instagram** | [@f.meriga](https://www.instagram.com/f.meriga/) |
| **Phone** | +55 19 99148-0101 |

---

## Table of Contents

- [About](#about)
- [What I Specialize In](#what-i-specialize-in)
- [Professional Highlights](#professional-highlights)
- [Featured Open-Source & Personal Projects](#featured-open-source--personal-projects)
- [Career Timeline](#career-timeline)
- [Technical Skills](#technical-skills)
- [Spoken Languages](#spoken-languages)
- [Education](#education)
- [Open Source & GitHub](#open-source--github)
- [Content & Community](#content--community)
- [Repository Map](#repository-map)

---

## About

I'm a Senior Software Engineer specializing in **Rust, Go, distributed systems, and real-time media**. Over the past several years I've built backend services, streaming platforms, and cloud infrastructure for production media systems. My work spans low-latency networking, performance engineering, GPU-accelerated video processing, and distributed workloads.

At **Cosm** (through Kake), I built a GPU-accelerated Rust web player for live sports production. It processes 8K fisheye footage, corrects lens distortion, delivers video in real time, and supports virtual-camera views that automatically follow players or the ball.

Before that, I spent four years delivering live-streaming infrastructure and real-time media systems at **FOX**, and earlier worked on **Web3 / DeFi** smart contracts, cloud R&D at **Accenture**, IoT products, and embedded systems.

Alongside my full-time role, I build AI applications through independent consulting, open source, and personal products. My current AI work focuses on **agentic workflows, long-term memory, RAG systems, and developer tooling**.

---

## What I Specialize In

- **Real-time video & media systems** — GPU video pipelines, encoding/decoding, virtual cameras, WebRTC/SRT/HLS/DASH delivery
- **Distributed systems** — consensus, P2P networking, concurrent architectures, data correlation at scale
- **High-performance backend engineering** — profiling, latency budgets, memory/CPU optimization, async runtimes
- **Systems & protocol engineering** — building network protocols and data pipelines from the bytes up
- **Applied AI** — agentic workflows, long-term memory, RAG, MCP tooling, LLM cost/quality engineering
- **Cloud infrastructure** — AWS, Kubernetes, Docker, cloud-native distributed services

**Primary languages:** Rust · Go   **Also:** Python · C++ · CUDA · TypeScript

---

## Professional Highlights

Deep-dive writeups of the two roles where I've done my most significant real-time and distributed-systems work.

### 🎥 [Cosm — Real-Time Interactive Video, GPU Processing & Virtual Camera Systems](highlights/professional/cosm.md)
*Software Engineer (via Kake) · May 2025 – Present*

Building a **GPU-accelerated interactive web player** for live sports on NVIDIA T4 hardware. Highlights:

- Re-architected the 8K decode pipeline to use **both NVDEC engines in parallel**, correlating decoded regions by presentation timestamp — enabling **stable 60 FPS virtual-camera movement with no dropped frames** during fast action (e.g. a puck crossing the rink).
- Built an **automatic camera-selection / auto-tally system** (a software live director) using XYZ tracking, PTZ calculations, and **predictive, keyframe-scheduled camera switching** off the buffered live window — switching physical cameras without dropping a single output frame.
- Full media pipeline: 8K fisheye → spatial tiling → NVDEC → CUDA dewarp → NVENC → WebRTC, under a **~16.7 ms/frame** budget.

`Rust · Go · C++ · CUDA · NVDEC/NVENC · HLS · HEVC · WebRTC · AWS`

### 📺 [Fox / Disney — Real-Time Video Engineering & Distributed Systems](highlights/professional/fox.md)
*Software Engineer (via X-Team) · March 2021 – May 2025*

Backend infrastructure and operational visibility for FOX's live-streaming platform across the US. Highlights:

- Built a **high-volume channel-validation service** in Go that normalized heterogeneous provider data, correlated it per channel, and validated operational state in a continuous concurrent loop over goroutines.
- Used **pprof, heap analysis, execution tracing, and flame graphs** to systematically eliminate bottlenecks — including reusing shared context instead of rebuilding it per goroutine.
- **Reduced the full validation loop from ~6 minutes to ~2–3 seconds** (two orders of magnitude) and cut CPU/memory usage by **60%+**.
- Worked on **dynamic ad insertion** and manifest validation across streaming, encoding, viewer, and advertising telemetry.

`Go · Rust · TypeScript · React · AWS · Kubernetes · WebRTC · SRT · Live Streaming`

---

## Featured Open-Source & Personal Projects

Four projects that best represent my range — from applied AI to low-level systems. Full technical writeups are linked.

### 🧠 [Kioku (記憶)](highlights/personal/kioku.md) — Second brain for coding agents
A self-hosted, per-repo **memory + knowledge system** that pairs with Claude Code via MCP. Every session starts with the repo's briefing pre-loaded; every session ends with learnings auto-captured. Features an **agentic RAG pipeline** (LLM-orchestrated tool loop), **hybrid search** (vector + BM25 → RRF → Voyage Rerank-2 → neighbor expansion), a centralized task→model LLM router with prompt caching, a CI-gated eval harness (recall/MRR/nDCG + RAGAS), and a one-command CLI.
`Python · FastAPI · TypeScript · React · pgvector · Supabase · MCP · Claude · Voyage AI` → [github.com/felipemeriga/kioku](https://github.com/felipemeriga/kioku)

### 💼 [RoleMiner](highlights/personal/role-miner.md) — An AI job hunter with a memory
An AI-powered job-discovery product built around an agent that **learns your preferences from behaviour** instead of a form. An Anthropic tool-calling loop (18 tools) over a **dual-store memory system** (Mem0 for stated preferences, Postgres for behavioural signals) with categorized/decaying/deduplicated memory, proactive save-preference nudges, outcome capture, a kanban application pipeline, Stripe billing, and ~876 tests (backend + frontend).
`Python · FastAPI · React 19 · Supabase · Anthropic · Mem0 · Stripe` → [roleminer.app](https://roleminer.app/)

### 🔌 [socket-flow](highlights/personal/socket-flow.md) — Async WebSocket library for Rust ⭐ 75
A **from-scratch RFC 6455 WebSocket implementation** on Tokio — handshake, framing, masking, opcodes, `permessage-deflate` compression, TLS, and a split reader/writer. Passes the **Autobahn Test Suite** for client and server, and benchmarked against `tokio-tungstenite` in Kubernetes with k6. Published on crates.io.
`Rust · Tokio · tokio-rustls · flate2` → [github.com/felipemeriga/socket-flow](https://github.com/felipemeriga/socket-flow) · [crates.io](https://crates.io/crates/socket-flow)

### ⛓️ [Artemis Network](highlights/personal/artemis-network.md) — A blockchain built from scratch in Rust ⭐ 18
A complete, runnable **blockchain node** implemented from the bytes up: SHA-256 proof-of-work mining, secp256k1/ECDSA transactions, **longest-valid-chain consensus**, a P2P TCP protocol with peer discovery, a fee-prioritized mempool (with lazy deletion), Sled persistence, and an HTTP RPC API — all as five concurrent Tokio components sharing one authoritative chain.
`Rust · Tokio · secp256k1 · Sled · P2P` → [github.com/felipemeriga/artemis-network](https://github.com/felipemeriga/artemis-network)

---

## Career Timeline

| Period | Role | Company | Location |
|---|---|---|---|
| **Nov 2025 – Present** | AI Solutions Engineer *(Independent)* | Freelance / Consulting | United States (remote) |
| **May 2025 – Present** | Software Engineer — Real-Time Media | **Kake @ Cosm** | Remote |
| **Mar 2021 – May 2025** | Software Engineer — Live Streaming | **X-Team @ FOX** | Remote |
| **Mar 2020 – Mar 2021** | Blockchain Software Engineer | **Tokenizer** | Remote |
| **Sep 2019 – Mar 2021** | Senior DevOps Engineer | **Accenture (The Dock)** | Dublin, Ireland |
| **Jan 2018 – Dec 2019** | Software Developer | **IO-Shower** (Smart Shower / IoT) | Greater Londrina, Brazil |
| **Mar 2019 – Sep 2019** | Development Analyst | **Tata Consultancy Services** | Greater Londrina, Brazil |
| **Nov 2017 – Mar 2019** | Development Consultant | **CSG International** | Greater Londrina, Brazil |
| **Sep 2017 – Nov 2017** | Embedded Software Developer | **Zoe Slots** | Greater Londrina, Brazil |
| **Mar 2016 – Mar 2017** | Software Developer | **LA2I** (Intelligent Automation Lab) | Greater Londrina, Brazil |
| **Jan 2015 – Mar 2016** | Automation Developer | **Jirehmaq Automação Industrial** | Londrina, Brazil |

### Role details

**AI Solutions Engineer — Independent (Freelance / Consulting)** · *Nov 2025 – Present*
Designing and building AI applications, developer tools, and backend services in Rust and Python. Built [RoleMiner](https://roleminer.app/) and [Kioku](https://github.com/felipemeriga/kioku); designed RAG and agent workflows covering retrieval, routing, context management, structured outputs, and evaluation; shipped reliable, maintainable, cloud-deployed backends.
`Rust · Python · FastAPI · PostgreSQL · pgvector · Qdrant · Docker · AWS · LLMs · RAG · MCP · LangGraph`

**Software Engineer @ Cosm (via Kake)** · *May 2025 – Present*
Embedded in Cosm's engineering team building real-time media technology for immersive sports experiences. Built the GPU-accelerated 8K web player in Rust; designed low-latency media pipelines in Rust and Go; built cloud-native infra on AWS (ECS, Lambda, S3, RDS, Docker, Kubernetes); integrated LLM-driven automation and RAG into production. → [full writeup](highlights/professional/cosm.md)
`Rust · Go · Python · TypeScript · AWS · Kubernetes · Docker · PostgreSQL · Redis · gRPC · WebRTC · SRT · RAG`

**Software Engineer @ FOX (via X-Team)** · *Mar 2021 – May 2025*
Delivered backend infrastructure and real-time media systems for FOX's live-streaming platform. Built Go/Rust services for real-time processing and dynamic ad insertion; cut CPU/memory usage 60%+ and the validation loop from 6 min to 3 s via profiling. → [full writeup](highlights/professional/fox.md)
`Go · Rust · TypeScript · React · AWS · Live Streaming · Distributed Systems`

**Blockchain Software Engineer — Tokenizer** · *Mar 2020 – Mar 2021*
Developed Ethereum smart contracts and backend integrations for DeFi and DEX products using EVM tooling, RPC providers, and deployment workflows; identified and mitigated performance and security vulnerabilities in contracts.
`Solidity · Ethereum · EVM · Go · Rust · TypeScript · Docker · Kubernetes · AWS`

**Senior DevOps Engineer — Accenture (The Dock, R&D)** · *Sep 2019 – Mar 2021*
Evaluated emerging technologies and designed cloud/deployment architectures for internal applications in Accenture's R&D center; built prototypes across AWS, containers, and microservices; presented recommendations to internal teams.
`Go · Python · TypeScript · React · AWS · Terraform · Kubernetes · Docker`

**Earlier experience** — IoT (IO-Shower smart-shower product, end-to-end embedded → cloud → mobile), enterprise telecom software (TCS, CSG International), embedded systems for online gaming (Zoe Slots), energy-efficiency software (LA2I), and industrial-automation control (Jirehmaq).
`C++ · Java · Python · Qt · Arduino · Raspberry Pi · React Native · Spring · Angular · PL/SQL`

---

## Technical Skills

**Languages**
`Rust · Go · Python · C++ · C · CUDA · TypeScript · JavaScript · Java · Solidity`

**Real-Time Media & Video**
`WebRTC · SRT · HLS · MPEG-DASH · HEVC/H.265 · fisheye/dewarping · virtual cameras · PTZ · video tiling · PTS/GOP · NVDEC · NVENC · live encoding/decoding`

**Distributed Systems & Networking**
`consensus algorithms · P2P protocols · WebSockets · gRPC · async/concurrent architectures · low-latency networking · data correlation & normalization`

**AI / LLM**
`agentic workflows · multi-agent systems · RAG (hybrid search, rerank, RRF) · long-term & episodic memory · Model Context Protocol (MCP) · fine tuning · LLM cost/quality routing · prompt caching · evaluation (IR metrics, RAGAS)`

**Performance Engineering**
`pprof · CPU/heap profiling · execution tracing · flame graphs · goroutine/concurrency analysis · memory-allocation analysis · latency profiling`

**Cloud & Infrastructure**
`AWS (ECS, Lambda, S3, RDS, EC2/GPU, IoT) · Kubernetes · Docker · Terraform · CI/CD`

**Data & Backend**
`PostgreSQL · pgvector · Redis · Qdrant · Sled · FastAPI · Supabase · MySQL`

---

## Spoken Languages

| Language | Proficiency |
|---|---|
| English | Native / Bilingual |
| Portuguese | Native / Bilingual |
| Spanish | Native / Bilingual |
| Italian | Professional Working |
| Japanese | Elementary |

---

## Education

**BEng, Electrical Engineering** — State University of Londrina (UEL) · *2011 – 2016*
Specialization: Embedded Software Development · Londrina, Paraná, Brazil

**Technical Course, Chemistry** — Escola Técnica Estadual Conselheiro Antônio Prado · *2007 – 2009*

---

## Open Source & GitHub

[github.com/felipemeriga](https://github.com/felipemeriga) — **80+ public repositories · 169 followers**

Selected public projects (by stars):

| Project | ⭐ | Language | What it is |
|---|---|---|---|
| [socket-flow](https://github.com/felipemeriga/socket-flow) | 75 | Rust | Async WebSocket library (RFC 6455), Autobahn-compliant |
| [artemis-network](https://github.com/felipemeriga/artemis-network) | 18 | Rust | Blockchain node built from scratch |
| [Emberblast](https://github.com/felipemeriga/Emberblast) | 15 | Python | Command-line RPG arena game |
| [kioku](https://github.com/felipemeriga/kioku) | 4 | Python | Memory layer / second brain for AI assistants |
| [Eureka-Zuul-Kubernetes](https://github.com/felipemeriga/Eureka-Zuul-Kubernetes) | 27 | Java | Microservices reference (Eureka + Zuul on Kubernetes) |
| [DevOps-Example](https://github.com/felipemeriga/DevOps-Example) | 7 | Java | Jenkins pipeline sample (heavily forked) |

Interests spread across Rust systems programming, blockchain, microservices/DevOps references, IoT/embedded (ESP8266, smart-shower), and applied AI tooling.

---

## Content & Community

Beyond code, I create content and share what I've learned building an international engineering career.

### 🎬 YouTube — [@felipemerigadon](https://www.youtube.com/@felipemerigadon) *(English / technical)*
My original channel, focused on **technical software development** — engineering topics, tooling, and hands-on programming.

### 🎬 YouTube — Portuguese *(careers & personal branding)* — 🔗 *link pending*
A Portuguese-language channel focused on **helping Brazilian engineers build careers abroad**:
- How to find engineering jobs outside Brazil
- Improving your personal branding as an engineer
- Staying healthy and productive at work

### 📸 Instagram — [@f.meriga](https://www.instagram.com/f.meriga/)
Behind-the-scenes of my work, projects, and life as a remote engineer.

---

## Repository Map

This repository (`journey`) is a consolidated record of my career. Contents:

```
.
├── README.md                          ← you are here (career overview)
├── highlights/
│   ├── professional/
│   │   ├── cosm.md                    ← Cosm: GPU video + virtual cameras (deep dive)
│   │   └── fox.md                     ← FOX: live-streaming backend + perf work (deep dive)
│   └── personal/
│       ├── kioku.md                   ← Kioku: agentic RAG second brain
│       ├── role-miner.md              ← RoleMiner: AI job hunter with memory
│       ├── socket-flow.md             ← socket-flow: Rust WebSocket library
│       └── artemis-network.md         ← Artemis: from-scratch blockchain
├── linkedin/
│   ├── linkedin.pdf                   ← original LinkedIn export
│   └── linkedin-en.md                 ← English (translated + cleaned) version
└── resume/
    ├── template.tex                   ← LaTeX résumé source
    ├── template.pdf                   ← compiled résumé
    └── twentysecondcv.cls / assets    ← LaTeX class + images/fonts
```

**Quick links:** [Résumé (PDF)](resume/template.pdf) · [Résumé (LaTeX)](resume/template.tex) · [LinkedIn (English)](linkedin/linkedin-en.md)
