import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtPayload } from '../../auth/jwt.strategy';

@Injectable()
export class VerifiedGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest().user as JwtPayload | undefined;
    if (!user?.isVerified) {
      throw new ForbiddenException('Phone verification required');
    }
    return true;
  }
}
