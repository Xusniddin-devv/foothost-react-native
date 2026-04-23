import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtPayload } from '../../auth/jwt.strategy';

/**
 * Simple admin guard — checks the authenticated user's phone against the
 * comma-separated ADMIN_PHONES env var. Swap for a proper `isAdmin` column on
 * the users table once the user flow is finalised.
 */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest().user as JwtPayload | undefined;
    const admins = (process.env.ADMIN_PHONES ?? '')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    if (!user?.phone || !admins.includes(user.phone)) {
      throw new ForbiddenException('Admin access required');
    }
    return true;
  }
}
