/**
 * DTO returned by the API key revocation endpoint.
 *
 * Confirms the key has been revoked with the updated status and timestamp.
 */
export class RevokeKeyResponseDto {
  id!: string;
  serviceId!: string;
  keyPrefix!: string;
  status!: string;
  createdAt!: string;
  revokedAt!: string;
}
