# socket-flow — An Async WebSocket Library for Rust, Built From Scratch

## Project Overview

**socket-flow** is a personal project I designed and built: a lightweight, async **WebSocket library for Rust**, implementing the [WebSocket Protocol (RFC 6455)](https://datatracker.ietf.org/doc/html/rfc6455) from the ground up on top of the Tokio runtime.

Rather than wrapping an existing WebSocket implementation, I built the protocol itself — the handshake, frame reading and parsing, masking, opcode handling, payload management, close semantics, and the `permessage-deflate` compression extension. It works as both a **server and a client**, supports TLS, and is published on [crates.io](https://crates.io/crates/socket-flow).

I built this as a way to go deep on **low-level network protocol implementation, async Rust, and Tokio internals** — the kind of systems work that sits underneath the higher-level real-time video and distributed-systems work I do professionally. It was inspired by well-established libraries like `tungstenite-rs` and `tokio-tungstenite`, with a goal of offering a more accessible, batteries-included API while staying flexible and performant.

Its correctness is validated against the industry-standard **Autobahn Test Suite**, the same conformance suite the reference WebSocket implementations use.

---

## What It Does

- **Full RFC 6455 implementation** — handshake with key parsing/generation, frame reading and parsing, mask and opcode handling, and payload management.
- **Server and client** — accept incoming connections or dial out, both fully async.
- **All frame types** — `Text`, `Binary`, `Ping`, `Pong`, `Close`, and `Continuation` (fragmented messages).
- **Plug-and-play or fully configurable** — spin up a server in a handful of lines with `start_server`, or drop down to `accept_async_with_config` / `connect_async_with_config` for full control.
- **Built-in compression** — `permessage-deflate` compression/decompression with negotiation, enabled through config rather than requiring the caller to wire it up manually.
- **TLS support** — secure connections via `tokio-rustls`.
- **Split reader/writer** — the connection can be split into independent read and write halves for concurrent send/receive patterns.
- **Autobahn-compliant** — passes the Autobahn Test Suite for both client and server conformance.

---

## Architecture

The library is organized into focused modules, each owning one part of the WebSocket lifecycle. Everything is built directly on `tokio::TcpStream`.

```text
                 TCP (tokio::TcpStream)  /  TLS (tokio-rustls)
                                 │
                          ┌──────▼──────┐
                          │  handshake  │  RFC 6455 upgrade: key parse/generate,
                          └──────┬──────┘  extension negotiation
                                 │
                  ┌──────────────▼──────────────┐
                  │          connection         │
                  │  ┌────────┐      ┌────────┐  │
                  │  │  read  │      │ write  │  │
                  │  └───┬────┘      └───┬────┘  │
                  │      │               │       │
                  │  ┌───▼────┐     ┌────▼───┐   │
                  │  │decoder │     │encoder │   │  frame ↔ bytes
                  │  └───┬────┘     └────┬───┘   │
                  │      │               │       │
                  │  ┌───▼───────────────▼───┐   │
                  │  │      extensions       │   │  permessage-deflate
                  │  │  (compress/decompress)│   │  (flate2 / zlib)
                  │  └───────────────────────┘   │
                  └──────────────┬───────────────┘
                                 │
                     ┌───────────▼───────────┐
                     │   event / message API │  EventStream, WSReader, WSWriter
                     └───────────────────────┘
```

Key modules:

- **`handshake`** — performs the RFC 6455 HTTP upgrade, generates/validates the `Sec-WebSocket-Accept` key, and negotiates extensions.
- **`frame` / `decoder` / `encoder`** — the wire format: parsing incoming frames (opcode, mask, length, payload) and serializing outgoing ones.
- **`read` / `write`** — the async I/O halves driving the socket.
- **`split`** — exposes `WSReader` (implements `futures::Stream`) and `WSWriter` so an application can read and write concurrently.
- **`extensions`** — `permessage-deflate` compression/decompression with per-connection context management.
- **`server` / `connection` / `event`** — the high-level API: `start_server` returns an `EventStream` emitting `NewClient`, `NewMessage`, `Disconnect`, and `Error` events.
- **`config`** — tunable parameters (`max_frame_size`, `max_message_size`, extension options).
- **`stream`** — abstracts plain TCP vs. TLS behind a single `SocketFlowStream`.

---

## Two API Styles

A design goal was to make the easy case trivial and the advanced case possible.

**Plug-and-play** — `start_server` handles connections, messages, errors, and disconnections, surfacing everything as an event stream:

```rust
match start_server(port).await {
    Ok(mut event_receiver) => {
        let mut clients: HashMap<ID, WSWriter> = HashMap::new();
        while let Some(event) = event_receiver.next().await {
            match event {
                Event::NewClient(id, conn) => { clients.insert(id, conn); }
                Event::NewMessage(id, msg) => {
                    if let Some(w) = clients.get_mut(&id) { w.send_message(msg).await.unwrap(); }
                }
                Event::Disconnect(id) => { clients.remove(&id); }
                Event::Error(id, err) => { error!("client {id}: {err:?}"); }
            }
        }
    }
    Err(err) => eprintln!("Could not start the server: {err:?}"),
}
```

**Fully configurable** — `accept_async_with_config` / `connect_async_with_config` take a `WebSocketConfig`, letting the caller set frame/message size limits and enable compression declaratively:

```rust
let mut config = WebSocketConfig::default();
config.extensions = Some(Extensions {
    permessage_deflate: true,
    client_no_context_takeover: Some(true),
    server_no_context_takeover: Some(true),
    client_max_window_bits: None,
    server_max_window_bits: None,
});
```

---

## Compression Made Automatic

One thing I deliberately did better than the libraries I referenced: **compression is a config flag, not a project**. With other libraries you often only get basic context management (reset or reuse) and have to implement advanced `permessage-deflate` behaviour yourself.

In socket-flow, enabling `permessage_deflate` makes the connection negotiate the extension automatically and handle compression/decompression transparently. The caller can tune compression level, memory usage, and whether the compression context is reset or kept between messages — and by default the library only compresses payloads above a size threshold, avoiding waste on tiny frames.

---

## Correctness & Benchmarking

- **Autobahn Test Suite** — the library passes the standard WebSocket conformance suite for both client and server roles. I set up the tooling to run the Autobahn `wstest` fuzzing containers against the example echo server, with expected-results baselines checked into the repo.
- **Internal test suite** — unit and integration tests covering framing, opcodes, and connection behaviour.
- **Load testing with k6** — I built a benchmarking harness (Dockerized echo server + k6 script) to compare socket-flow against `tokio-tungstenite` in production-like Kubernetes environments. Across iterations, socket-flow showed slightly higher throughput, fewer dropped connections under high load, and marginally better average latency.

---

## Key Technical Contributions

Everything in this library was designed and implemented by me:

- Implementing the **WebSocket protocol (RFC 6455) from scratch** on top of `tokio::TcpStream` — no wrapping of an existing WS crate.
- Writing the **handshake** logic including `Sec-WebSocket-Accept` key generation/validation and extension negotiation.
- Building the **frame decoder and encoder** — opcode handling, masking, length parsing, and payload management across all frame types including fragmented `Continuation` frames.
- Implementing a **split reader/writer** model with `WSReader` as a `futures::Stream` and `WSWriter` for concurrent I/O.
- Adding **`permessage-deflate` compression** with negotiation, per-connection context management, tunable parameters, and a size threshold — exposed as a single config flag.
- Providing **TLS support** via `tokio-rustls` behind a unified stream abstraction covering plain and secure transports.
- Designing a **dual API** — a plug-and-play event-stream server plus fully configurable accept/connect entry points.
- Achieving **Autobahn Test Suite conformance** for both client and server, with reproducible test tooling.
- Building a **k6 load-testing harness** to benchmark against `tokio-tungstenite` in Kubernetes.
- **Publishing and maintaining** the crate on crates.io with examples, TLS/config guides, and contribution docs.

---

## Technologies

### Language / Runtime

- Rust (2021 edition)
- Tokio (async runtime, `TcpStream`)
- `futures` / `tokio-stream` (Stream-based APIs)

### Protocol / Networking

- WebSocket Protocol (RFC 6455)
- `permessage-deflate` compression (via `flate2` / zlib)
- TLS via `tokio-rustls` + `rustls` (+ `webpki-roots`, `rustls-pemfile`)
- SHA-1 + Base64 for the handshake accept key

### Tooling / Quality

- Autobahn Test Suite (conformance)
- k6 (load testing) + Docker + Kubernetes
- `thiserror` (error modeling), `uuid`, `serde`
- Published on crates.io

---

## Project Significance

socket-flow is the personal project where I went deepest on **low-level protocol engineering in async Rust**. Implementing RFC 6455 by hand meant reasoning carefully about the wire format, framing and fragmentation, masking rules, close handshakes, back-pressure, and the subtle correctness requirements that a conformance suite like Autobahn exists to catch.

It's a good complement to my professional work: the real-time video and streaming systems I build sit on top of exactly these kinds of protocols, and building one from the bytes up gave me a much sharper understanding of what happens beneath the abstractions. It also reflects how I like to build libraries — make the common path effortless (a server in a dozen lines), keep the advanced path fully open (declarative config, split I/O, custom TLS), and prove correctness against an industry-standard suite rather than trusting it works.

Repository: https://github.com/felipemeriga/socket-flow
Crate: https://crates.io/crates/socket-flow
