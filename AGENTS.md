# SentinelMesh

## Project

SentinelMesh is a distributed API security, observability
and anomaly detection platform.

The platform monitors existing APIs without requiring
SentinelMesh to implement the monitored application's
business endpoints.

## Goals

SentinelMesh must:

- ingest HTTP events from external APIs
- process events asynchronously
- detect anomalous behavior
- calculate threat scores
- create threats and alerts
- expose security information through an API
- provide a web dashboard
- support horizontal scalability
- provide observability

## Initial architecture

See `docs/architecture/system.md` for the detailed Mermaid diagram.

```
External API ──→ SDK ──────────→ Event Collector
             └─→ Gateway ──────→ Event Collector
                                       ↓
                                  Redis / BullMQ
                                       ↓
                                Detection Worker
                                       ↓
                                 Threat Scoring
                                       ↓
                                    MongoDB
                                       ↓
                              React Dashboard
```

## Initial stack

Backend:
- Node.js
- TypeScript
- NestJS

Database:
- MongoDB

Queue:
- Redis
- BullMQ

Frontend:
- React

Testing:
- unit tests
- integration tests
- end-to-end tests

Infrastructure:
- Docker Compose

Future:
- Prometheus
- Grafana
- Loki
- OpenTelemetry
- Machine Learning
- Kubernetes

## Architecture rules

1. Do not implement unnecessary microservices.
2. Prefer modular architecture.
3. Keep domain logic independent from infrastructure.
4. Do not store passwords, tokens or sensitive payloads.
5. Do not add technologies unless they have a clear purpose.
6. Every feature must have tests.
7. Do not implement future phases prematurely.
8. Preserve backward compatibility when modifying existing functionality.
9. Use TypeScript strict mode.
10. Prefer small, focused modules.

## Development workflow

Before implementing a feature:

1. Read the relevant Gherkin specification from `docs/requirements/features/`.
2. Inspect the existing architecture (`docs/architecture/system.md`).
3. Propose the implementation.
4. Implement the smallest solution satisfying the specification.
5. Add tests.
6. Run linting.
7. Run tests.
8. Run build.
9. Report what changed.

## Current milestone

M0 - Architecture and repository foundation.

Do not implement Redis, MongoDB, workers,
authentication or the dashboard during M0.
