import { AuthLevelGuard } from './auth-level.guard';
import { AuthLevel } from '../constants/auth-level.enum';
import { UserRole } from '../../users/entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AUTH_LEVEL_KEY } from '../decorators/auth-level.decorator';

function mockReflector(overrides?: Record<string, any>) {
  return {
    getAllAndOverride: jest.fn((key: string) => {
      if (overrides && overrides[key] !== undefined) return overrides[key];
      return undefined;
    }),
  };
}

function mockContext(user?: { role: string; secondaryRoles?: string[] }) {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
    getHandler: jest.fn(),
    getClass: jest.fn(),
  } as any;
}

describe('AuthLevelGuard', () => {
  describe('No metadata set', () => {
    it('should allow access when no @RequireAuthLevel and no @Roles', () => {
      const reflector = mockReflector({});
      const guard = new AuthLevelGuard(reflector as any);
      const context = mockContext({ role: 'student' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should allow access even when no user exists (no metadata)', () => {
      const reflector = mockReflector({});
      const guard = new AuthLevelGuard(reflector as any);
      const context = mockContext(undefined);

      expect(guard.canActivate(context)).toBe(true);
    });
  });

  describe('@RequireAuthLevel', () => {
    const levelTests = [
      { role: 'student', level: AuthLevel.LEVEL_1_STUDENT, expected: true },
      { role: 'student', level: AuthLevel.LEVEL_2_PARENT, expected: false },
      { role: 'parent', level: AuthLevel.LEVEL_1_STUDENT, expected: true },
      { role: 'parent', level: AuthLevel.LEVEL_2_PARENT, expected: true },
      { role: 'parent', level: AuthLevel.LEVEL_4_INSTITUTION_ADMIN, expected: false },
      { role: 'teacher', level: AuthLevel.LEVEL_3_TEACHER_TUTOR, expected: true },
      { role: 'teacher', level: AuthLevel.LEVEL_4_INSTITUTION_ADMIN, expected: false },
      { role: 'tutor', level: AuthLevel.LEVEL_3_TEACHER_TUTOR, expected: true },
      { role: 'institution_admin', level: AuthLevel.LEVEL_4_INSTITUTION_ADMIN, expected: true },
      { role: 'institution_admin', level: AuthLevel.LEVEL_5_SUPER_ADMIN, expected: false },
      { role: 'super_admin', level: AuthLevel.LEVEL_5_SUPER_ADMIN, expected: true },
      { role: 'super_admin', level: AuthLevel.LEVEL_1_STUDENT, expected: true },
    ];

    levelTests.forEach(({ role, level, expected }) => {
      it(`${role} meets level ${level}: ${expected ? 'GRANT' : 'DENY'}`, () => {
        const reflector = mockReflector({
          [AUTH_LEVEL_KEY]: level,
        });
        const guard = new AuthLevelGuard(reflector as any);
        const context = mockContext({ role });

        expect(guard.canActivate(context)).toBe(expected);
      });
    });

    it('should deny access when no user is present', () => {
      const reflector = mockReflector({
        [AUTH_LEVEL_KEY]: AuthLevel.LEVEL_1_STUDENT,
      });
      const guard = new AuthLevelGuard(reflector as any);
      const context = mockContext(undefined);

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should deny access for unknown role', () => {
      const reflector = mockReflector({
        [AUTH_LEVEL_KEY]: AuthLevel.LEVEL_1_STUDENT,
      });
      const guard = new AuthLevelGuard(reflector as any);
      const context = mockContext({ role: 'unknown_role' });

      expect(guard.canActivate(context)).toBe(false);
    });
  });

  describe('@Roles only (pass through — roles checked by RolesGuard)', () => {
    it('should allow any user when only @Roles is set (no auth level)', () => {
      const reflector = mockReflector({
        [ROLES_KEY]: [UserRole.PARENT],
      });
      const guard = new AuthLevelGuard(reflector as any);

      expect(guard.canActivate(mockContext({ role: 'parent' }))).toBe(true);
      expect(guard.canActivate(mockContext({ role: 'student' }))).toBe(true);
      expect(guard.canActivate(mockContext({ role: 'unknown' }))).toBe(true);
      expect(guard.canActivate(mockContext(undefined))).toBe(true);
    });
  });

  describe('@RequireAuthLevel + @Roles combined (only auth level is checked)', () => {
    it('should grant when auth level is satisfied', () => {
      const reflector = mockReflector({
        [ROLES_KEY]: [UserRole.TEACHER],
        [AUTH_LEVEL_KEY]: AuthLevel.LEVEL_3_TEACHER_TUTOR,
      });
      const guard = new AuthLevelGuard(reflector as any);
      const context = mockContext({ role: 'teacher' });

      expect(guard.canActivate(context)).toBe(true);
    });

    it('should deny when auth level is not met', () => {
      const reflector = mockReflector({
        [ROLES_KEY]: [UserRole.TEACHER],
        [AUTH_LEVEL_KEY]: AuthLevel.LEVEL_4_INSTITUTION_ADMIN,
      });
      const guard = new AuthLevelGuard(reflector as any);
      const context = mockContext({ role: 'teacher' });

      expect(guard.canActivate(context)).toBe(false);
    });

    it('should deny when auth level requires user but none present', () => {
      const reflector = mockReflector({
        [ROLES_KEY]: [UserRole.TEACHER],
        [AUTH_LEVEL_KEY]: AuthLevel.LEVEL_3_TEACHER_TUTOR,
      });
      const guard = new AuthLevelGuard(reflector as any);

      expect(guard.canActivate(mockContext(undefined))).toBe(false);
    });
  });
});
