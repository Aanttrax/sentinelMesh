import { ApiKeyNotFoundError, ApiKeyAlreadyRevokedError } from './errors';

describe('ApiKeyNotFoundError', () => {
  it('should extend Error', () => {
    const error = new ApiKeyNotFoundError('key-001');
    expect(error).toBeInstanceOf(Error);
  });

  it('should set the name to ApiKeyNotFoundError', () => {
    const error = new ApiKeyNotFoundError('key-001');
    expect(error.name).toBe('ApiKeyNotFoundError');
  });

  it('should include the key ID in the message', () => {
    const error = new ApiKeyNotFoundError('key-001');
    expect(error.message).toBe('API key with id "key-001" was not found');
  });
});

describe('ApiKeyAlreadyRevokedError', () => {
  it('should extend Error', () => {
    const error = new ApiKeyAlreadyRevokedError('key-001');
    expect(error).toBeInstanceOf(Error);
  });

  it('should set the name to ApiKeyAlreadyRevokedError', () => {
    const error = new ApiKeyAlreadyRevokedError('key-001');
    expect(error.name).toBe('ApiKeyAlreadyRevokedError');
  });

  it('should indicate the key is already revoked', () => {
    const error = new ApiKeyAlreadyRevokedError('key-001');
    expect(error.message).toBe('API key with id "key-001" is already revoked');
  });
});
