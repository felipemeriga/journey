# Cosm — Real-Time Interactive Video, GPU Processing & Virtual Camera Systems

## Role Overview

I currently work at **Cosm**, an extended-reality and immersive media company that operates large 360-degree venues across the United States.

Cosm's physical venues are designed to provide an immersive viewing experience using very large dome-style displays that extend across much of the viewer's field of vision. One of the company's main use cases is live sports, including leagues such as:

- NHL
- NBA
- NFL
- MLB

The experience is designed to make viewers feel as if they are physically present inside the stadium or arena.

My work is focused on a different branch of the company: bringing a similar immersive experience to a **web-based interactive video player**.

This product allows users watching a live game to control a virtual camera, look around the field or arena, or select a player or object to follow automatically.

My specialization in this role combines:

- Real-time video systems
- GPU video processing
- Distributed systems
- Low-latency streaming
- Virtual camera systems
- Computer vision / spatial tracking integration
- High-performance backend engineering
- Video encoding and decoding
- WebRTC delivery

When I joined the project, the backend team responsible for this player consisted primarily of me and one other backend engineer.

---

## Product Architecture

Cosm owns a large portion of the complete capture and delivery pipeline.

Using an NHL arena as an example, multiple physical cameras are installed around the venue.

A typical arena uses approximately:

- 4 physical cameras
- Very high-resolution capture, around 8K
- Fisheye lenses with extremely wide fields of view

The fisheye lenses allow each physical camera to capture a very large portion of the arena.

The tradeoff is optical distortion, which later has to be corrected through GPU-based dewarping.

The high-resolution footage is processed by on-premise infrastructure before being made available to the interactive player.

The general pipeline is conceptually:

```text
Physical fisheye cameras
        ↓
8K video capture
        ↓
On-prem GPU processing
        ↓
HEVC encoding
        ↓
Spatial tiling
        ↓
HLS packaging
        ↓
Cloud GPU processing
        ↓
Virtual camera extraction
        ↓
Fisheye dewarping
        ↓
HEVC encoding
        ↓
WebRTC
        ↓
Interactive web player
```

---

## Spatially Tiled 8K Video

The complete high-resolution source is divided into a grid before being packaged for delivery.

One of the layouts used in the system is approximately:

```text
9 × 7 tiles
```

Instead of treating the 8K source as one monolithic video stream, the source can therefore be accessed spatially.

This enables the downstream processing system to retrieve and decode only portions of the full image when necessary.

That capability is particularly important because decoding extremely high-resolution video in real time places significant pressure on GPU decoding resources.

---

## Virtual Camera System

The central concept behind the product is that the physical cameras capture a much larger field of view than the user ultimately sees.

The final user might receive a viewport close to 1080p, while the original source contains several times more spatial information.

This allows the backend to create a **virtual camera** by cropping a smaller region from the original 8K image.

Instead of physically moving a camera, the software moves the crop window across the high-resolution image.

Conceptually:

```text
8K fisheye source
        ↓
Select a region of interest
        ↓
Crop virtual camera viewport
        ↓
Correct fisheye distortion
        ↓
Encode viewport
        ↓
Stream to user
```

Because the source contains much more resolution than the final viewport, the user can pan around the arena while still receiving a high-quality image.

---

## Player and Object Tracking

The virtual camera can also operate automatically.

Depending on the sports league and tracking provider, the system receives spatial tracking information for the objects involved in the game.

For example, in NHL we can receive coordinates representing:

- Players
- Puck
- Other tracked objects

The tracking system provides spatial coordinates, including **XYZ positions**, associated with the timeline of the video.

The backend uses these coordinates to calculate where the virtual camera should point.

For every frame, the system determines the corresponding virtual camera position and extracts the correct region from the original fisheye image.

The processing loop therefore operates continuously at approximately:

> **60 frames per second**

which creates a frame budget of approximately:

> **16.7 ms per frame**

For each frame, the backend effectively performs:

```text
Receive tracking coordinates
        ↓
Determine target position
        ↓
Convert coordinates into camera orientation / PTZ
        ↓
Decode source video
        ↓
Select virtual viewport
        ↓
Crop image
        ↓
Dewarp fisheye distortion
        ↓
Encode output
        ↓
Send through WebRTC
```

This has to happen continuously while maintaining smooth playback.

---

# Contribution 1 — Re-architecting the 8K Decode Pipeline

## Original Limitation

When I joined the project, one of the major limitations was related to decoding the high-resolution source.

The cloud processing infrastructure uses **NVIDIA T4 GPUs**.

These GPUs provide hardware video acceleration through technologies such as:

- NVDEC for hardware decoding
- NVENC for hardware encoding
- CUDA for GPU image processing

The existing implementation could not simply decode the complete 8K source using a single NVDEC pipeline.

Because of that limitation, the original architecture relied heavily on the spatial tiling system.

Instead of decoding the complete image, the player selected a smaller **sub-grid** of tiles corresponding to the current virtual camera position.

This worked reasonably well when camera movement was slow.

However, it created a major problem during fast-moving sports.

---

## The Fast-Movement Problem

Hockey was one of the clearest examples.

A puck can move from one side of the rink to the other extremely quickly.

The virtual camera may therefore need to move across a large portion of the 8K image within only a few frames.

For example:

```text
Frame N:
Camera is viewing the left side of the rink.

Frame N+3:
The puck has moved to the right side.

The virtual camera now needs data from a completely different tile region.
```

The original sub-grid architecture might not already be decoding the tiles required for the new location.

The system would then need to retrieve and decode a different section of the HLS stream before rendering the next viewport.

That additional work could exceed the approximately **16.7 ms frame budget** required for 60 FPS.

The result could be:

- Frame drops
- Stuttering
- Delayed camera movement
- Reduced smoothness

---

## Using Both NVDEC Engines

While investigating the hardware and decoding architecture, I identified that the NVIDIA T4 provided **two NVDEC decoding engines** that could be used in parallel.

Instead of decoding only a dynamically selected sub-grid, I changed the architecture so that the full spatial region required by the virtual camera system could be divided across the two hardware decoders.

Conceptually:

```text
8K source
        ↓
+------------------+------------------+
|                  |                  |
|    Left side     |    Right side    |
|                  |                  |
+------------------+------------------+

        ↓                    ↓

     NVDEC #1             NVDEC #2

        ↓                    ↓

       Decoded frames correlated by PTS/frame identity

                    ↓

            Reconstructed frame space

                    ↓

             Virtual camera crop
```

One NVDEC engine processed one portion of the source, while the second NVDEC processed the other.

Because the HLS stream preserved frame timing information, including presentation timestamps, I could correlate decoded frames from the two pipelines and ensure that the reconstructed spatial image represented the same instant in time.

---

## Result

With both sides of the image already available, fast virtual-camera movement no longer required waiting for a completely new group of tiles to be decoded.

The system could move rapidly across the arena while still having the necessary image data ready.

This significantly improved playback smoothness during rapid sports action.

The result was stable:

> **60 FPS playback with no frame drops during fast virtual-camera movement**

including cases where a puck or player moved rapidly across the arena.

This was one of my first major performance and architecture contributions at Cosm.

---

# Contribution 2 — Automatic Camera Selection / Auto-Tally System

Another major contribution I made was implementing an **automatic camera-selection system**, effectively acting as a software-based live director.

The venues contain multiple physical cameras.

Previously, changing between those cameras could depend more heavily on manual selection or simpler logic.

I developed an **auto-tally system** capable of deciding which physical camera should currently be used based on the location of the tracked player, puck, or other target.

---

## Camera Selection Logic

The system uses information such as:

- XYZ tracking coordinates
- Virtual camera target position
- PTZ calculations
- Camera position and orientation
- Spatial relationship between target and physical cameras

Using these inputs, the backend determines which camera provides the best view of the target.

Conceptually:

```text
Player / puck XYZ coordinates
        ↓
Calculate target position
        ↓
Evaluate available physical cameras
        ↓
Calculate PTZ / visibility characteristics
        ↓
Choose best camera
        ↓
Prepare next stream
        ↓
Perform automatic cut
```

The system therefore behaves similarly to a human broadcast director switching between cameras, but the decision is made algorithmically.

---

# Seamless Camera Switching

The difficult part was not simply deciding which camera to use.

The difficult part was making the transition **without disrupting playback**.

The physical camera streams were not necessarily aligned on identical keyframes.

In compressed video, switching directly between streams at an arbitrary frame can be problematic because decoding usually requires starting from an appropriate reference frame, typically an I-frame.

A naive camera switch could therefore introduce:

- Missing frames
- Decoder delays
- Visible freezes
- Corrupted frames
- Playback discontinuities

---

## Taking Advantage of the Buffered Live Window

Our system intentionally operates behind the absolute live edge.

For example, the interactive stream may run roughly:

> **30 seconds behind real time**

This provides a useful processing window.

Rather than waiting until the precise moment of a camera cut to begin preparing the new camera, the backend can perform work in advance.

I used this buffer to implement **predictive / scheduled camera switching**.

---

## Scheduled Cut Architecture

When the auto-tally system determines that the viewer should move from one physical camera to another, the transition is scheduled slightly ahead of time.

For example:

```text
T = current playback time

Decision:
Switch Camera A → Camera B

Transition delay:
500 ms

During those 500 ms:
    locate an appropriate future I-frame
    seek / prepare Camera B
    decode required frames
    synchronize timestamps
    prepare the next output frame

At scheduled timestamp:
    cut Camera A → Camera B
```

The transition delay is configurable.

By knowing in advance when the cut will happen, the backend can prepare the next stream before the viewer reaches the transition point.

This avoids introducing decoder latency directly into the live playback path.

---

## Seamless Auto-Tally Result

The combination of:

- Tracking coordinates
- PTZ calculations
- Camera-selection logic
- HLS timeline awareness
- PTS synchronization
- Keyframe scheduling
- Pre-decoding
- Buffered playback

allowed the system to automatically move between physical cameras while maintaining continuous video.

The target was effectively:

> **Camera switching without dropping a single output frame**

This created a much smoother automated viewing experience and enabled the virtual camera to follow gameplay across multiple physical camera viewpoints.

---

# GPU Processing Pipeline

Each interactive viewing session can run on its own GPU-backed cloud instance.

The system uses GPU-enabled EC2 infrastructure with NVIDIA T4 hardware.

A single player session can involve several GPU-intensive operations:

```text
HLS input
    ↓
NVDEC
    ↓
High-resolution decoded frame
    ↓
CUDA-based processing
    ↓
Virtual camera crop
    ↓
Fisheye dewarping
    ↓
Additional image processing
    ↓
NVENC
    ↓
WebRTC
    ↓
Browser
```

This architecture allows much of the expensive image processing to remain on the GPU instead of repeatedly transferring frames between CPU and GPU memory.

---

# WebRTC Delivery

The final processed virtual-camera stream is delivered to the browser using **WebRTC**.

The product is primarily B2B rather than a massive consumer streaming platform, so the architecture prioritizes:

- Low latency
- Interactivity
- Immediate camera response
- Smooth 60 FPS video
- Direct user control

over the ability to distribute a single stream to millions of viewers.

Because the virtual camera is personalized and interactive, each user can effectively have an independently generated video viewpoint.

---

# Key Technical Contributions

My major contributions to the Cosm interactive video platform include:

- Engineering backend infrastructure for an interactive real-time sports video player.
- Working on the complete live-video pipeline from high-resolution source media to browser playback.
- Processing approximately 8K fisheye video sources.
- Working with spatially tiled HLS video.
- Building GPU-intensive video pipelines on NVIDIA T4 GPUs.
- Using NVDEC for hardware video decoding.
- Using NVENC for hardware video encoding.
- Using CUDA-based image-processing pipelines.
- Performing real-time fisheye dewarping.
- Building virtual-camera systems based on high-resolution source video.
- Integrating real-time XYZ sports tracking data.
- Converting spatial coordinates into virtual-camera PTZ behavior.
- Maintaining a 60 FPS real-time processing pipeline with a ~16.7 ms frame budget.
- Re-architecting the decoding pipeline to use multiple NVDEC engines concurrently.
- Synchronizing independently decoded source regions through video timestamps.
- Eliminating dropped frames during extremely fast virtual-camera movement.
- Designing an automated physical-camera selection system.
- Building auto-tally logic that behaves similarly to an automated broadcast director.
- Implementing predictive camera switching.
- Scheduling transitions around future keyframes.
- Pre-decoding camera streams before cuts.
- Using buffered live-video latency as computational headroom.
- Producing seamless camera transitions without visible dropped frames.
- Delivering dynamically generated video streams through WebRTC.

---

# Technologies

## Languages / Systems

- Rust
- Go
- C++
- CUDA
- TypeScript

## Video

- HLS
- HEVC / H.265
- WebRTC
- Fisheye video
- Video tiling
- PTZ
- PTS / video timestamps
- I-frames / GOP structures
- Real-time encoding and decoding

## NVIDIA / GPU

- NVIDIA T4
- NVDEC
- NVENC
- CUDA
- GPU image processing

## Cloud Infrastructure

- AWS
- EC2
- GPU instances
- Distributed backend services

## Real-Time Data

- XYZ player tracking
- Object tracking
- Player tracking
- Spatial coordinate systems
- Automated camera-control logic

---

# Performance Characteristics

The system operates under strict real-time constraints.

Important characteristics include:

- Approximately **60 FPS**
- Approximately **16.7 ms processing budget per frame**
- High-resolution source video around **8K**
- Multiple simultaneous physical cameras
- GPU-accelerated decode, processing, and encoding
- Interactive user-controlled camera movement
- Automatic player / puck following
- Low-latency WebRTC delivery
- Seamless transitions between physical camera sources

---

# Career Significance

The Cosm project represents one of the strongest examples of my specialization in **real-time video engineering, GPU processing, and distributed systems**.

It combines several technically demanding areas:

- High-resolution video
- GPU hardware acceleration
- Real-time processing
- Video codecs
- Streaming protocols
- Spatial tracking
- Virtual cameras
- Distributed cloud infrastructure
- Low-latency networking
- Performance optimization

The work requires reasoning across the entire media pipeline, from physical camera capture and compressed video formats to GPU hardware constraints, timestamp synchronization, image transformation, and real-time browser delivery.

Two particularly important contributions were:

1. **Redesigning the decoding architecture to leverage multiple NVDEC engines**, enabling smooth 60 FPS virtual-camera movement even during extremely fast sports action.

2. **Building an automatic camera-selection and predictive switching system**, using tracking coordinates, PTZ calculations, timeline synchronization, pre-decoding, and scheduled keyframes to switch seamlessly between physical cameras.

These projects demonstrate my approach to real-time engineering: understand the constraints of the underlying hardware and media formats, design around strict latency budgets, and move expensive work out of the critical execution path whenever possible.
