export class ApiKeyNotFoundError extends Error {
  constructor(keyId: string) {
    super(`API key with id "${keyId}" was not found`);
    this.name = 'ApiKeyNotFoundError';
  }
}

export class ApiKeyAlreadyRevokedError extends Error {
  constructor(keyId: string) {
    super(`API key with id "${keyId}" is already revoked`);
    this.name = 'ApiKeyAlreadyRevokedError';
  }
}
