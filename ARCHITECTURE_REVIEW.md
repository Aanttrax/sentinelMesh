# SentinelMesh — Architecture Review Prompt

## Purpose

Reusable prompt for performing architecture and code reviews at defined
milestones during SentinelMesh development.

This review is read-only. The agent must not modify files unless explicitly
authorized after the review.

---

## Review Context

Review the current implementation of SentinelMesh against:

- `AGENTS.md`
- `docs/architecture/system.md`
- `docs/development/roadmap.md`
- the relevant Gherkin specifications under `docs/requirements/features/`
- the complete current source code
- the current test suite
- existing Architecture Decision Records under `docs/architecture/decisions/`

Review only the features explicitly identified in the command that invokes
this document.

Also evaluate compatibility with the next planned features when requested.

---

## Review Objectives

### 1. Architecture

Evaluate:

- component boundaries
- separation of concerns
- dependency direction
- domain/infrastructure separation
- coupling
- cohesion
- modularity
- scalability
- extensibility
- consistency with `docs/architecture/system.md`
- consistency with existing ADRs

Identify:

- unnecessary abstractions
- duplicated responsibilities
- architectural violations
- hidden coupling
- premature complexity
- components doing too much
- components doing too little

---

### 2. Gherkin Compliance

For every reviewed feature:

- inspect every Scenario
- verify that the implementation satisfies the expected behavior
- identify missing scenarios
- identify behavior implemented differently from the specification
- identify tests that do not actually verify the Gherkin behavior

Do not assume that passing tests automatically means the Gherkin is
fully satisfied.

---

### 3. Code Quality

Evaluate:

- TypeScript quality
- naming
- readability
- maintainability
- duplication
- complexity
- error handling
- type safety
- abstraction quality
- dependency management
- consistency across modules

Look specifically for:

- unnecessary `any`
- unnecessary type assertions
- duplicated business rules
- overly large classes/functions
- hidden side effects
- infrastructure logic inside domain logic

---

### 4. Domain Design

Evaluate whether business rules are correctly located.

Domain logic should not depend directly on:

- MongoDB
- Redis
- BullMQ
- HTTP framework details
- external APIs
- infrastructure-specific implementations

Identify business rules that are incorrectly implemented inside controllers,
repositories, database models, or infrastructure adapters.

---

### 5. API Design

Evaluate:

- endpoint naming
- HTTP semantics
- status codes
- request validation
- response contracts
- error structure
- consistency
- backward compatibility
- information leakage

Identify API behavior that could create future compatibility problems.

---

### 6. Security

Perform an explicit security review.

Check for:

- secrets stored in plaintext
- API keys stored insecurely
- credentials in logs
- sensitive values in error messages
- authorization issues
- authentication weaknesses
- enumeration vulnerabilities
- missing validation
- injection risks
- insecure defaults
- sensitive data persistence
- unsafe serialization
- missing rate limits where relevant

SentinelMesh must never unnecessarily persist:

- passwords
- authentication tokens
- cookies
- private keys
- authorization header values
- API secrets
- sensitive request bodies

Flag any violation as HIGH or CRITICAL depending on impact.

---

### 7. Data and Persistence

Evaluate:

- entity boundaries
- schema design
- indexes
- uniqueness constraints
- persistence responsibilities
- repository boundaries
- transaction requirements
- query efficiency
- future scalability

Consider expected high-volume collections, especially events and detections.

Identify database-specific logic leaking into domain/application layers.

---

### 8. Asynchronous Processing

When queues/workers are present or relevant, evaluate:

- idempotency
- retry behavior
- failure handling
- dead-letter behavior
- duplicate processing
- job boundaries
- concurrency
- backpressure
- observability

Do not require queue infrastructure before the roadmap milestone where it is
actually needed.

---

### 9. Testing

Evaluate:

- unit test coverage of business rules
- integration test coverage
- end-to-end coverage where appropriate
- edge cases
- negative cases
- security cases
- test isolation
- test readability
- test reliability

Look for tests that:

- only test implementation details
- provide false confidence
- duplicate each other unnecessarily
- are too tightly coupled to internal implementation

---

### 10. Observability

When relevant, evaluate:

- structured logging
- error reporting
- correlation IDs
- metrics
- useful operational information
- sensitive-data redaction

Logs and metrics must not expose secrets.

Do not require advanced observability features before their roadmap milestone.

---

### 11. Performance and Scalability

Evaluate likely bottlenecks without performing premature optimization.

Consider:

- database access
- repeated queries
- expensive synchronous work
- unnecessary network calls
- memory usage
- queue behavior
- concurrency
- high-volume event ingestion

Distinguish between:

- confirmed problems
- probable risks
- future considerations

Do not recommend complexity without evidence or a clear future requirement.

---

### 12. Dependency Review

Evaluate newly introduced dependencies.

For each unnecessary or questionable dependency:

- explain why it may be unnecessary
- identify whether existing project functionality could replace it
- consider maintenance and complexity costs

Do not recommend replacing a dependency merely because an alternative exists.

---

## Future Compatibility Review

When requested, evaluate whether the current implementation will integrate
cleanly with upcoming roadmap features.

Consider at minimum:

- API contracts
- domain boundaries
- persistence models
- authentication
- event ingestion
- asynchronous processing
- detection engine
- threat scoring
- dashboard requirements
- observability

Do not implement future features during the review.

---

## Findings Classification

Every finding must be classified as one of:

### CRITICAL

Security vulnerability, data loss risk, severe architectural defect, or issue
that can make the system fundamentally unreliable.

### HIGH

Important correctness, security, architecture, or maintainability problem
that should be fixed before continuing.

### MEDIUM

Meaningful issue that should be addressed but does not block immediate
progress.

### LOW

Minor issue with limited impact.

### IMPROVEMENT

Optional improvement or future consideration.

---

## False Positives

Do not report something as a problem merely because it could theoretically
be implemented differently.

Only report findings when:

- the implementation violates a documented requirement
- the implementation violates `AGENTS.md`
- the implementation conflicts with the architecture
- the implementation creates a concrete security/correctness risk
- the implementation creates significant future compatibility problems
- there is a clear maintainability or scalability concern

---

## Review Output

Return the review using this structure:

# Architecture Review

## Scope

List:

- reviewed features
- relevant roadmap milestone
- relevant future features considered

## Executive Summary

Provide a concise assessment of the current implementation.

State one of:

- READY TO CONTINUE
- READY WITH MINOR FIXES
- FIXES REQUIRED BEFORE CONTINUING
- MAJOR ARCHITECTURAL REVISION REQUIRED

## Findings

For every finding use:

### [SEVERITY] Short title

**Location:**
`path/to/file.ts:line`

**Problem:**

Explain the issue.

**Why it matters:**

Explain the technical impact.

**Recommendation:**

Explain the recommended correction.

**Blocks continuation:**
Yes / No

## Gherkin Compliance

For each reviewed feature:

| Feature | Status | Missing Behavior | Test Status |
|---|---|---|---|
| Feature name | PASS/PARTIAL/FAIL | ... | ... |

## Security Review

Summarize:

- authentication
- authorization
- secret handling
- sensitive data
- logging
- validation
- other relevant security concerns

## Testing Review

Summarize:

- unit tests
- integration tests
- E2E tests
- missing edge cases
- test quality

## Future Compatibility

Summarize compatibility with upcoming features.

## Positive Findings

List architectural or implementation decisions that are working well.

## Recommended Actions

Prioritize actions:

1. Critical/high issues
2. Medium issues
3. Low issues
4. Optional improvements

## Final Decision

Choose exactly one:

- READY TO CONTINUE
- READY WITH MINOR FIXES
- FIXES REQUIRED BEFORE CONTINUING
- MAJOR ARCHITECTURAL REVISION REQUIRED

Do not modify files.

Do not implement fixes.

Do not install dependencies.

Do not create commits.

## Review Persistence

Every completed architecture review must be saved as a Markdown document
under:

docs/architecture/reviews/

The filename must follow this convention:

review-NNN-<scope>.md

Examples:

review-001-features-01-02.md
review-002-features-03-06.md
review-003-detection-engine.md

The review document must contain the complete review output, including:

- scope
- executive summary
- findings
- Gherkin compliance
- security review
- testing review
- future compatibility
- positive findings
- recommended actions
- final decision

Before creating a new review:

1. Inspect `docs/architecture/reviews/`.
2. Determine the next sequential review number.
3. Do not overwrite an existing review.
4. Create the new review as a separate Markdown file.

The architecture review is historical documentation and must not be
deleted or rewritten because the implementation changes later.

After saving the review, report:

- review file path
- final decision
- number of findings by severity
- whether continuation is blocked

Do not modify source code as part of the architecture review.


## Review Index Maintenance

After creating a new architecture review, update:

docs/architecture/reviews/README.md

Add the new review to the Review Index.

The index entry must include:

- review number
- review filename
- reviewed scope
- milestone
- final decision
- review date

Do not modify previous review entries except to correct an obvious
documentation error.

If a previous review identified blocking issues that were later fixed,
do not change the old review. The resolution should be documented in the
new review.
