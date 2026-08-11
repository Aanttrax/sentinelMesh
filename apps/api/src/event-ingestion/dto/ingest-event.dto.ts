import { IsString, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';

/**
 * DTO for the POST /events endpoint.
 *
 * Structural validation only — types and required fields.
 * Value-range validation (HTTP method enum, statusCode range, durationMs ≥ 0)
 * belongs to Feature 04.
 *
 * `serviceId` is NOT included — it is extracted from the `X-Service-Id` header
 * by {@link ApiKeyAuthGuard} and attached to the request.
 */
export class IngestEventDto {
  @IsString()
  @IsNotEmpty()
  method!: string;

  @IsString()
  @IsNotEmpty()
  path!: string;

  @IsNumber()
  statusCode!: number;

  @IsNumber()
  durationMs!: number;

  @IsString()
  @IsOptional()
  idempotencyKey?: string;

  @IsString()
  @IsOptional()
  ipAddress?: string;

  @IsString()
  @IsOptional()
  timestamp?: string;
}
