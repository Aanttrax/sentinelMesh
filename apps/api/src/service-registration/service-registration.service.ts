import { Injectable, Inject } from '@nestjs/common';
import {
  Service,
  type CreateServiceParams,
  type ServiceRepository,
  SERVICE_REPOSITORY,
  DuplicateServiceError,
  ServiceNotFoundError,
} from '@sentinelmesh/service-registration';

@Injectable()
export class ServiceRegistrationService {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private readonly repository: ServiceRepository,
  ) {}

  async registerService(params: CreateServiceParams): Promise<Service> {
    const existing = await this.repository.findByName(params.name);
    if (existing) {
      throw new DuplicateServiceError(params.name);
    }

    const service = Service.create(params);
    return this.repository.save(service);
  }

  async getService(id: string): Promise<Service> {
    const service = await this.repository.findById(id);
    if (!service) {
      throw new ServiceNotFoundError(id);
    }
    return service;
  }

  async listServices(): Promise<Service[]> {
    return this.repository.findAll();
  }

  async disableService(id: string): Promise<Service> {
    const service = await this.repository.findById(id);
    if (!service) {
      throw new ServiceNotFoundError(id);
    }
    service.disable();
    return this.repository.save(service);
  }
}
