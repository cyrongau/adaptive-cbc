import { IsEnum, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { GovernanceServiceType, GovernanceTier } from '../entities/usage-log.entity';
import { CreditType } from '../entities/credit-balance.entity';

export class UsageQueryDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  institutionId?: string;

  @IsOptional()
  @IsEnum(GovernanceServiceType)
  service?: GovernanceServiceType;

  @IsOptional()
  @IsEnum(GovernanceTier)
  tier?: GovernanceTier;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}

export class CreditAllocationDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  institutionId?: string;

  @IsEnum(CreditType)
  type: CreditType;

  @IsNumber()
  amount: number;

  @IsOptional()
  @IsString()
  description?: string;
}

export class QuotaUpdateDto {
  @IsEnum(GovernanceTier)
  tier: GovernanceTier;

  @IsOptional()
  @IsNumber()
  dailyOcrPages?: number;

  @IsOptional()
  @IsNumber()
  dailyAiRequests?: number;

  @IsOptional()
  @IsNumber()
  dailyOcrCostCap?: number;

  @IsOptional()
  @IsNumber()
  dailyAiCostCap?: number;

  @IsOptional()
  @IsNumber()
  liveClassDurationMinutes?: number;

  @IsOptional()
  @IsNumber()
  liveClassMaxParticipants?: number;

  @IsOptional()
  @IsNumber()
  storageLimitMb?: number;

  @IsOptional()
  @IsBoolean()
  canEscalateToPremium?: boolean;

  @IsOptional()
  @IsNumber()
  escalationConfidenceThreshold?: number;
}

export class GovernanceStatsDto {
  totalUsageToday: number;
  totalCostToday: number;
  cacheHitRate: number;
  escalationRate: number;
  quotaBreaches: number;
  topServices: { service: string; count: number; cost: number }[];
  topUsers: { userId: string; count: number; cost: number }[];
}
