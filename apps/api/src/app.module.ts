import { Module } from '@nestjs/common';
import { ServiceRegistrationModule } from './service-registration/service-registration.module';

@Module({
  imports: [ServiceRegistrationModule],
})
// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export class AppModule {}
