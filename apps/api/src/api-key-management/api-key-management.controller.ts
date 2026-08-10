import { Controller, Post, Get, Delete, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiKeyManagementService } from './api-key-management.service';
import { CreateKeyResponseDto } from './dto/create-key-response.dto';
import { RevokeKeyResponseDto } from './dto/revoke-key-response.dto';

/**
 * REST controller for API key management.
 *
 * All routes are scoped under `/services/:serviceId/keys`.
 *
 * | Method   | Path                                | Purpose         |
 * |----------|-------------------------------------|-----------------|
 * | POST     | /services/:serviceId/keys           | Generate key    |
 * | GET      | /services/:serviceId/keys           | List key meta   |
 * | DELETE   | /services/:serviceId/keys/:keyId    | Revoke key      |
 * | POST     | /services/:serviceId/keys/:keyId/rotate | Rotate key |
 */
@Controller('services/:serviceId/keys')
export class ApiKeyManagementController {
  constructor(private readonly apiKeyService: ApiKeyManagementService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async generateKey(@Param('serviceId') serviceId: string): Promise<CreateKeyResponseDto> {
    return this.apiKeyService.generateKey(serviceId);
  }

  @Get()
  async listKeys(@Param('serviceId') serviceId: string): Promise<Record<string, unknown>[]> {
    return this.apiKeyService.listKeys(serviceId);
  }

  @Delete(':keyId')
  async revokeKey(
    @Param('serviceId') _serviceId: string,
    @Param('keyId') keyId: string,
  ): Promise<RevokeKeyResponseDto> {
    return this.apiKeyService.revokeKey(keyId);
  }

  @Post(':keyId/rotate')
  @HttpCode(HttpStatus.OK)
  async rotateKey(
    @Param('serviceId') _serviceId: string,
    @Param('keyId') keyId: string,
  ): Promise<CreateKeyResponseDto> {
    return this.apiKeyService.rotateKey(keyId);
  }
}
