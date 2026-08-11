import { UnauthorizedEventError, ServiceNotAcceptingEventsError, RateLimitExceededError } from './errors';

describe('UnauthorizedEventError', () => {
  it('should extend Error', () => {
    const error = new UnauthorizedEventError();
    expect(error).toBeInstanceOf(Error);
  });

  it('should set the name to UnauthorizedEventError', () => {
    const error = new UnauthorizedEventError();
    expect(error.name).toBe('UnauthorizedEventError');
  });

  it('should have the message "Unauthorized"', () => {
    const error = new UnauthorizedEventError();
    expect(error.message).toBe('Unauthorized');
  });
});

describe('ServiceNotAcceptingEventsError', () => {
  it('should extend Error', () => {
    const error = new ServiceNotAcceptingEventsError('svc-001');
    expect(error).toBeInstanceOf(Error);
  });

  it('should set the name to ServiceNotAcceptingEventsError', () => {
    const error = new ServiceNotAcceptingEventsError('svc-001');
    expect(error.name).toBe('ServiceNotAcceptingEventsError');
  });

  it('should include the service ID in the message', () => {
    const error = new ServiceNotAcceptingEventsError('payment-api');
    expect(error.message).toBe('Service "payment-api" is not accepting events');
  });
});

describe('RateLimitExceededError', () => {
  it('should extend Error', () => {
    const error = new RateLimitExceededError();
    expect(error).toBeInstanceOf(Error);
  });

  it('should set the name to RateLimitExceededError', () => {
    const error = new RateLimitExceededError();
    expect(error.name).toBe('RateLimitExceededError');
  });

  it('should have the message "Rate limit exceeded"', () => {
    const error = new RateLimitExceededError();
    expect(error.message).toBe('Rate limit exceeded');
  });
});
