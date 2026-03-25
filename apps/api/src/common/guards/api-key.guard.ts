import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private readonly configService: ConfigService) { }

    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const apiKey = request.headers['x-api-key'];
        const validApiKey = this.configService.get<string>('REGISTRATION_API_KEY') || 'lions-registration-secret-2026';

        if (apiKey !== validApiKey) {
            throw new UnauthorizedException('API Key inválida o faltante.');
        }

        return true;
    }
}
