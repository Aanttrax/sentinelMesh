# Architecture Review 001 — Features 01–02

## Scope

| Field | Value |
|---|---|
| Reviewed features | 01 (Service Registration), 02 (API Key Management) |
| Relevant milestone | M1 — Core API |
| Future features considered | 03 (HTTP Event Ingestion), 04 (Event Validation), 22 (Rate Limiting) — M2 |
| Review date | 2026-08-11 |
| Reviewer | AI Architecture Agent |

---

## Executive Summary

The M1 implementation is solid. The codebase shows mature architectural discipline: clean domain/infrastructure separation, strict TypeScript, thorough test coverage, and proper secret handling. The domain libraries (`service-registration`, `api-key-management`) are framework-free and follow the repository port/adapter pattern correctly.

Two findings require attention before M2:

1. **No authentication on admin endpoints** — every controller route is publicly accessible despite Gherkin Backgrounds specifying "authenticated administrator." This is a partial specification/roadmap misalignment (authentication is M2), but the gap exists in production code today.

2. **API key `rawKey` flows through response DTOs** — the one-time key display Gherkin requirement is met, but if a logging interceptor is added later, keys will be logged in plaintext.

Overall assessment: **READY WITH MINOR FIXES** — the architecture is sound, tests pass, and future features (03, 04, 22) integrate cleanly. The authentication gap is a known M2 concern, not a defect in the M1 implementation.

---

## Findings

### [CRITICAL] No authentication on administrative endpoints

**Location:**
`apps/api/src/service-registration/service-registration.controller.ts:1`
`apps/api/src/api-key-management/api-key-management.controller.ts:1`

**Problem:**
Both controllers have zero guards, zero authentication middleware. Every endpoint — service registration, key generation, revocation, rotation — is publicly accessible to any HTTP client. The Gherkin Background for Feature 01 explicitly states `Given I am an authenticated administrator`, and Feature 02's scenarios (generate, revoke, rotate) describe administrative operations.

The roadmap places "Authentication" in M2, and the `ApiKeyManagementService.verifyKey()` method is designed for service-to-service auth (not admin auth). No mechanism exists for admin authentication at all.

**Why it matters:**
In production, an unauthenticated attacker could register arbitrary services, generate API keys, revoke legitimate keys, or disable monitoring services — completely undermining the security model before it's built.

**Recommendation:**
Add an AuthGuard on M1 admin endpoints or document explicitly that admin authentication is deferred to M2 with the understanding that M1 endpoints are unprotected by design during this development phase. At minimum, a M1-to-M2 transition plan should state that authentication must be the FIRST M2 task, applied retroactively to all existing controllers.

**Blocks continuation:**
No — this is a known M2 concern. Authentication is listed under M2 on the roadmap. The M1 code correctly builds the API key infrastructure (hashing, verification, revocation) that M2 authentication will consume.

---

### [HIGH] Raw API key exposed in DTO response — log-safe mechanism missing

**Location:**
`apps/api/src/api-key-management/api-key-management.service.ts:29-37` (generateKey)
`apps/api/src/api-key-management/api-key-management.service.ts:88-97` (rotateKey)
`apps/api/src/api-key-management/dto/create-key-response.dto.ts:15`

**Problem:**
The `CreateKeyResponseDto` includes the `rawKey` field (64-character hex key) as a plain string property. This is correct for the Gherkin requirement "the full API key should only be displayed once." However, if a logging interceptor, request-logging middleware, Morgan, Pino, or any observability layer is later added that logs response bodies, the raw key will be captured in logs.

**Why it matters:**
Logging the raw key compromises the entire API key security model. Keys would appear in log files, log aggregation systems, error tracking, and potentially be retained indefinitely. Sentry, Datadog, Loki, CloudWatch — any of these could capture the key.

**Recommendation:**
Add a `@Expose()` or `@Transform()` decorator that marks this field as sensitive, or implement a response interceptor that strips `rawKey` from log output. Alternatively, consider using a non-serializable token pattern (e.g., set via `res.setHeader()`) or requiring the client to immediately store the key and never send it back. At minimum, document in AGENTS.md that any logging middleware added in M7 must redact the `rawKey` field from responses.

**Blocks continuation:**
No — existing code has no logging interceptor, so risk is latent.

---

### [MEDIUM] Unused dependency: `@nestjs/mapped-types`

**Location:**
`package.json:38`
`apps/api/src/service-registration/dto/update-service.dto.ts`

**Problem:**
The `@nestjs/mapped-types` package is imported solely by `UpdateServiceDto`, which extends `PartialType(CreateServiceDto)`. `UpdateServiceDto` is never imported or used by any controller, service, or module. The `PATCH /services/:id/disable` endpoint does not accept a request body.

**Why it matters:**
Unused dependencies increase install size, supply-chain attack surface, and maintenance burden. AGENTS.md §11 states: "Do not add a dependency without a clear reason." While `PartialType` may be useful in future PATCH endpoints, it's not required by any current Gherkin scenario.

**Recommendation:**
Remove `@nestjs/mapped-types` and `UpdateServiceDto` until a Gherkin scenario requires partial updates. Reintroduce them at that time.

**Blocks continuation:**
No.

---

### [MEDIUM] Redundant Dual Registration of DomainExceptionFilter

**Location:**
`apps/api/src/main.ts:17`
`apps/api/src/service-registration/service-registration.module.ts:18-20`

**Problem:**
The `DomainExceptionFilter` is registered twice:
1. Globally in `main.ts` via `app.useGlobalFilters(new DomainExceptionFilter())`
2. At the module level via `APP_FILTER` provider in `ServiceRegistrationModule`

Both instances handle the same exception set. NestJS will process exceptions through both filters sequentially (global → module), but since each instance immediately returns after handling, the second registration is redundant. This does not cause runtime errors, but it's unnecessary and could confuse future maintainers.

**Why it matters:**
Dual registration creates duplication that could diverge. If someone adds a new domain error to one filter but not the other, behavior becomes inconsistent.

**Recommendation:**
Remove the `APP_FILTER` registration from `ServiceRegistrationModule` since the global filter in `main.ts` already covers all controllers. Keep the filter class itself — the global registration is sufficient.

**Blocks continuation:**
No.

---

### [LOW] Minor NestJS convention leak into domain library

**Location:**
`libs/service-registration/src/service.repository.ts:4`
`libs/api-key-management/src/api-key.repository.ts:4`

**Problem:**
Both domain libraries export `Symbol` tokens (`SERVICE_REPOSITORY`, `API_KEY_REPOSITORY`) for NestJS dependency injection. The comment "defined here so the domain stays framework-free" correctly identifies the intent, but the mechanism itself — a `Symbol` used as a DI token — is a NestJS pattern. In a strict hexagonal/clean architecture, the DI token would live in the infrastructure layer.

**Why it matters:**
Minor. The current approach is pragmatic, correctly decouples from concrete NestJS classes, and works well. A pure clean architecture would define an explicit DI container interface. This is not a functional issue.

**Recommendation:**
Accept as a pragmatic compromise. If the project later abstracts away NestJS, the tokens can move to an infrastructure DI module. No action required.

**Blocks continuation:**
No.

---

### [LOW] Console.log instead of structured logging

**Location:**
`apps/api/src/main.ts:21`

**Problem:**
Startup uses `console.log('API listening on port ${port}')` rather than a structured logger. AGENTS.md §12 states "Important operations should eventually provide structured logs."

**Why it matters:**
Minimal at M1. Observability is M7. However, establishing a logging convention early (even a minimal Pino or NestJS Logger usage) avoids accumulating ad-hoc `console.log` calls.

**Recommendation:**
Replace `console.log` with NestJS's built-in `Logger` class. Defer full structured logging to M7.

**Blocks continuation:**
No.

---

### [IMPROVEMENT] No CORS or security headers configured

**Location:**
`apps/api/src/main.ts:8-16`

**Problem:**
The NestJS application has no CORS configuration, no Helmet middleware, and no security-related HTTP headers (HSTS, X-Content-Type-Options, X-Frame-Options, etc.).

**Why it matters:**
The M1 API is intended for internal service communication, but absent security headers, it's vulnerable to basic web-based attacks if accessed via a browser context. This is a defense-in-depth measure.

**Recommendation:**
Enable CORS with explicit origins and add Helmet middleware (`app.use(helmet())`) during M1 or early M2.

**Blocks continuation:**
No.

---

### [IMPROVEMENT] Service name uniqueness is case-insensitive at infrastructure layer, not domain

**Location:**
`apps/api/src/infrastructure/in-memory-service.repository.ts:15-21`

**Problem:**
The case-insensitive name comparison (`name.toLowerCase()`) is implemented in the repository, not in the domain entity or service. The `Service` entity stores the name as-is without normalizing, while the repository treats `Payment-API` and `payment-api` as the same. This means the uniqueness rule depends on the repository implementation, and a MongoDB-backed repository might accidentally allow case-sensitive duplicates if not careful.

**Why it matters:**
When switching from in-memory to MongoDB, the case-insensitive constraint must be replicated at the database level (e.g., a case-insensitive unique index or a normalized `nameLower` field). The current split of responsibility could lead to divergence.

**Recommendation:**
Either:
1. Move the case-insensitive normalization into `ServiceRegistrationService.registerService()` (domain) and use the normalized name for lookup, OR
2. Add an explicit `nameNormalized` field to `Service` and create a unique index on it in MongoDB.

**Blocks continuation:**
No.

---

### [IMPROVEMENT] No request correlation ID middleware

**Location:**
N/A — feature not implemented.

**Problem:**
No correlation ID (trace ID, request ID) is generated per incoming request. When event ingestion (M2) and distributed processing (M3) arrive, tracking a single event across Collector → Redis → Worker → Detection → MongoDB will be essential for debugging.

**Why it matters:**
Adding correlation IDs early is cheaper than retrofitting them across a distributed pipeline. AGENTS.md §12 lists "correlation identifiers" as an observability goal.

**Recommendation:**
Add a simple middleware that generates a UUID per request and attaches it to the response header (`X-Request-Id`). No persistence needed at M1 — just establish the convention.

**Blocks continuation:**
No.

---

## Gherkin Compliance

### Feature 01 — Service Registration

| Scenario | Status | Test Status | Notes |
|---|---|---|---|
| Register a new service | PASS | ✅ Covered | `POST /services` returns 201 with UUID, name, env, version, active status |
| Prevent duplicate service registration | PASS | ✅ Covered | `POST /services` with duplicate name returns 409 with `DuplicateServiceError` |
| List registered services | PASS | ✅ Covered | `GET /services` returns array, verified empty and populated |
| Get a service | PASS | ✅ Covered | `GET /services/:id` returns service, 404 for missing |
| Disable a service | PASS | ✅ Covered | `PATCH /services/:id/disable` transitions to disabled, rejects double-disable |
| Prevent events from disabled services | READY | ✅ Domain logic exists | `Service.canAcceptEvents()` returns false when disabled. No event endpoint yet (M2) — domain is ready |

**Additional notes:**
- The Gherkin Background (`Given I am an authenticated administrator`) is not implemented — reported as CRITICAL finding. See roadmap note below.
- Service validation (name, environment, version required; semver enforcement) is tested at both DTO and entity layers.

### Feature 02 — API Key Management

| Scenario | Status | Test Status | Notes |
|---|---|---|---|
| Generate an API key | PASS | ✅ Covered | `POST /services/:serviceId/keys` returns 64-char hex key, associated with service |
| Full key displayed only once | PASS | ✅ Covered | `rawKey` in generation response only; `toJSON()` excludes it; `GET /keys` excludes it |
| Authenticate using a valid API key | PASS | ✅ Covered | `verifyKey()` returns true for valid active key |
| Reject an invalid API key | PASS | ✅ Covered | `verifyKey()` returns false for wrong key, tampered key, empty key |
| Revoke an API key | PASS | ✅ Covered | `DELETE /.../:keyId` transitions to revoked; revoked keys fail `verifyKey()` |
| Rotate an API key | PASS | ✅ Covered | `POST /.../:keyId/rotate` revokes old, generates new; new key verifies |

**Additional notes:**
- Key rotation is atomic in service layer but not in repository — acceptable for in-memory, needs transaction consideration for MongoDB.
- The Gherkin does not specify admin authentication for key management operations, but the scenarios (generate, revoke, rotate) are administrative actions. Feature 01's Background sets the expectation.
- `verifyKey()` is a domain service method, not an HTTP endpoint. This is by design — it will be called by the M2 AuthGuard for event ingestion authentication.

---

## Security Review

### Authentication
- **Status: NOT IMPLEMENTED.** No guards, no middleware, no token validation on any endpoint.
- Admin endpoints are fully public.
- API key infrastructure (`verifyKey()`, hash storage, revocation) is correctly built and ready for M2 AuthGuard integration.
- The road to M2 is clear: add an `ApiKeyAuthGuard` that calls `verifyKey()`, then apply it to the event ingestion endpoint.

### Authorization
- No role-based or permission-based authorization exists.
- API keys are service-scoped (one key → one service), which is the correct granularity for M2 event authentication.

### Secret Handling
- **API keys**: SHA-256 hashed before storage. Raw key is 32 random bytes (cryptographically strong via `randomBytes`). Only the hash is persisted.
- **`toJSON()`**: Correctly excludes `rawKey` and `keyHash` from serialized output.
- **`keyPrefix`**: Stores only the last 4 hex characters — safe for display.
- **`rawKey` in DTO**: Exists in `CreateKeyResponseDto` per Gherkin "display once" requirement. Risk documented in HIGH finding.

### Sensitive Data
- No passwords, tokens, cookies, or authorization header values are persisted.
- `revokedAt` timestamps are non-sensitive metadata.

### Logging
- Only `console.log` for startup port — no sensitive data logged.
- No logging middleware exists yet — no current risk, but documented in HIGH finding for future.

### Validation
- DTO-level: `class-validator` decorators (`@IsString`, `@IsNotEmpty`, `@Matches`) with `whitelist` and `forbidNonWhitelisted`.
- Domain-level: Entity constructor validates name, environment, version, semver format.
- Double-layer validation is a strong pattern.

### Other
- No rate limiting on any endpoint.
- No CORS or security headers.
- No HTTPS enforcement (deployment concern).
- No enumeration protection — a `findByName` 200 vs 404 distinction could leak registered service names.

---

## Testing Review

### Unit Tests (Domain)
- **Service entity** (`service.entity.test.ts`): 12 tests covering creation, UUID generation, status transitions, `canAcceptEvents`, `disable`, validation (empty name, whitespace, empty env, empty version, invalid semver, valid semver).
- **ApiKey entity** (`api-key.entity.test.ts`): 20 tests covering creation, UUID, rawKey length/format, keyPrefix, hash, createdAt, verify (correct, tampered, empty, revoked), revoke (status, timestamp, double-revoke, error message), toJSON (excludes rawKey, excludes hash, includes revokedAt when revoked).
- **Errors** (both `errors.test.ts`): All error classes tested for inheritance, name, message content.

### Service Tests (Application)
- **ServiceRegistrationService** (`service-registration.service.test.ts`): 11 tests covering register (success, persistence, duplicate names, case-insensitive duplicate), getService (found, not found), listServices (empty, populated), disableService (success, nonexistent, already-disabled).
- **ApiKeyManagementService** (`api-key-management.service.test.ts`): 20 tests covering generateKey (valid service, unknown service, unique keys), verifyKey (valid, incorrect, revoked, no keys), revokeKey (success, double-revoke, nonexistent), rotateKey (success, nonexistent, already-revoked), listKeys (metadata, empty, service-scoped).

### Repository Tests (Infrastructure)
- **InMemoryServiceRepository** (`in-memory-service.repository.test.ts`): 10 tests covering save, findById (null, correct among multiple), findByName (exact, case-insensitive, null), findAll (empty, populated), overwrite on save.
- **InMemoryApiKeyRepository** (`in-memory-api-key.repository.test.ts`): 16 tests covering save, findById (null, correct, multi-key same service), findByServiceId (empty, populated, scoped), findByHash (found, null, non-match, multi-key, cross-service).

### Integration Tests (Controller + HTTP)
- **ServiceRegistrationController** (`service-registration.controller.test.ts`): 10 tests using supertest — POST 201, POST 400 missing fields, POST 409 duplicate, POST 400 invalid semver, GET empty, GET populated, GET 200 found, GET 404 not found, PATCH disable 200, PATCH 409 already disabled, PATCH 404 not found.
- **ApiKeyManagementController** (`api-key-management.controller.test.ts`): 10 tests using supertest — POST 201 generate, POST 404 unknown service, GET empty, GET metadata (no rawKey/hash), DELETE 200 revoke, DELETE 409 already revoked, DELETE 404 not found, POST rotate 200, POST rotate 404, POST rotate 409 already revoked.

### Assessment
- **Total: 135 tests, all passing.** Coverage across domain, application, infrastructure, and integration layers is comprehensive.
- Edge cases covered: empty strings, whitespace-only, invalid semver, tampered keys, double-disable, double-revoke, nonexistent IDs, case-insensitive names, unique UUIDs per entity, unique rawKeys per generation.
- Tests verify behavior, not implementation details. The controller tests use real HTTP requests via supertest — true integration tests.
- No E2E tests exist, which is appropriate for M1.
- Test isolation is good — each suite creates fresh in-memory repositories.

---

## Future Compatibility

### Feature 03 — HTTP Event Ingestion

| Capability needed | Status | Notes |
|---|---|---|
| Event schema | ✅ Ready | `libs/event-schema` defines `HttpEvent` interface with all required fields |
| API key authentication for events | ✅ Ready | `verifyKey()` is designed for M2 AuthGuard; verified working in tests |
| Service existence validation | ✅ Ready | `ServiceRegistrationService.getService()` throws `ServiceNotFoundError` |
| Active service check | ✅ Ready | `Service.canAcceptEvents()` returns false for disabled services |
| Event ingestion endpoint | ⬜ Missing | No `POST /events` endpoint, no EventCollector controller. Expected in M2. |
| Event ID assignment | ⬜ Missing | No event ID generation logic. Expected in M2. |
| Queue publishing | ⬜ Missing | No Redis/BullMQ integration. M3 concern per roadmap. |

**Compatibility assessment:** The foundation is solid. The event-ingestion controller can accept an `HttpEvent`, call `verifyKey()` for auth, check `canAcceptEvents()` for service status, and proceed. No architectural changes needed.

**Risk:** The event ingestion endpoint (M2) requires an AuthGuard that extracts `serviceId` and `rawKey` from the request. The current `verifyKey(serviceId, rawKey)` signature expects both parameters — the AuthGuard must determine which service is making the request. This is standard (e.g., `X-Service-Id` header + `Authorization: Bearer <key>`), but the mechanism must be defined before implementation.

### Feature 04 — Event Validation

| Capability needed | Status | Notes |
|---|---|---|
| Validation pipeline | ✅ Ready | `ValidationPipe` with `class-validator` pattern established in M1 |
| Required field checks | ✅ Ready | Pattern exists via `@IsNotEmpty`, `@IsString` on DTOs |
| HTTP method validation | ⬜ Missing | No validation DTO for `HttpEvent.method`. Needs allowed-method enum. |
| Path validation | ⬜ Missing | No validation DTO for `HttpEvent.path`. |
| Status code range check | ⬜ Missing | No validation DTO for `HttpEvent.statusCode` range (100-599). |
| Latency range check | ⬜ Missing | No validation DTO for non-negative duration. |

**Compatibility assessment:** The validation DTO pattern (controller DTO with `class-validator` decorators + `ValidationPipe`) is well-established. Feature 04 can follow the same pattern by creating an `IngestEventDto` class. The event-schema `HttpEvent` interface already defines the correct field types. No architectural changes needed.

### Feature 22 — Rate Limiting

| Capability needed | Status | Notes |
|---|---|---|
| Per-service rate tracking | ⬜ Missing | No rate counter infrastructure exists |
| Sliding window or token bucket | ⬜ Missing | No rate limit algorithm implemented |
| 429 response handling | ⬜ Missing | No rate limit error in DomainExceptionFilter |
| Rate limit isolation | ⬜ Missing | No per-service keying mechanism |

**Compatibility assessment:** Rate limiting can be implemented as a NestJS guard or middleware applied to the event ingestion route, without architectural changes to existing code. The `Service` entity may need a `rateLimit` configuration field (e.g., events per minute). The `DomainExceptionFilter` can be extended with a `RateLimitExceededError`. The Gherkin specifies per-service isolation (100 events/minute) — the guard should key on `serviceId` from the authenticated request.

**Recommendation:** Add a `rateLimit` field to the service entity or a separate per-service rate configuration. Consider using a dedicated rate limiting library (e.g., `@nestjs/throttler`) rather than a custom implementation to avoid subtle timing bugs.

---

## Positive Findings

1. **Clean domain/infrastructure separation**: Domain entities (`Service`, `ApiKey`) are framework-free. Repository interfaces define ports. In-memory implementations are in `apps/api/src/infrastructure/`. This is textbook hexagonal architecture at M0/M1.

2. **Secret handling is correct**: SHA-256 hashing, `randomBytes(32)`, `toJSON()` excludes raw key and hash. The `verify()` method checks both hash and status. This is production-quality key management.

3. **Double-layer validation**: DTO validation (`class-validator` + `ValidationPipe`) catches malformed requests early. Domain entity validation catches semantic errors (invalid semver, empty strings after trim). This prevents bad data from entering the domain at two checkpoints.

4. **Comprehensive test coverage**: 135 tests across 11 suites. Domain, application, infrastructure, and integration layers all tested. Edge cases are well-covered (case-insensitive names, tampered keys, double-disable, double-revoke, empty strings, whitespace-only).

5. **Domain errors are typed, not generic**: Every error condition has a specific class (`DuplicateServiceError`, `ServiceAlreadyDisabledError`, `ApiKeyAlreadyRevokedError`) rather than generic `Error` or `HttpException`. This enables precise error handling and HTTP status mapping.

6. **Forward-looking design**: `event-schema` library already defines `HttpEvent` and `ThreatSeverity` types. `canAcceptEvents()` on `Service` is ready for M2. `verifyKey()` is designed for M2 AuthGuard. No code needs to be undone.

7. **Consistent API design**: RESTful URL structure (`/services`, `/services/:id`, `/services/:serviceId/keys/:keyId/rotate`), appropriate HTTP methods and status codes, structured error responses with `{ statusCode, message, error }`.

8. **Strict TypeScript**: `tsconfig.base.json` enables `strict: true`, `noUncheckedIndexedAccess`, `noImplicitOverride`, `noPropertyAccessFromIndexSignature`. ESLint uses `strictTypeChecked` and `stylisticTypeChecked` configs. Zero `any` usage in production code.

9. **Monorepo structure**: Clean separation of domain libraries from application code. TypeScript project references correctly configured for incremental builds.

---

## Recommended Actions

### Before M2 (CRITICAL/HIGH):
1. **Add admin authentication** or document the M1→M2 auth transition plan. Either add a basic API-key-based admin guard to M1 controllers, or explicitly state in the M2 implementation plan that authentication must be retrofitted to all existing admin endpoints before event ingestion begins.

2. **Protect `rawKey` from future logging** by adding a comment in `CreateKeyResponseDto` that this field must be redacted by any logging middleware, or implementing a more robust mechanism (e.g., response header instead of body field).

### Before M2 (MEDIUM):
3. **Remove unused `@nestjs/mapped-types` dependency** and `UpdateServiceDto` until needed.

4. **De-duplicate `DomainExceptionFilter` registration** — keep the global filter in `main.ts`, remove the `APP_FILTER` from `ServiceRegistrationModule`.

### Before M3 (LOW):
5. **Replace `console.log` with NestJS `Logger`** as a minimal structured logging foundation.

### Before M2/M3 (IMPROVEMENTS):
6. **Add CORS and Helmet middleware** for defense-in-depth.
7. **Move case-insensitive name uniqueness** from repository to domain service or add a normalized name field.
8. **Add request correlation ID middleware** (`X-Request-Id` header generation).

---

## Final Decision

**READY WITH MINOR FIXES**

The architecture is sound. The domain design is clean. Tests are comprehensive and all pass. The build succeeds with zero errors. Linting is clean.

The authentication gap is a known milestone boundary — M1 builds the infrastructure, M2 adds enforcement. The code is correctly structured for M2 to add guards without architectural changes. The remaining findings are improvements, not defects.

Proceed to M2 with the understanding that authentication enforcement must be the first M2 task and must cover all existing M1 endpoints.

---

*Review conducted 2026-08-11. This document is a historical record and will not be modified.*
