import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class WebhookSecretGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const secret = req.headers['x-webhook-secret'];
    if (!secret || secret !== process.env.RAHMAT_WEBHOOK_SECRET) {
      throw new UnauthorizedException('Invalid webhook secret');
    }
    return true;
  }
}
