import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation } from '@nestjs/swagger';
import { ApiKeyGuard } from '../guards/api-key.guard';

export function ApiKeyAuth() {
  return applyDecorators(
    UseGuards(ApiKeyGuard),
    ApiHeader({
      name: 'X-API-Key',
      description: 'Service-to-service API key',
      required: true,
    }),
  );
}
