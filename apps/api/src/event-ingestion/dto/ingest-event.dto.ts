import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsIn,
  Matches,
  IsInt,
  Min,
  Max,
} from 'class-validator';

/**
 * DTO for the POST /events endpoint.
 *
 * Structural and value-range validation:
 * - `method`: string, non-empty, one of GET/POST/PUT/PATCH/DELETE/HEAD/OPTIONS
 * - `path`: string, non-empty, starts with `/`
 * - `statusCode`: integer 100–599
 * - `durationMs`: number, ≥ 0
 *
 * `serviceId` is NOT included — it is extracted from the `X-Service-Id` header
 * by {@link ApiKeyAuthGuard} and attached to the request.
 */
export class IngestEventDto {
  @IsString()
  @IsNotEmpty()
  @IsIn(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'])
  method!: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^\//)
  path!: string;

  @IsInt()
  @Min(100)
  @Max(599)
  statusCode!: number;

  @IsNumber()
  @Min(0)
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
