import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppRequest } from '../types/request.type';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req: AppRequest = context.switchToHttp().getRequest();
    const apiKey = req.headers['x-api-key'] as string;
    const expectedKey = this.configService.get<string>('AI_SERVICE_API_KEY');

    if (!expectedKey) {
      throw new UnauthorizedException('AI_SERVICE_API_KEY not configured');
    }

    if (!apiKey || apiKey !== expectedKey) {
      throw new UnauthorizedException('Invalid or missing API key');
    }

    return true;
  }
}
