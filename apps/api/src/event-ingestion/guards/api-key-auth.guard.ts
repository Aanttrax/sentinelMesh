import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import type { Request } from 'express';
import { UnauthorizedEventError } from '@sentinelmesh/event-schema';
import { ApiKeyManagementService } from '../../api-key-management/api-key-management.service';

/**
 * Request enriched by {@link ApiKeyAuthGuard} after successful authentication.
 *
 * AGENTS.md §7 requires strict TypeScript — this typed interface replaces
 * the common `any`-cast pattern for request enrichment.
 */
export interface AuthenticatedRequest extends Request {
  serviceId: string;
}

/**
 * NestJS guard that authenticates event ingestion requests via API key.
 *
 * Reads `X-Service-Id` and `Authorization: Bearer <key>` headers, calls
 * {@link ApiKeyManagementService.verifyKey}, and attaches the validated
 * `serviceId` to the request on success. Throws {@link UnauthorizedEventError}
 * (mapped to 401 by {@link DomainExceptionFilter}) on failure.
 */
@Injectable()
export class ApiKeyAuthGuard implements CanActivate {
  constructor(
    @Inject(ApiKeyManagementService)
    private readonly apiKeyService: ApiKeyManagementService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const rawSid = request.headers['x-service-id'];
    const serviceId = typeof rawSid === 'string' ? rawSid : '';
    const authHeader = request.headers.authorization ?? '';

    if (!serviceId || !authHeader) {
      throw new UnauthorizedEventError();
    }

    const rawKey = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : '';

    if (!rawKey) {
      throw new UnauthorizedEventError();
    }

    const isValid = await this.apiKeyService.verifyKey(serviceId, rawKey);
    if (!isValid) {
      throw new UnauthorizedEventError();
    }

    request.serviceId = serviceId;
    return true;
  }
}
