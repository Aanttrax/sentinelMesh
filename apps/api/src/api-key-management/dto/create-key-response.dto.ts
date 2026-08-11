/**
 * DTO returned by the API key generation and rotation endpoints.
 *
 * The `rawKey` field is transient — it is the full 64-character hex key
 * returned ONLY in the generation/rotation response. It is never stored,
 * logged, or included in subsequent responses.
 *
 * ## SECURITY WARNING — LOGGING MIDDLEWARE
 *
 * Any logging middleware, response-body interceptor, or observability
 * layer (Morgan, Pino, Sentry, Datadog, Loki, CloudWatch, etc.) added
 * in M7 or later MUST redact the `rawKey` field from response bodies
 * BEFORE persisting or shipping logs. Failure to do so will leak
 * active API keys into log storage systems.
 *
 * Recommended mitigation for M7: register a response interceptor that
 * strips the `rawKey` property from serialized `CreateKeyResponseDto`
 * instances before passing them to the logging pipeline.
 */
export class CreateKeyResponseDto {
  id!: string;
  serviceId!: string;
  keyPrefix!: string;
  status!: string;
  createdAt!: string;
  /**
   * Full raw API key — displayed only once at generation/rotation.
   *
   * **MUST be redacted by any logging middleware.**
   * See class-level security warning.
   */
  rawKey!: string;
}
