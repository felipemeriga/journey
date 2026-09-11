/* Felipe Ramos da Silva — portfolio.
   Ported 1:1 from the Modernist design handoff (Design Component → vanilla JS).
   The canvas draw functions are the design's signature motion graphics and are
   reproduced verbatim; only the React ref / props / setState plumbing is replaced. */
(() => {
  'use strict';

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const MOTION = reduceMotion ? 'off' : 'cinematic'; // 'cinematic' | 'calm' | 'off'
  const DENSE_TIMELINE = true;

  // ─────────────────────────────────────────────────────────── data ──
  const roles = [
    { from: 2025.85, to: 2026.75, period: 'Nov 2025 — present', role: 'AI Solutions Engineer (independent)', company: 'Freelance / consulting', stack: 'Rust · Python · FastAPI · pgvector · MCP · LangGraph' },
    { from: 2025.35, to: 2026.75, period: 'May 2025 — present', role: 'Software Engineer, Real-Time Media', company: 'Kake @ Cosm', stack: 'Rust · Go · C++ · CUDA · WebRTC · AWS' },
    { from: 2021.2, to: 2025.35, period: 'Mar 2021 — May 2025', role: 'Software Engineer, Live Streaming', company: 'X-Team @ FOX', stack: 'Go · Rust · TypeScript · Kubernetes · HLS · SRT' },
    { from: 2020.2, to: 2021.2, period: 'Mar 2020 — Mar 2021', role: 'Blockchain Software Engineer', company: 'Tokenizer', stack: 'Solidity · EVM · Go · Rust · AWS' },
    { from: 2019.7, to: 2021.2, period: 'Sep 2019 — Mar 2021', role: 'Senior DevOps Engineer', company: 'Accenture, The Dock (Dublin)', stack: 'Go · Python · AWS · Terraform · Kubernetes' },
    { from: 2018, to: 2019.95, period: 'Jan 2018 — Dec 2019', role: 'Software Developer, IoT', company: 'IO-Shower', stack: 'C++ · Java · React Native · AWS IoT' },
    { from: 2019.2, to: 2019.7, period: 'Mar 2019 — Sep 2019', role: 'Development Analyst', company: 'Tata Consultancy Services', stack: 'Java · Spring · Angular · PL/SQL' },
    { from: 2017.85, to: 2019.2, period: 'Nov 2017 — Mar 2019', role: 'Development Consultant', company: 'CSG International', stack: 'Java · Python · Spring · Jenkins' },
    { from: 2017.7, to: 2017.85, period: 'Sep 2017 — Nov 2017', role: 'Embedded Software Developer', company: 'Zoe Slots', stack: 'C++ · Qt · microcontrollers' },
    { from: 2016.2, to: 2017.2, period: 'Mar 2016 — Mar 2017', role: 'Software Developer', company: 'LA2I — Intelligent Automation Lab', stack: 'Python · Qt · MySQL' },
    { from: 2015, to: 2016.2, period: 'Jan 2015 — Mar 2016', role: 'Automation Developer', company: 'Jirehmaq Automação Industrial', stack: 'C · C++ · Arduino · Raspberry Pi' },
  ];

  const projects = [
    { kicker: 'Rust · crates.io', meta: '★ 75', title: 'socket-flow', body: 'An async WebSocket library written from scratch on Tokio — RFC 6455 handshake, framing, masking, permessage-deflate, TLS and a split reader/writer. Passes the Autobahn suite for client and server.', stack: 'Rust · Tokio · tokio-rustls · flate2', href: 'https://github.com/felipemeriga/socket-flow', cta: 'View on GitHub →' },
    { kicker: 'Rust · P2P', meta: '★ 18', title: 'Artemis Network', body: 'A runnable blockchain node from the bytes up: SHA-256 proof of work, secp256k1 transactions, longest-valid-chain consensus, P2P discovery and a fee-prioritized mempool — five concurrent Tokio tasks sharing one chain.', stack: 'Rust · Tokio · secp256k1 · Sled', href: 'https://github.com/felipemeriga/artemis-network', cta: 'View on GitHub →' },
    { kicker: 'AI · MCP', meta: 'OSS', title: 'Kioku (記憶)', body: 'A self-hosted second brain for coding agents. Agentic RAG with hybrid search (vector + BM25 → RRF → rerank), automatic session memory, task→model routing with prompt caching and a CI-gated eval harness.', stack: 'Python · FastAPI · pgvector · TypeScript · Claude', href: 'https://github.com/felipemeriga/kioku', cta: 'View on GitHub →' },
    { kicker: 'AI · product', meta: 'Live', title: 'RoleMiner', body: 'An AI job hunter that learns from behaviour, not forms. An 18-tool agent loop over a dual-store memory — Mem0 for stated preferences, Postgres for behavioural signals — with decay, dedup, nudges and ~876 tests.', stack: 'Python · FastAPI · React 19 · Supabase · Anthropic · Mem0', href: 'https://roleminer.app/', cta: 'Open roleminer.app →' },
  ];

  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

  // ─────────────────────────────────────────── render data-driven DOM ──
  const grid = document.getElementById('projects-grid');
  projects.forEach((p, i) => {
    const a = document.createElement('article');
    a.setAttribute('data-reveal', '');
    a.style.cssText = 'background:var(--color-bg);padding:var(--space-4);display:flex;flex-direction:column;gap:var(--space-3);min-width:0';
    a.innerHTML =
      `<div style="display:flex;justify-content:space-between;gap:var(--space-2);font-size:13px;letter-spacing:0.08em;text-transform:uppercase;font-feature-settings:'tnum' 1"><span style="color:var(--color-accent-700)">${esc(p.kicker)}</span></div>` +
      `<div style="position:relative;height:150px;background:var(--color-surface)"><canvas id="p-canvas-${i}" aria-hidden="true" style="position:absolute;inset:0;width:100%;height:100%;display:block"></canvas></div>` +
      `<h3 style="font-size:22px;line-height:1.15;margin:0">${esc(p.title)}</h3>` +
      `<p style="font-size:14px;line-height:22px;margin:0;flex:1">${esc(p.body)}</p>` +
      `<div style="font-size:12px;color:var(--color-neutral-700);font-feature-settings:'tnum' 1">${esc(p.stack)}</div>` +
      `<a class="btn btn-secondary" href="${esc(p.href)}" target="_blank" rel="noreferrer" style="justify-content:flex-start;align-self:stretch">${esc(p.cta)}</a>`;
    grid.appendChild(a);
  });

  const rows = document.getElementById('timeline-rows');
  (DENSE_TIMELINE ? roles : roles.slice(0, 5)).forEach(r => {
    const d = document.createElement('div');
    d.setAttribute('data-reveal', '');
    d.className = 'tl-row';
    d.innerHTML =
      `<div class="tl-period" style="font-feature-settings:'tnum' 1;color:var(--color-neutral-700);font-size:13px;letter-spacing:0.04em">${esc(r.period)}</div>` +
      `<div><strong>${esc(r.role)}</strong><span style="color:var(--color-neutral-700)"> — ${esc(r.company)}</span></div>` +
      `<div class="tl-stack" style="font-size:13px;color:var(--color-neutral-700)">${esc(r.stack)}</div>`;
    rows.appendChild(d);
  });

  // ─────────────────────────────────────────────── canvas motion engine ──
  const INK = '#201e1d', RED = '#ec3013', BG = '#f3f2f2', TINT = '#ffe0d9', DEEP = '#ae1800', DARK = '#4d170e', MUTE = 'rgba(32,30,29,0.35)';
  const canvases = [];
  const trunc = (ctx, txt, maxW) => { if (ctx.measureText(txt).width <= maxW) return txt; while (txt.length > 1 && ctx.measureText(txt + '…').width > maxW) txt = txt.slice(0, -1); return txt + '…'; };
  const label = (ctx, txt, x, y, maxW) => ctx.fillText(trunc(ctx, txt, maxW), x, y);

  const ro = new ResizeObserver(entries => entries.forEach(e => { const o = canvases.find(x => x.c === e.target); o && o.fit(); }));
  const reg = (c, fn) => {
    if (!c) return;
    const ctx = c.getContext('2d');
    const o = { c, ctx, fn, W: 0, H: 0, state: {} };
    const fit = () => { const r = c.getBoundingClientRect(); const dpr = Math.min(2, devicePixelRatio || 1); o.W = r.width; o.H = r.height; c.width = o.W * dpr; c.height = o.H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
    fit(); ro.observe(c); o.fit = fit; canvases.push(o);
  };

  // — hero: the frame budget —
  const stages = [['DECODE', 3.6, 0.9], ['PROCESS', 4.2, 1.2], ['ENCODE', 4.0, 0.8], ['DELIVER', 1.4, 0.5]];
  const hist = new Array(60).fill(12);
  reg(document.getElementById('hero-canvas'), (ctx, W, H, t, frame) => {
    const pad = Math.min(40, W * 0.07);
    let total = 0; const seg = stages.map(([n, b, j], i) => { const v = Math.max(0.4, b + j * Math.sin(t * (5 + i * 2.3) + i) * 0.6 + (Math.sin(t * 13 + i * 7) > 0.995 ? 2.5 : 0)); total += v; return [n, v]; });
    hist[frame % 60] = total;
    const cw = 26, gap = 6, off = (t * 60 % 1) * (cw + gap);
    const n = Math.ceil(W / (cw + gap)) + 2;
    for (let i = 0; i < n; i++) { const idx = Math.floor(t * 60) + i; const x = W - pad - i * (cw + gap) + off - cw; const type = idx % 12 === 0 ? 'I' : idx % 3 === 0 ? 'P' : 'B'; const cur = i === 1, over = total > 16.7; ctx.fillStyle = cur ? (over ? DARK : BG) : type === 'I' ? '#ffc4b8' : 'rgba(243,242,242,0.28)'; ctx.fillRect(x, pad, cw, cw); if (cur) { ctx.strokeStyle = BG; ctx.lineWidth = 2; ctx.strokeRect(x + 1, pad + 1, cw - 2, cw - 2); } ctx.fillStyle = cur ? (over ? BG : RED) : DARK; ctx.font = '800 11px Archivo'; ctx.textAlign = 'center'; ctx.fillText(type, x + cw / 2, pad + 17); ctx.textAlign = 'left'; }
    ctx.fillStyle = BG; ctx.font = '600 10px Archivo'; label(ctx, 'INCOMING GOP  ·  I / P / B  ·  60 fps', pad, pad + cw + 16, W - pad * 2);
    const big = Math.min(150, W * 0.28, H * 0.2), by0 = pad + cw + 36;
    ctx.font = `800 ${big}px Archivo`; ctx.letterSpacing = '-0.04em'; ctx.fillStyle = total > 16.7 ? DARK : BG;
    const numTxt = total.toFixed(1); ctx.fillText(numTxt, pad - big * 0.05, by0 + big * 0.78); ctx.fillStyle = BG;
    const numW = ctx.measureText(numTxt).width;
    ctx.font = `800 ${big * 0.28}px Archivo`; ctx.letterSpacing = '0'; ctx.fillText('ms', pad + numW + big * 0.04, by0 + big * 0.78);
    ctx.font = '600 12px Archivo'; label(ctx, `FRAME ${String(frame).padStart(7, '0')}   PTS ${(t * 90000) | 0}   BUDGET 16.7 ms   ${total < 16.7 ? 'ON TIME' : 'OVER BUDGET'}`, pad, by0 + big * 0.78 + 30, W - pad * 2);
    const by = by0 + big * 0.78 + 56, bh = 24, bw = W - pad * 2;
    ctx.fillStyle = DARK; ctx.fillRect(pad, by, bw, bh);
    let x = pad; seg.forEach(([nm, v], i) => { const w = bw * v / 16.7; ctx.fillStyle = i % 2 ? '#ffc4b8' : BG; ctx.fillRect(x, by, Math.max(0, w - 2), bh); if (w > 64) { ctx.fillStyle = DARK; ctx.font = '600 10px Archivo'; ctx.fillText(`${nm} ${v.toFixed(1)}`, x + 6, by + 16); } x += w; });
    ctx.fillStyle = BG; ctx.font = '600 10px Archivo'; ctx.fillText('0', pad, by + bh + 16); ctx.textAlign = 'right'; ctx.fillText('16.7', pad + bw, by + bh + 16); ctx.textAlign = 'left';
    const gy = by + bh + 40, gh = Math.min(200, Math.max(50, H - gy - pad - 22)), sw = bw / 60, line = gy + gh - gh * 16.7 / 20;
    ctx.fillStyle = 'rgba(243,242,242,0.4)'; ctx.fillRect(pad, line, bw, 1);
    for (let i = 0; i < 60; i++) { const v = hist[i], h = gh * Math.min(20, v) / 20, cur = i === frame % 60; ctx.fillStyle = cur ? BG : v > 16.7 ? DEEP : 'rgba(243,242,242,0.7)'; ctx.fillRect(pad + i * sw, gy + gh - h, sw - 2, h); }
    ctx.fillStyle = BG; ctx.fillText('LAST 60 FRAMES · 1 s', pad, gy + gh + 16); ctx.textAlign = 'right'; ctx.fillText('16.7 ms', pad + bw, line - 6); ctx.textAlign = 'left';
  });

  // — Cosm: tiles + virtual camera following the puck —
  reg(document.getElementById('cosm-canvas'), (ctx, W, H, t, frame, s) => {
    const COLS = 9, ROWS = 5, tw = W / COLS, th = H / ROWS;
    const dash = Math.pow(Math.sin(t * 0.5), 9);
    const px = 0.5 + 0.38 * Math.sin(t * 0.3) + 0.1 * dash * Math.cos(t * 3), py = 0.5 + 0.3 * Math.sin(t * 0.5 + 1) * Math.cos(t * 0.2);
    s.cx = (s.cx ?? 0.5) + (px - s.cx) * 0.07; s.cy = (s.cy ?? 0.5) + (py - s.cy) * 0.07;
    const cw = W * 0.3, ch = cw * 9 / 16, rx = s.cx * W - cw / 2, ry = s.cy * H - ch / 2;
    for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) { const x = i * tw, y = j * th, hit = x < rx + cw && x + tw > rx && y < ry + ch && y + th > ry; if (hit) { ctx.fillStyle = TINT; ctx.fillRect(x, y, tw, th); } ctx.strokeStyle = 'rgba(32,30,29,0.2)'; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, tw, th); }
    ctx.setLineDash([5, 5]); ctx.strokeStyle = INK; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = INK; ctx.font = '800 10px Archivo'; ctx.fillText('NVDEC 0', 8, H - 8); ctx.textAlign = 'right'; ctx.fillText('NVDEC 1', W - 8, H - 8); ctx.textAlign = 'left';
    ctx.strokeStyle = RED; ctx.lineWidth = 2; ctx.strokeRect(rx, ry, cw, ch);
    const lx = Math.min(Math.max(0, rx), W - 112), ly = Math.max(18, ry); ctx.fillStyle = RED; ctx.fillRect(lx, ly - 18, 112, 18); ctx.fillStyle = BG; ctx.fillText('VIRTUAL CAM 60 FPS', lx + 6, ly - 5);
    ctx.fillStyle = RED; ctx.fillRect(px * W - 4, py * H - 4, 8, 8);
    ctx.fillStyle = INK; label(ctx, `8K FISHEYE · 9×7 TILES · PTS ${(t * 90000) | 0}`, 8, 14, W / 2 - 20);
  });

  // — FOX: validation loop collapsing 6 min → 3 s, goroutine lanes —
  reg(document.getElementById('fox-canvas'), (ctx, W, H, t, frame) => {
    const cyc = (t % 6) / 6, e = cyc < 0.55 ? 0 : Math.min(1, (cyc - 0.55) / 0.3), ease = 1 - Math.pow(1 - e, 3);
    const secs = 360 - (360 - 2.7) * ease, pad = 12, bw = W - pad * 2;
    ctx.fillStyle = INK; ctx.font = '800 10px Archivo'; label(ctx, 'CHANNEL VALIDATION LOOP · ALL CHANNELS', pad, 16, bw);
    ctx.fillStyle = 'rgba(32,30,29,0.15)'; ctx.fillRect(pad, 26, bw, 14); ctx.fillStyle = e < 1 ? INK : RED; ctx.fillRect(pad, 26, bw * secs / 360, 14);
    ctx.font = `800 ${Math.min(44, W * 0.12)}px Archivo`; ctx.letterSpacing = '-0.03em'; ctx.fillStyle = e < 1 ? INK : RED;
    const m = Math.floor(secs / 60), sc = secs % 60; ctx.fillText(`${m}:${sc.toFixed(1).padStart(4, '0')}`, pad - 2, 88); ctx.letterSpacing = '0';
    ctx.fillStyle = INK; ctx.font = '600 10px Archivo'; label(ctx, e < 0.05 ? 'BEFORE · rebuilding shared context per goroutine' : e < 1 ? 'PROFILING · pprof · heap · trace · flame graph' : 'AFTER · shared context reused · −60% CPU / MEM', pad, 104, bw);
    const lanes = 12, ly = 116, lh = (H - ly - pad) / lanes;
    for (let i = 0; i < lanes; i++) { const y = ly + i * lh; const speed = 0.3 + (1 - ease) * 0.0 + ease * 3; const ph = ((t * speed + i * 0.37) % 1); const w = bw * (0.06 + 0.12 * (1 - ease)); const x = pad + ph * (bw - w); ctx.fillStyle = 'rgba(32,30,29,0.08)'; ctx.fillRect(pad, y + 1, bw, lh - 2); ctx.fillStyle = e < 1 ? 'rgba(32,30,29,0.55)' : RED; ctx.fillRect(x, y + 1, w, lh - 2); }
  });

  // — projects —
  reg(document.getElementById('p-canvas-0'), (ctx, W, H, t) => { // websocket frames streaming as bytes
    const bs = 12, gap = 3, per = bs + gap, off = (t * 90) % per, n = Math.ceil(W / per) + 2;
    ctx.fillStyle = INK; ctx.font = '800 10px Archivo'; label(ctx, 'RFC 6455 · FRAME STREAM · MASKED', 8, 14, W - 16);
    for (let row = 0; row < 3; row++) for (let i = 0; i < n; i++) { const idx = Math.floor(t * 90 / per) + i + row * 31; const x = W - i * per + off - bs, y = 34 + row * 30; const hdr = idx % 9 === 0, mask = idx % 9 > 0 && idx % 9 < 5; ctx.fillStyle = hdr ? RED : mask ? '#ffc4b8' : 'rgba(32,30,29,0.25)'; ctx.fillRect(x, y, bs, bs); if (hdr) { ctx.fillStyle = INK; ctx.font = '600 9px Archivo'; ctx.fillText(['FIN', 'TXT', 'BIN', 'PNG'][idx % 4], x, y + 22); } }
    ctx.fillStyle = INK; ctx.font = '600 10px Archivo'; label(ctx, 'handshake → decode → inflate → WSReader', 8, H - 8, W - 16);
  });
  reg(document.getElementById('p-canvas-1'), (ctx, W, H, t) => { // blocks mined and chained
    const bw = 76, gap = 22, per = bw + gap, prog = (t * 0.6) % 1, n = Math.ceil(W / per) + 2, base = Math.floor(t * 0.6);
    ctx.fillStyle = INK; ctx.font = '800 10px Archivo'; label(ctx, 'PROOF OF WORK · SHA-256 · LONGEST CHAIN', 8, 14, W - 16);
    for (let i = 0; i < n; i++) { const h = base - i, x = W - 16 - (i + 1) * per + prog * per, y = 40; if (h < 0) continue; const mining = i === 0; ctx.fillStyle = mining ? BG : TINT; ctx.fillRect(x, y, bw, 56); ctx.strokeStyle = mining ? RED : INK; ctx.lineWidth = 2; ctx.strokeRect(x, y, bw, 56); ctx.fillStyle = INK; ctx.font = '800 11px Archivo'; ctx.fillText(`#${h}`, x + 6, y + 16); ctx.font = '600 9px Archivo'; ctx.fillStyle = mining ? RED : INK; ctx.fillText(mining ? `nonce ${((t * 1e5) % 1e6) | 0}` : `00000${((h * 2654435761) >>> 0).toString(16).slice(0, 6)}`, x + 6, y + 32); ctx.fillStyle = INK; ctx.fillText(`${(h * 7) % 13 + 1} tx`, x + 6, y + 46); if (i > 0) { ctx.strokeStyle = INK; ctx.beginPath(); ctx.moveTo(x + bw, y + 28); ctx.lineTo(x + bw + gap, y + 28); ctx.stroke(); } }
    ctx.fillStyle = INK; ctx.font = '600 10px Archivo'; label(ctx, 'server · miner · sync · broadcaster · discover', 8, H - 8, W - 16);
  });
  reg(document.getElementById('p-canvas-2'), (ctx, W, H, t) => { // memory graph forming
    ctx.fillStyle = INK; ctx.font = '800 10px Archivo'; label(ctx, 'HYBRID RETRIEVAL · VECTOR + BM25 → RRF → RERANK', 8, 14, W - 16);
    const N = 22, pts = []; for (let i = 0; i < N; i++) { const a = i * 2.399 + t * 0.08, r = 0.25 + 0.7 * ((i * 0.618) % 1); pts.push([W / 2 + Math.cos(a) * r * W * 0.42, H / 2 + 6 + Math.sin(a * 1.3 + t * 0.2) * r * H * 0.28]); }
    const q = Math.floor(t * 0.7) % N, qp = pts[q];
    ctx.lineWidth = 1; pts.forEach((p, i) => { const d = Math.hypot(p[0] - qp[0], p[1] - qp[1]); if (i !== q && d < W * 0.3) { ctx.strokeStyle = `rgba(236,48,19,${0.9 - d / (W * 0.3)})`; ctx.beginPath(); ctx.moveTo(qp[0], qp[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); } });
    pts.forEach((p, i) => { const d = Math.hypot(p[0] - qp[0], p[1] - qp[1]); const hit = d < W * 0.18; ctx.fillStyle = i === q ? RED : hit ? '#ae1800' : 'rgba(32,30,29,0.4)'; const s = i === q ? 10 : hit ? 7 : 5; ctx.fillRect(p[0] - s / 2, p[1] - s / 2, s, s); });
    ctx.fillStyle = INK; ctx.font = '600 10px Archivo'; label(ctx, `query → top-k ${pts.filter(p => Math.hypot(p[0] - qp[0], p[1] - qp[1]) < W * 0.18).length - 1} chunks · rerank-2 · neighbors`, 8, H - 8, W - 16);
  });
  reg(document.getElementById('p-canvas-3'), (ctx, W, H, t) => { // agent loop: tools firing, memory saved
    const tools = ['search_jobs', 'score_jobs', 'recall_prefs', 'save_pref', 'apply', 'dismiss'];
    ctx.fillStyle = INK; ctx.font = '800 10px Archivo'; label(ctx, 'AGENT LOOP · 18 TOOLS · DUAL-STORE MEMORY', 8, 14, W - 16);
    const it = Math.floor(t * 1.2) % 8, cur = Math.floor(t * 1.2) % tools.length, colW = (W - 16) / tools.length;
    tools.forEach((n, i) => { const x = 8 + i * colW, on = i === cur; ctx.fillStyle = on ? RED : 'rgba(32,30,29,0.12)'; ctx.fillRect(x, 28, colW - 4, 20); ctx.fillStyle = on ? BG : INK; ctx.font = '600 9px Archivo'; ctx.fillText(n.slice(0, Math.floor((colW - 10) / 5.5)), x + 4, 42); });
    for (let i = 0; i < 8; i++) { ctx.fillStyle = i <= it ? RED : 'rgba(32,30,29,0.15)'; ctx.fillRect(8 + i * 18, 60, 14, 6); }
    ctx.fillStyle = INK; ctx.font = '600 10px Archivo'; ctx.fillText(`iteration ${it + 1} / 8`, 8 + 8 * 18 + 6, 66);
    const mem = ['hard_constraint · remote only', 'preference · Rust + Go', 'dislike · on-call rotations', 'outcome · offer accepted'];
    mem.forEach((m, i) => { const vis = ((t * 0.25 + i * 0.25) % 1); ctx.fillStyle = `rgba(32,30,29,${0.35 + 0.65 * Math.sin(vis * Math.PI)})`; label(ctx, m, 8, 90 + i * 15, W - 84); });
    ctx.fillStyle = RED; ctx.fillRect(W - 60, 84, 52, 52); ctx.fillStyle = BG; ctx.font = '800 9px Archivo'; ctx.fillText('MEM0', W - 52, 104); ctx.fillText('+ PG', W - 52, 118);
  });

  // — timeline playhead: sweep across 2015→2026 —
  reg(document.getElementById('tl-canvas'), (ctx, W, H, t) => {
    const y0 = 2015, y1 = 2026.75, X = y => (y - y0) / (y1 - y0) * W;
    for (let y = 2015; y <= 2026; y++) { const x = X(y); ctx.fillStyle = 'rgba(32,30,29,0.35)'; ctx.fillRect(x, 0, 1, H); ctx.fillStyle = INK; ctx.font = '600 10px Archivo'; ctx.fillText(String(y), x + 4, 12); }
    roles.forEach((r, i) => { const x = X(r.from), w = X(r.to) - x; ctx.fillStyle = i < 3 ? RED : 'rgba(32,30,29,0.35)'; ctx.fillRect(x, 20 + (i % 4) * 12, Math.max(4, w), 8); });
    const ph = X(y0 + ((t * 0.9) % (y1 - y0))); ctx.fillStyle = INK; ctx.fillRect(ph, 0, 2, H);
  });

  // ─────────────────────────────────────────────────── animation loop ──
  let frame = 0, raf = 0, stopped = false;
  const t0 = performance.now();
  const loop = now => {
    const mode = MOTION, speed = mode === 'calm' ? 0.5 : 1;
    const t = (now - t0) / 1000 * speed; frame++;
    canvases.forEach(o => { const r = o.c.getBoundingClientRect(); if (r.bottom < 0 || r.top > innerHeight || r.width === 0 || r.height === 0) return; o.ctx.clearRect(0, 0, o.W, o.H); o.fn(o.ctx, o.W, o.H, t, frame, o.state); });
    if (mode !== 'off') raf = requestAnimationFrame(loop); else stopped = true;
  };
  // wait for the webfont so text metrics/measure are correct on first frames
  const start = () => { raf = requestAnimationFrame(loop); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
  // in reduced-motion (single-frame) mode, redraw offscreen canvases as they scroll in
  const onScroll = () => { if (stopped) { stopped = false; raf = requestAnimationFrame(loop); } };
  addEventListener('scroll', onScroll, { passive: true });

  // ────────────────────────────────────── scroll reveal + nav progress ──
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
  document.querySelectorAll('[data-reveal],[data-reveal-rule]').forEach(el => io.observe(el));

  const progEl = document.getElementById('nav-progress');
  const prog = () => { if (!progEl) return; const max = document.documentElement.scrollHeight - innerHeight; progEl.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`; };
  prog(); addEventListener('scroll', prog, { passive: true }); addEventListener('resize', prog);

  // ───────────────────────────────────────────────────── stat counters ──
  const elRepos = document.getElementById('stat-repos'), elFollowers = document.getElementById('stat-followers'), elStars = document.getElementById('stat-stars');
  const t1 = performance.now();
  const tick = now => { const p = Math.min(1, (now - t1) / 1400), e = 1 - Math.pow(1 - p, 3); if (elRepos) elRepos.textContent = Math.round(80 * e) + '+'; if (elFollowers) elFollowers.textContent = String(Math.round(169 * e)); if (elStars) elStars.textContent = String(Math.round(75 * e)); if (p < 1) requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
})();
