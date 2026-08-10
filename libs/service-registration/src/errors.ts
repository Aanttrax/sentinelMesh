export class DuplicateServiceError extends Error {
  constructor(serviceName: string) {
    super(`A service with the name "${serviceName}" already exists`);
    this.name = 'DuplicateServiceError';
  }
}

export class ServiceNotFoundError extends Error {
  constructor(serviceId: string) {
    super(`Service with id "${serviceId}" was not found`);
    this.name = 'ServiceNotFoundError';
  }
}

export class ServiceAlreadyDisabledError extends Error {
  constructor(serviceId: string) {
    super(`Service with id "${serviceId}" is already disabled`);
    this.name = 'ServiceAlreadyDisabledError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
