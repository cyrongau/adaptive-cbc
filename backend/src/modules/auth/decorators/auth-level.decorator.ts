import { SetMetadata } from '@nestjs/common';
import { AuthLevel } from '../constants/auth-level.enum';

export const AUTH_LEVEL_KEY = 'authLevel';
export const RequireAuthLevel = (level: AuthLevel) => SetMetadata(AUTH_LEVEL_KEY, level);
