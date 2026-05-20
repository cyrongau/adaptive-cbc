import { SetMetadata } from '@nestjs/common';
import { GovernanceServiceType } from '../entities/usage-log.entity';

export const QUOTA_KEY = 'quota';

export interface QuotaOption {
  service: GovernanceServiceType;
  cost?: number;
  pages?: number;
}

export const Quota = (service: GovernanceServiceType, options?: { cost?: number; pages?: number }) =>
  SetMetadata(QUOTA_KEY, { service, cost: options?.cost, pages: options?.pages });
