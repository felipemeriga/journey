# Fox / Disney — Real-Time Video Engineering & Distributed Systems

## Role Overview

I worked as a Software Engineer at Fox / Disney, where I focused primarily on **real-time video systems, distributed backend infrastructure, and live-streaming workloads**.

This was one of my first major professional experiences working deeply with video and real-time systems, an area I have continued working in since approximately **2020**.

My broader engineering specialization includes:

- Real-time video and media systems
- Distributed systems
- Real-time data processing
- Backend infrastructure
- High-performance systems
- Rust and Go development

At Fox / Disney, most of the backend services I worked with were written in **Go and Rust**, with additional technologies including TypeScript, React, AWS, Kubernetes, WebRTC, SRT, HLS, DASH, and other video-streaming infrastructure.

---

## Live Streaming Platform

The platform supported several Fox broadcast television channels that were also distributed as live streams over the internet.

The engineering infrastructure had to continuously ingest, process, encode, distribute, and monitor these live channels across the United States.

Our team was responsible for systems that provided infrastructure and operational visibility around these live-streaming workloads.

The platform had to monitor several aspects of every channel, including:

- Video encoding and decoding infrastructure
- Health and status of individual live channels
- Infrastructure capacity
- Scaling requirements
- Stream availability
- Viewer metrics
- Content distribution
- Dynamic advertisement insertion
- Manifest correctness
- Operational problems affecting live streams

Operators had access to a large monitoring UI that provided real-time visibility into the state of the channels and the infrastructure supporting them.

From that interface, operators could inspect information such as:

- Whether a channel was operating normally
- Encoding and decoding status
- Infrastructure utilization
- Whether additional infrastructure needed to be scaled up or down
- Number of viewers watching a particular stream
- Dynamic ad insertion behavior
- Problems detected in the video delivery pipeline

---

## Dynamic Ad Insertion Monitoring

An important component of the platform was its **dynamic advertisement insertion pipeline**.

Advertisements could be dynamically replaced inside the streaming manifests depending on the user watching the channel.

The monitoring platform therefore needed to validate whether advertisement replacement was happening correctly for each stream.

This meant correlating information coming from several different systems, including:

- Streaming infrastructure
- Encoding systems
- Manifest processing systems
- Advertisement systems
- Viewer information
- Operational telemetry

The monitoring backend continuously collected this information and evaluated it according to predefined validation criteria.

The results were then exposed to operators through the monitoring interface.

---

## High-Volume Validation Service

One of the most important services I worked on was responsible for collecting and validating information about all of the live channels.

The service received **high volumes of data from several different providers and internal systems**.

A major challenge was that these sources did not necessarily expose information using the same schemas or data structures.

The service therefore had to:

1. Collect data from multiple providers.
2. Normalize the different data formats into our internal representation.
3. Correlate information belonging to the same channel.
4. Execute several validation rules.
5. Determine the operational state of each channel.
6. Continuously publish updated information for operators.

For example, for a channel such as **Fox Sports**, the service could collect information related to:

- Encoding status
- Stream infrastructure
- Advertisement replacement
- Viewer information
- Additional operational metrics

It would then analyze that data against predefined rules and determine whether the channel was operating correctly.

Because these streams were continuously broadcasting, this validation process ran in a loop and repeatedly evaluated every channel.

---

## Go Concurrency Architecture

The service was implemented primarily in **Go**.

To process multiple channels efficiently, the system used Go's concurrency primitives extensively.

The architecture would spawn **goroutines** so that different channels could be validated concurrently and, when CPU resources allowed, in parallel.

Conceptually, the system performed something similar to:

```text
collect provider data
        ↓
normalize data
        ↓
iterate over channels
        ↓
spawn concurrent validation work
        ↓
execute validation rules
        ↓
aggregate results
        ↓
publish updated operational state
        ↓
repeat
```

---

## Performance Investigation

One of my main contributions to the project was identifying and eliminating performance bottlenecks.

Rather than relying on assumptions about where the application was slow, I used Go's profiling and runtime diagnostic tooling to systematically analyze the application.

My investigation included:

- CPU profiling
- Heap analysis
- Memory allocation analysis
- Execution tracing
- Goroutine analysis
- Concurrency analysis
- Flame graphs
- Function-level latency investigation
- Identification of unnecessary allocations
- Investigation of shared initialization work
- Detection of expensive operations inside hot execution paths

I used these tools to determine exactly which functions and components were consuming the most execution time and memory.

I then optimized the service incrementally, removing bottlenecks one at a time.

---

## Example Bottleneck

One of the issues I discovered involved shared context initialization.

Several channel-validation operations depended on a common initial context or set of data.

This information was largely identical across multiple channel validations.

However, the existing implementation reconstructed this shared context every time a new goroutine was created to validate another channel.

That meant the application repeatedly performed the same work and repeatedly allocated memory for information that could instead be created once and reused.

With a large number of channels and repeated validation loops, these unnecessary operations accumulated into a substantial performance cost.

This was one of several bottlenecks identified through profiling.

---

## Major Performance Result

The most significant result of this work was a dramatic reduction in the execution time of the complete channel-validation loop.

**Before optimization:** ~6 minutes to validate all channels

**After profiling and systematically optimizing the application:** ~2–3 seconds to validate all channels

This represented an improvement of roughly two orders of magnitude in end-to-end processing time.

The optimization was not based on a single change. It came from profiling the system, understanding its runtime behavior, identifying the most expensive execution paths, and progressively eliminating unnecessary work, allocations, and architectural bottlenecks.

This performance improvement significantly increased the frequency at which the system could refresh channel status and therefore improved the operational visibility available to the teams monitoring Fox's live-streaming infrastructure.

---

## Key Technical Contributions

My main contributions during this project included:

- Developing backend services for a large-scale live-streaming platform.
- Working with real-time video infrastructure supporting Fox broadcast channels.
- Building and maintaining distributed systems written primarily in Go and Rust.
- Processing and correlating high-volume data coming from multiple providers.
- Normalizing heterogeneous provider data into internal data models.
- Implementing and maintaining real-time channel-validation systems.
- Working with highly concurrent Go applications using goroutines.
- Profiling production-oriented Go services using CPU profiles, heap analysis, tracing, and flame graphs.
- Finding memory allocation and execution bottlenecks.
- Optimizing concurrency and repeated shared computation.
- Improving a complete validation loop from approximately 6 minutes to 2–3 seconds.
- Supporting operational monitoring of encoding and decoding infrastructure.
- Working with dynamic advertisement insertion and manifest validation.
- Integrating streaming, infrastructure, viewer, and advertising telemetry.
- Working with cloud infrastructure and Kubernetes-based distributed systems.

---

## Technologies

### Languages

- Go
- Rust
- TypeScript
- JavaScript

### Frontend

- React

### Infrastructure

- AWS
- Kubernetes
- Cloud-based distributed services

### Video / Streaming

- WebRTC
- SRT
- HLS
- MPEG-DASH
- Live video encoding and decoding
- Streaming manifests
- Dynamic Ad Insertion

### Performance Engineering

- Go pprof
- CPU profiling
- Heap profiling
- Execution tracing
- Flame graphs
- Goroutine and concurrency analysis
- Memory allocation analysis
- Latency profiling
