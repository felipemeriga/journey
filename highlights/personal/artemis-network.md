# Artemis Network — A Blockchain, Built From Scratch in Rust

## Project Overview

**Artemis Network** is a personal project I designed and built: a lightweight but fully functional **blockchain / cryptocurrency network implemented from scratch in Rust**. It demonstrates the core mechanisms of a production cryptocurrency network — proof-of-work mining, ECDSA-signed transactions, longest-chain consensus, and peer-to-peer networking — with the complexity reduced enough that the design stays legible.

I built it to go deep on the intersection of the areas I care about most: **distributed systems, concurrent async Rust, cryptography, and networking protocols**. Rather than using an existing blockchain framework, I implemented every layer myself — the block and transaction structures, the PoW miner, the mempool, the P2P protocol, peer discovery, chain synchronization, the embedded database, and the wallet cryptography.

It is explicitly an educational project — it prioritizes clarity and learning value over production optimization — but it's a complete, runnable multi-node network: spin up several nodes, they discover each other, mine, broadcast, and converge on a shared chain.

---

## What It Does

- **Proof-of-Work mining** — SHA-256 hashing against a difficulty target (5 leading zeros), with nonce search and coinbase/miner rewards.
- **Signed transactions** — secp256k1 / ECDSA key pairs, address derivation, signature creation and verification.
- **Longest-chain consensus** — nodes converge on the longest *valid* chain (the Bitcoin rule), with full chain validation and replacement.
- **P2P networking** — a TCP peer protocol for propagating blocks and transactions, plus peer discovery and registration.
- **A mempool** — a fee-prioritized transaction pool with double-spend prevention and mining-interruption handling.
- **Persistence** — an embedded database (Sled) with block/transaction storage and address-based indexing for balance calculation.
- **An HTTP RPC API** — submit transactions, query blocks/balances/transactions, create wallets, and health-check nodes.
- **A capped supply** — a 21,000,000-coin maximum, mirroring Bitcoin's monetary policy.

---

## Architecture

Artemis uses a **concurrent, component-based architecture**. A central orchestrator (`node.rs`) spawns five long-running components as independent Tokio tasks, all coordinating through shared state and message passing.

```text
                          ┌───────────────┐
                          │    node.rs    │  orchestrator
                          └───────┬───────┘
             spawns concurrent Tokio tasks, shares state
   ┌──────────┬──────────┬───────┴────────┬──────────────┐
   │          │          │                │              │
┌──▼───┐  ┌───▼───┐  ┌───▼──┐        ┌────▼─────┐  ┌──────▼─────┐
│Server│  │ Miner │  │ Sync │        │Broadcaster│  │  Discover  │
│TCP + │  │ PoW   │  │longest│        │ propagate │  │peer discov.│
│HTTP  │  │ mining│  │chain  │        │ blocks/txs│  │+ register  │
└──┬───┘  └───┬───┘  └───┬──┘        └────┬─────┘  └──────┬─────┘
   │          │          │                │              │
   └──────────┴──────────┴────────┬───────┴──────────────┘
                                   │  shared state
              ┌────────────────────▼─────────────────────┐
              │  Arc<RwLock<Blockchain>>  ·  Arc<Mutex<>> │
              │  pools / peers  ·  mpsc channels          │
              └────────────────────┬─────────────────────┘
                                   │
         blockchain · block · transaction · pool · wallet · db
```

The five concurrent components:

- **Server** — hosts both the TCP (P2P) and HTTP (RPC) servers.
- **Miner** — runs proof-of-work block mining.
- **Sync** — periodically synchronizes the local chain with peers.
- **Broadcaster** — propagates new transactions and blocks across the network.
- **Discover** — finds and registers peers.

They safely share a single blockchain via `Arc<RwLock<Blockchain>>`, share pools/peers via `Arc<Mutex<>>`, and use `mpsc` channels for cross-task signaling (e.g. Server → Miner block notifications). Startup ordering is coordinated with flags like `first_discover_done` and `first_sync_done`.

---

## Interesting Engineering

A few parts I found especially worth getting right:

### The transaction pool (mempool)

The pool coordinates **four data structures** to be both fast and correct:

```rust
pub struct TransactionPool {
    pub heap: BinaryHeap<Transaction>,            // priority queue (max-heap, by fee)
    pub tx_map: HashMap<String, Transaction>,     // O(1) lookup by hash
    pub removed_set: HashSet<String>,             // lazy deletion
    pub pending_map: HashMap<String, Transaction>,// currently being mined
}
```

Because a `BinaryHeap` can't cheaply remove an arbitrary element, I used a **lazy-deletion pattern** — removed hashes go into `removed_set` and are skipped when popped — so the miner always pulls the highest-fee transaction without paying for mid-heap deletions. The `pending_map` tracks in-flight transactions so a mining interruption (a competing block arriving) can return them to the pool rather than lose them, and conflict resolution prevents double-spends.

### Consensus & mining interruption

Consensus is the **longest valid chain rule**: on sync, a peer's chain replaces the local one only if it's longer *and* passes full validation. This is coordinated with the miner — when a longer chain or a new block lands mid-mine, the current mining attempt is interrupted and restarted against the updated head, so a node never wastes work extending a stale chain or produces a fork it would immediately discard.

### From-scratch cryptography & persistence

Wallets are real secp256k1 key pairs with addresses derived from public keys and ECDSA signatures verified on every transaction. Blocks and transactions are persisted in an embedded **Sled** database with an address-based index, so balances and wallet history are computed from stored transaction history rather than held only in memory — the chain survives restarts.

---

## Key Technical Contributions

Everything in this project was designed and implemented by me:

- Implementing a **complete blockchain node from scratch in Rust** — no blockchain framework.
- Building **proof-of-work mining** with SHA-256, a difficulty target, nonce search, coinbase rewards, and interruptible mining loops.
- Implementing **secp256k1 / ECDSA** wallet cryptography — key generation, address derivation, signing, and verification.
- Designing the **transaction pool** with a fee-priority `BinaryHeap`, lazy deletion, pending-transaction tracking, and double-spend prevention.
- Implementing **longest-valid-chain consensus** with full chain validation, replacement, and fork resolution.
- Building a **P2P networking layer** over TCP with message routing, plus a peer-discovery and registration protocol.
- Writing the **synchronization** logic that keeps nodes converged and coordinates with the miner.
- Designing a **concurrent, component-based architecture** with five independent Tokio tasks sharing state via `Arc<RwLock>` / `Arc<Mutex>` and `mpsc` channels, with coordinated startup ordering.
- Implementing **persistence** on the Sled embedded database with block/transaction storage and address indexing for balance calculation.
- Exposing an **HTTP RPC API** for submitting transactions and querying chain state, wallets, and blocks.
- Packaging a **multi-node dev setup** (per-node YAML configs, Docker + docker-compose) so a full network can be run locally.
- Writing **extensive concept documentation** (mining, transactions, consensus, networking, mempool, cryptography, storage) alongside the code.

---

## Technologies

### Language / Runtime

- Rust
- Tokio (async runtime; each component is an independent task)

### Cryptography

- secp256k1 / ECDSA (signing + verification)
- SHA-256 (proof-of-work hashing)
- Public-key-derived addresses

### Distributed Systems / Networking

- Custom P2P protocol over TCP
- Peer discovery + registration
- Longest-valid-chain consensus
- Block/transaction broadcasting and synchronization
- Shared state via `Arc<RwLock>` / `Arc<Mutex>`, `mpsc` channels

### Storage / API

- Sled embedded database (block/tx storage + address indexing)
- HTTP RPC API
- YAML-based per-node configuration
- `thiserror` for error modeling

### Tooling

- Docker + docker-compose (multi-node network)
- CI (GitHub Actions)

---

## Project Significance

Artemis Network is the personal project where I brought together the threads that define my engineering interest — **distributed systems, concurrency, cryptography, and networking** — in a single, self-contained system. A blockchain is a surprisingly complete distributed-systems problem: independent nodes with partial views, a consensus rule to reconcile them, adversarial correctness requirements around double-spends and forks, and a concurrency model where mining, syncing, and networking all run at once against shared state.

Building it from scratch forced me to reason carefully about exactly the failure modes distributed systems care about: what happens when two nodes mine at once, how a node abandons stale work when a longer chain arrives, how the mempool stays consistent under interruption, and how to keep five concurrent Tokio tasks safe around one authoritative chain. It's a strong complement to my professional work in real-time and distributed backend systems — same fundamentals, expressed all the way down to the bytes and the cryptography.

Repository: https://github.com/felipemeriga/artemis-network
