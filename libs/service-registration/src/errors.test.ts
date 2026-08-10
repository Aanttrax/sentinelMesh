import {
  DuplicateServiceError,
  ServiceNotFoundError,
  ServiceAlreadyDisabledError,
  ValidationError,
} from './errors';

describe('DuplicateServiceError', () => {
  it('should extend Error', () => {
    const error = new DuplicateServiceError('payment-api');
    expect(error).toBeInstanceOf(Error);
  });

  it('should set the name to DuplicateServiceError', () => {
    const error = new DuplicateServiceError('payment-api');
    expect(error.name).toBe('DuplicateServiceError');
  });

  it('should include the service name in the message', () => {
    const error = new DuplicateServiceError('payment-api');
    expect(error.message).toBe(
      'A service with the name "payment-api" already exists',
    );
  });
});

describe('ServiceNotFoundError', () => {
  it('should extend Error', () => {
    const error = new ServiceNotFoundError('abc-123');
    expect(error).toBeInstanceOf(Error);
  });

  it('should set the name to ServiceNotFoundError', () => {
    const error = new ServiceNotFoundError('abc-123');
    expect(error.name).toBe('ServiceNotFoundError');
  });

  it('should include the service ID in the message', () => {
    const error = new ServiceNotFoundError('abc-123');
    expect(error.message).toBe(
      'Service with id "abc-123" was not found',
    );
  });
});

describe('ServiceAlreadyDisabledError', () => {
  it('should extend Error', () => {
    const error = new ServiceAlreadyDisabledError('abc-123');
    expect(error).toBeInstanceOf(Error);
  });

  it('should set the name to ServiceAlreadyDisabledError', () => {
    const error = new ServiceAlreadyDisabledError('abc-123');
    expect(error.name).toBe('ServiceAlreadyDisabledError');
  });

  it('should indicate the service is already disabled', () => {
    const error = new ServiceAlreadyDisabledError('abc-123');
    expect(error.message).toBe(
      'Service with id "abc-123" is already disabled',
    );
  });
});

describe('ValidationError', () => {
  it('should extend Error', () => {
    const error = new ValidationError('name is required');
    expect(error).toBeInstanceOf(Error);
  });

  it('should set the name to ValidationError', () => {
    const error = new ValidationError('name is required');
    expect(error.name).toBe('ValidationError');
  });

  it('should carry the validation message', () => {
    const error = new ValidationError('name is required');
    expect(error.message).toBe('name is required');
  });

  it('should carry a different message', () => {
    const error = new ValidationError('environment is required');
    expect(error.message).toBe('environment is required');
  });
});
