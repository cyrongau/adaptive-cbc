import { Injectable, CanActivate, ExecutionContext, Logger, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { QUOTA_KEY, QuotaOption } from './quota.decorator';
import { QuotaEnforcerService } from '../services/quota-enforcer.service';
import { GovernanceTier } from '../entities/usage-log.entity';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class QuotaGuard implements CanActivate {
  private readonly logger = new Logger(QuotaGuard.name);

  constructor(
    private reflector: Reflector,
    private quotaEnforcer: QuotaEnforcerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const quotaOptions = this.reflector.getAllAndOverride<QuotaOption>(QUOTA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!quotaOptions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    if (!user) {
      return true;
    }

    const tier = this.getUserTier(user);

    let result;
    if (quotaOptions.service === 'ocr') {
      result = await this.quotaEnforcer.checkOcrQuota(
        user.id,
        tier,
        quotaOptions.pages || 1,
        user.institutionId,
      );
    } else {
      result = await this.quotaEnforcer.checkAiQuota(
        user.id,
        tier,
        user.institutionId,
      );
    }

    if (!result.allowed) {
      this.logger.warn(`Quota exceeded for user ${user.id}: ${result.reason}`);
      const error = new ForbiddenException({
        message: result.reason || 'Resource quota exceeded',
        retryAfter: result.retryAfter,
        usage: result.usage,
        costSnapshot: result.costSnapshot,
      });
      (error as any).response = {
        statusCode: 429,
        message: result.reason || 'Resource quota exceeded',
        retryAfter: result.retryAfter?.toISOString(),
        usage: result.usage,
        costSnapshot: result.costSnapshot,
      };
      throw error;
    }

    request.quotaResult = result;
    return true;
  }

  private getUserTier(user: User): GovernanceTier {
    const roleTierMap: Record<string, GovernanceTier> = {
      'SUPER_ADMIN': GovernanceTier.ENTERPRISE,
      'INSTITUTION_ADMIN': GovernanceTier.SCHOOL,
      'TEACHER': GovernanceTier.TUTOR,
      'TUTOR': GovernanceTier.TUTOR,
      'STUDENT': GovernanceTier.FREE,
      'PARENT': GovernanceTier.FREE,
    };

    if (user.secondaryRoles && user.secondaryRoles.length > 0) {
      for (const role of user.secondaryRoles) {
        const tier = roleTierMap[role];
        if (tier && this.tierPriority(tier) > this.tierPriority(roleTierMap[user.role])) {
          return tier;
        }
      }
    }

    return roleTierMap[user.role] || GovernanceTier.FREE;
  }

  private tierPriority(tier: GovernanceTier): number {
    const priorities = {
      [GovernanceTier.FREE]: 1,
      [GovernanceTier.STANDARD]: 2,
      [GovernanceTier.TUTOR]: 3,
      [GovernanceTier.SCHOOL]: 4,
      [GovernanceTier.ENTERPRISE]: 5,
    };
    return priorities[tier] || 1;
  }
}
