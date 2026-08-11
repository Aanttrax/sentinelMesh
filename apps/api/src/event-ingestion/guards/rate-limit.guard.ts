import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { RateLimitExceededError } from '@sentinelmesh/event-schema';

interface RequestLike {
  ip: string;
  headers: Record<string, string | string[] | undefined>;
}

/**
 * Rate-limit guard that rejects over-limit requests BEFORE authentication.
 *
 * Extends {@link ThrottlerGuard} with a composite tracker key of
 * {@code IP::X-Service-Id} so limits are per service (REQ-RL-003).
 * Over-limit requests throw {@link RateLimitExceededError}, which
 * {@link DomainExceptionFilter} maps to HTTP 429 with a {@code Retry-After} header.
 */
@Injectable()
export class RateLimitGuard extends ThrottlerGuard {
  /**
   * Returns a composite tracker key for per-service isolation.
   *
   * The guard runs before {@link ApiKeyAuthGuard}, so the service identity
   * comes from the raw {@code X-Service-Id} header rather than a validated
   * auth identity.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  protected override async getTracker(req: RequestLike): Promise<string> {
    const serviceId = (req.headers['x-service-id'] as string | undefined) ?? 'unknown';
    return `${req.ip}::${serviceId}`;
  }

  /**
   * Throws a domain {@link RateLimitExceededError} instead of the default
   * NestJS {@code HttpException} so it can be handled by the project's
   * {@link DomainExceptionFilter} with the correct 429 body shape and
   * {@code Retry-After} header.
   */
  // eslint-disable-next-line @typescript-eslint/require-await
  protected override async throwThrottlingException(
    _context: ExecutionContext,
  ): Promise<void> {
    throw new RateLimitExceededError();
  }
}
