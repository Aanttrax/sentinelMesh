# SentinelMesh — AI Engineering Guidelines

## 1. Project

SentinelMesh is a distributed API security monitoring and anomaly
detection platform.

The platform monitors existing APIs by collecting HTTP metadata,
processing events asynchronously, detecting anomalous behavior,
calculating threat scores and generating security alerts.

SentinelMesh does not implement the business endpoints of monitored
applications.

---

## 2. Engineering Philosophy

SentinelMesh must be developed incrementally.

Prefer:

- simple architecture
- explicit boundaries
- modular design
- strong typing
- testable code
- observable behavior
- small changes
- backward compatibility

Avoid:

- unnecessary abstractions
- premature optimization
- unnecessary microservices
- speculative features
- technology for technology's sake
- large unrelated changes

---

## 3. Source of Truth

The project uses the following sources of truth:

### Gherkin

Gherkin specifications define expected system behavior.

Location:

docs/requirements/features/

### Architecture

Architecture documentation defines system boundaries and component
responsibilities.

Location:

docs/architecture/

### ADRs

Architecture Decision Records document important architectural decisions.

Location:

docs/architecture/decisions/

### Roadmap

The roadmap defines development milestones.

Location:

docs/development/roadmap.md

### AGENTS.md

This file defines engineering rules and constraints for AI-assisted
development.

---

## 4. Development Workflow

For every feature:

1. Read AGENTS.md.
2. Read the relevant Gherkin specification.
3. Read the relevant architecture documentation.
4. Inspect the existing implementation.
5. Identify dependencies on existing components.
6. Propose an implementation plan.
7. Wait for approval before implementing when explicitly requested.
8. Implement the smallest solution satisfying the specification.
9. Add or update tests.
10. Run tests.
11. Run linting.
12. Run type checking.
13. Run build.
14. Review the implementation against the Gherkin.
15. Report changes and validation results.

---

## 5. Scope Control

Implement only the requested feature.

Do not implement future features unless explicitly requested.

Do not refactor unrelated code.

Do not introduce infrastructure that is not required by the current
milestone.

If a requirement is ambiguous, identify the ambiguity before making
a significant architectural decision.

---

## 6. Security

Security is a core requirement.

Never persist:

- passwords
- authentication tokens
- API secrets
- cookies
- private keys
- authorization header values
- sensitive request bodies

unless a requirement explicitly defines a secure mechanism for handling
that information.

Sensitive values must be redacted before events are stored or processed.

Never log secrets.

Never hard-code credentials.

Use environment variables for runtime secrets.

---

## 7. TypeScript

Use strict TypeScript.

Avoid:

- any
- implicit type coercion
- unnecessary type assertions
- duplicated domain types

Prefer explicit types and small interfaces.

---

## 8. API Design

APIs should:

- use consistent HTTP semantics
- validate input
- return structured errors
- use appropriate status codes
- avoid leaking internal implementation details

API contracts must be backward compatible unless a breaking change is
explicitly approved.

---

## 9. Domain Design

Business rules should not depend directly on infrastructure.

Keep domain logic independent from:

- MongoDB
- Redis
- HTTP frameworks
- external services

Infrastructure implementations should depend on domain abstractions
where appropriate.

---

## 10. Testing

Every feature must have tests appropriate to its behavior.

Prefer:

- unit tests for business logic
- integration tests for infrastructure boundaries
- end-to-end tests for important user flows

Tests should verify behavior rather than implementation details.

Do not reduce test quality simply to make the build pass.

---

## 11. Dependencies

Do not add a dependency without a clear reason.

Before adding a dependency:

1. Determine whether existing dependencies already solve the problem.
2. Evaluate whether the dependency is necessary.
3. Prefer mature and maintained packages.
4. Avoid duplicate libraries providing the same functionality.

---

## 12. Observability

Important operations should eventually provide:

- structured logs
- metrics
- correlation identifiers
- useful error information

Observability must not expose secrets or sensitive user data.

---

## 13. Database

Database access belongs to infrastructure.

Do not spread database-specific logic throughout domain code.

Queries should be explicit and testable.

Indexes must be considered for high-volume collections.

---

## 14. Asynchronous Processing

When asynchronous processing is introduced:

- jobs must be idempotent
- failures must be observable
- retries must be bounded
- permanently failed jobs must be recoverable
- duplicate processing must be prevented

---

## 15. AI Agent Rules

The AI agent must not assume that a future requirement should be
implemented now.

The agent must not:

- redesign the architecture without justification
- introduce unnecessary services
- add speculative features
- modify unrelated files
- remove tests to make them pass
- weaken validation
- disable linting
- disable type checking
- silently change public APIs

When an architectural conflict is discovered, report it before making
a significant change.

---

## 16. Current Milestone

Current milestone:

M0 — AI-assisted development foundation.

M0 must establish project documentation and development conventions.

Do not implement:

- MongoDB
- Redis
- BullMQ
- authentication
- API keys
- event ingestion
- detection engine
- threat scoring
- React dashboard
- machine learning
- Kubernetes

Those belong to later milestones.

---

## 17. Definition of Done

A feature is considered complete only when:

- the Gherkin behavior is satisfied
- implementation is tested
- tests pass
- lint passes
- type checking passes
- build passes
- no unrelated behavior is broken
- documentation is updated when necessary
- the implementation follows the architecture
- the feature tracker is updated (`docs/development/feature-tracker.md`)
