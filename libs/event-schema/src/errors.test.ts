import { UnauthorizedEventError, ServiceNotAcceptingEventsError } from './errors';

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
