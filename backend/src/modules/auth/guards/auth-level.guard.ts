import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthLevel, ROLE_TO_AUTH_LEVEL, meetsAuthLevel } from '../constants/auth-level.enum';
import { AUTH_LEVEL_KEY } from '../decorators/auth-level.decorator';

@Injectable()
export class AuthLevelGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredAuthLevel = this.reflector.getAllAndOverride<AuthLevel>(AUTH_LEVEL_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredAuthLevel) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) return false;

    const userLevel = ROLE_TO_AUTH_LEVEL[user.role];
    if (!userLevel) return false;
    if (!meetsAuthLevel(userLevel, requiredAuthLevel)) return false;

    return true;
  }
}
