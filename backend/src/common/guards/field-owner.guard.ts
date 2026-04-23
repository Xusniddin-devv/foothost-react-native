import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { JwtPayload } from '../../auth/jwt.strategy';

@Injectable()
export class FieldOwnerGuard implements CanActivate {
  canActivate(ctx: ExecutionContext): boolean {
    const user = ctx.switchToHttp().getRequest().user as JwtPayload | undefined;
    if (!user || !['field_owner', 'both'].includes(user.role ?? '')) {
      throw new ForbiddenException('Field owner access required');
    }
    return true;
  }
}
