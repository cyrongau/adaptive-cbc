export enum AuthLevel {
  LEVEL_1_STUDENT = 'LEVEL_1_STUDENT',
  LEVEL_2_PARENT = 'LEVEL_2_PARENT',
  LEVEL_3_TEACHER_TUTOR = 'LEVEL_3_TEACHER_TUTOR',
  LEVEL_4_INSTITUTION_ADMIN = 'LEVEL_4_INSTITUTION_ADMIN',
  LEVEL_5_SUPER_ADMIN = 'LEVEL_5_SUPER_ADMIN',
}

export const AUTH_LEVEL_HIERARCHY: Record<AuthLevel, number> = {
  [AuthLevel.LEVEL_1_STUDENT]: 1,
  [AuthLevel.LEVEL_2_PARENT]: 2,
  [AuthLevel.LEVEL_3_TEACHER_TUTOR]: 3,
  [AuthLevel.LEVEL_4_INSTITUTION_ADMIN]: 4,
  [AuthLevel.LEVEL_5_SUPER_ADMIN]: 5,
};

export const ROLE_TO_AUTH_LEVEL: Record<string, AuthLevel> = {
  student: AuthLevel.LEVEL_1_STUDENT,
  parent: AuthLevel.LEVEL_2_PARENT,
  teacher: AuthLevel.LEVEL_3_TEACHER_TUTOR,
  tutor: AuthLevel.LEVEL_3_TEACHER_TUTOR,
  institution_admin: AuthLevel.LEVEL_4_INSTITUTION_ADMIN,
  super_admin: AuthLevel.LEVEL_5_SUPER_ADMIN,
};

export function meetsAuthLevel(userLevel: AuthLevel, requiredLevel: AuthLevel): boolean {
  return AUTH_LEVEL_HIERARCHY[userLevel] >= AUTH_LEVEL_HIERARCHY[requiredLevel];
}
