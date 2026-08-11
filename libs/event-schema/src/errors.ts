export class UnauthorizedEventError extends Error {
  constructor() {
    super('Unauthorized');
    this.name = 'UnauthorizedEventError';
  }
}

export class ServiceNotAcceptingEventsError extends Error {
  constructor(serviceId: string) {
    super(`Service "${serviceId}" is not accepting events`);
    this.name = 'ServiceNotAcceptingEventsError';
  }
}

export class RateLimitExceededError extends Error {
  constructor() {
    super('Rate limit exceeded');
    this.name = 'RateLimitExceededError';
  }
}
