/**
 * DTO returned by the API key generation and rotation endpoints.
 *
 * The `rawKey` field is transient — it is the full 64-character hex key
 * returned ONLY in the generation/rotation response. It is never stored,
 * logged, or included in subsequent responses.
 */
export class CreateKeyResponseDto {
  id!: string;
  serviceId!: string;
  keyPrefix!: string;
  status!: string;
  createdAt!: string;
  /** Full raw API key — displayed only once at generation/rotation. */
  rawKey!: string;
}
