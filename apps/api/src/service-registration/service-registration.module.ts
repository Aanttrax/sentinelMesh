import { Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { ServiceRegistrationService } from './service-registration.service';
import { ServiceRegistrationController } from './service-registration.controller';
import { InMemoryServiceRepository } from '../infrastructure/in-memory-service.repository';
import { DomainExceptionFilter } from '../common/domain-exception.filter';
import { SERVICE_REPOSITORY } from '@sentinelmesh/service-registration';

@Module({
  controllers: [ServiceRegistrationController],
  providers: [
    ServiceRegistrationService,
    {
      provide: SERVICE_REPOSITORY,
      useClass: InMemoryServiceRepository,
    },
    {
      provide: APP_FILTER,
      useClass: DomainExceptionFilter,
    },
  ],
  exports: [ServiceRegistrationService],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class ServiceRegistrationModule {}
