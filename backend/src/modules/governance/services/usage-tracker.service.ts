import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../common/redis.service';
import { GovernanceServiceType, GovernanceTier } from '../entities/usage-log.entity';

export interface UsageSnapshot {
  count: number;
  limit: number;
  remaining: number;
  resetAt: Date;
  isExceeded: boolean;
}

@Injectable()
export class UsageTrackerService {
  private readonly logger = new Logger(UsageTrackerService.name);

  constructor(private redis: RedisService) {}

  private getDailyKey(userId: string, service: GovernanceServiceType): string {
    const today = new Date().toISOString().split('T')[0];
    return `governance:usage:${userId}:${service}:${today}`;
  }

  private getDailyCostKey(userId: string, service: GovernanceServiceType): string {
    const today = new Date().toISOString().split('T')[0];
    return `governance:cost:${userId}:${service}:${today}`;
  }

  private getInstitutionDailyKey(institutionId: string, service: GovernanceServiceType): string {
    const today = new Date().toISOString().split('T')[0];
    return `governance:usage:inst:${institutionId}:${service}:${today}`;
  }

  async incrementUsage(
    userId: string,
    service: GovernanceServiceType,
    amount: number = 1,
    ttlSeconds: number = 86400,
  ): Promise<number> {
    const key = this.getDailyKey(userId, service);
    const count = await this.redis.getClient().incrby(key, amount);
    await this.redis.expire(key, ttlSeconds);
    return count;
  }

  async addCost(
    userId: string,
    service: GovernanceServiceType,
    cost: number,
    ttlSeconds: number = 86400,
  ): Promise<number> {
    const key = this.getDailyCostKey(userId, service);
    const client = this.redis.getClient();
    const current = await client.get(key);
    const newTotal = (parseFloat(current || '0') + cost);
    await client.set(key, newTotal.toFixed(4), 'EX', ttlSeconds);
    return newTotal;
  }

  async incrementInstitutionUsage(
    institutionId: string,
    service: GovernanceServiceType,
    amount: number = 1,
    ttlSeconds: number = 86400,
  ): Promise<number> {
    const key = this.getInstitutionDailyKey(institutionId, service);
    const count = await this.redis.getClient().incrby(key, amount);
    await this.redis.expire(key, ttlSeconds);
    return count;
  }

  async getUsage(
    userId: string,
    service: GovernanceServiceType,
  ): Promise<number> {
    const key = this.getDailyKey(userId, service);
    const value = await this.redis.get(key);
    return parseInt(value || '0', 10);
  }

  async getCost(
    userId: string,
    service: GovernanceServiceType,
  ): Promise<number> {
    const key = this.getDailyCostKey(userId, service);
    const value = await this.redis.get(key);
    return parseFloat(value || '0');
  }

  async getInstitutionUsage(
    institutionId: string,
    service: GovernanceServiceType,
  ): Promise<number> {
    const key = this.getInstitutionDailyKey(institutionId, service);
    const value = await this.redis.get(key);
    return parseInt(value || '0', 10);
  }

  async checkUsage(
    userId: string,
    service: GovernanceServiceType,
    limit: number,
  ): Promise<UsageSnapshot> {
    const count = await this.getUsage(userId, service);
    const remaining = Math.max(0, limit - count);
    const resetAt = new Date();
    resetAt.setHours(23, 59, 59, 999);

    return {
      count,
      limit,
      remaining,
      resetAt,
      // limit=0 means unlimited (consistent with cost cap semantics).
      // Never mark as exceeded if the configured limit is 0.
      isExceeded: limit > 0 && count >= limit,
    };
  }

  async checkCost(
    userId: string,
    service: GovernanceServiceType,
    cap: number,
  ): Promise<UsageSnapshot> {
    const cost = await this.getCost(userId, service);
    const remaining = Math.max(0, cap - cost);
    const resetAt = new Date();
    resetAt.setHours(23, 59, 59, 999);

    return {
      count: Math.round(cost * 100) / 100,
      limit: cap,
      remaining: Math.round(remaining * 100) / 100,
      resetAt,
      isExceeded: cost >= cap,
    };
  }

  async resetUsage(userId: string, service: GovernanceServiceType): Promise<void> {
    const key = this.getDailyKey(userId, service);
    await this.redis.del(key);
    const costKey = this.getDailyCostKey(userId, service);
    await this.redis.del(costKey);
  }

  getTierPriority(tier: GovernanceTier): number {
    const priorities: Record<GovernanceTier, number> = {
      [GovernanceTier.FREE]: 1,
      [GovernanceTier.STANDARD]: 2,
      [GovernanceTier.TUTOR]: 3,
      [GovernanceTier.SCHOOL]: 4,
      [GovernanceTier.ENTERPRISE]: 5,
    };
    return priorities[tier] || 1;
  }

  async recordCacheHit(service: GovernanceServiceType): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = `governance:cache-hits:${service}:${today}`;
    await this.redis.getClient().incr(key);
    await this.redis.expire(key, 86400);
  }

  async recordEscalation(
    service: GovernanceServiceType,
    from: string,
    to: string,
  ): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    const key = `governance:escalations:${service}:${from}:${to}:${today}`;
    await this.redis.getClient().incr(key);
    await this.redis.expire(key, 86400);
  }

  async getCacheHits(service: GovernanceServiceType): Promise<number> {
    const today = new Date().toISOString().split('T')[0];
    const key = `governance:cache-hits:${service}:${today}`;
    const value = await this.redis.get(key);
    return parseInt(value || '0', 10);
  }
}
