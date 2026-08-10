# System Architecture

Event ingestion will flow through SDK and Gateway (both future) into the Event Collector, then through an asynchronous pipeline (Redis/BullMQ → Detection → Scoring → MongoDB) to the React Dashboard.

```mermaid
flowchart LR
    API[External API]

    SDK[SDK - future]
    Gateway[Gateway - future]
    Collector[Event Collector]

    Redis[(Redis)]
    Detection[Detection Worker]
    Scoring[Threat Scoring]

    Mongo[(MongoDB)]
    Dashboard[React Dashboard]

    API --> SDK
    API --> Gateway

    SDK --> Collector
    Gateway --> Collector

    Collector --> Redis
    Redis --> Detection
    Detection --> Scoring
    Scoring --> Mongo
    Mongo --> Dashboard
```
