import { Module } from '@nestjs/common';
import { API_KEY_REPOSITORY } from '@sentinelmesh/api-key-management';
import { InMemoryApiKeyRepository } from '../infrastructure/in-memory-api-key.repository';
import { ApiKeyManagementService } from './api-key-management.service';
import { ApiKeyManagementController } from './api-key-management.controller';
import { ServiceRegistrationModule } from '../service-registration/service-registration.module';

/**
 * NestJS module wiring for the API key management feature.
 *
 * Imports {@link ServiceRegistrationModule} for service-existence validation.
 * Exports {@link ApiKeyManagementService} so that the M2 AuthGuard can call
 * {@link ApiKeyManagementService.verifyKey} directly.
 */
@Module({
  imports: [ServiceRegistrationModule],
  controllers: [ApiKeyManagementController],
  providers: [
    ApiKeyManagementService,
    {
      provide: API_KEY_REPOSITORY,
      useClass: InMemoryApiKeyRepository,
    },
  ],
  exports: [ApiKeyManagementService, API_KEY_REPOSITORY],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ApiKeyManagementModule {}
