export class UpdatePlatformSettingsDto {
  platformName?: string;
  emailVerification?: boolean;
  maintenanceMode?: boolean;
  allowRegistration?: boolean;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  footerText?: string;
}

export class UpdatePracticeConfigDto {
  defaultQuestions?: number;
  allowStudentOverride?: boolean;
  minQuestions?: number;
  maxQuestions?: number;
}

export class UpdateInstitutionSettingsDto {
  allowSelfRegistration?: boolean;
  requireApproval?: boolean;
  enableParentPortal?: boolean;
  enableTeacherDashboard?: boolean;
  customBranding?: boolean;
}

export class UpdateUserSettingsDto {
  notifications?: {
    emailNotifications?: boolean;
    assignmentReminders?: boolean;
    progressReports?: boolean;
    marketingEmails?: boolean;
  };
  security?: {
    twoFactorEnabled?: boolean;
    sessionTimeout?: number;
    passwordExpiry?: number;
  };
  preferences?: Record<string, any>;
}
