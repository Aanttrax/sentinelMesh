import { Module } from '@nestjs/common';
import { ServiceRegistrationModule } from './service-registration/service-registration.module';
import { ApiKeyManagementModule } from './api-key-management/api-key-management.module';

@Module({
  imports: [ServiceRegistrationModule, ApiKeyManagementModule],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}
