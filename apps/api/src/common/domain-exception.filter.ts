import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import {
  DuplicateServiceError,
  ServiceNotFoundError,
  ServiceAlreadyDisabledError,
  ValidationError,
} from '@sentinelmesh/service-registration';
import { ApiKeyNotFoundError, ApiKeyAlreadyRevokedError } from '@sentinelmesh/api-key-management';

@Catch(
  DuplicateServiceError,
  ServiceNotFoundError,
  ServiceAlreadyDisabledError,
  ValidationError,
  ApiKeyNotFoundError,
  ApiKeyAlreadyRevokedError,
)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof DuplicateServiceError) {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: exception.message,
        error: 'DuplicateServiceError',
      });
      return;
    }

    if (exception instanceof ServiceNotFoundError) {
      response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: exception.message,
        error: 'ServiceNotFoundError',
      });
      return;
    }

    if (exception instanceof ServiceAlreadyDisabledError) {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: exception.message,
        error: 'ServiceAlreadyDisabledError',
      });
      return;
    }

    if (exception instanceof ValidationError) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: exception.message,
        error: 'ValidationError',
      });
      return;
    }

    if (exception instanceof ApiKeyNotFoundError) {
      response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: exception.message,
        error: 'ApiKeyNotFoundError',
      });
      return;
    }

    if (exception instanceof ApiKeyAlreadyRevokedError) {
      response.status(HttpStatus.CONFLICT).json({
        statusCode: HttpStatus.CONFLICT,
        message: exception.message,
        error: 'ApiKeyAlreadyRevokedError',
      });
      return;
    }
  }
}
