import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ServiceRegistrationService } from './service-registration.service';
import { CreateServiceDto } from './dto/create-service.dto';
import type { Service } from '@sentinelmesh/service-registration';

@Controller('services')
export class ServiceRegistrationController {
  constructor(
    private readonly service: ServiceRegistrationService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: CreateServiceDto): Promise<Service> {
    return this.service.registerService(dto);
  }

  @Get()
  async list(): Promise<Service[]> {
    return this.service.listServices();
  }

  @Get(':id')
  async getOne(@Param('id') id: string): Promise<Service> {
    return this.service.getService(id);
  }

  @Patch(':id/disable')
  async disable(@Param('id') id: string): Promise<Service> {
    return this.service.disableService(id);
  }
}
