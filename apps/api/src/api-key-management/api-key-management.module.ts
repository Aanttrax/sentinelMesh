import { Module } from '@nestjs/common';
import { API_KEY_REPOSITORY } from '@sentinelmesh/api-key-management';
import { InMemoryApiKeyRepository } from '../infrastructure/in-memory-api-key.repository';

/**
 * NestJS module wiring for the API key management feature.
 *
 * PR 2 skeleton — registers the InMemory repository adapter for the
 * {@link API_KEY_REPOSITORY} DI token. Controller and service are added
 * in PR 3. The {@link DomainExceptionFilter} already handles API key
 * errors via its existing global registration in
 * {@link ServiceRegistrationModule}.
 */
@Module({
  providers: [
    {
      provide: API_KEY_REPOSITORY,
      useClass: InMemoryApiKeyRepository,
    },
  ],
  exports: [API_KEY_REPOSITORY],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ApiKeyManagementModule {}
