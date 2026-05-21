import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { UsageTrackerService } from '../services/usage-tracker.service';
import { UsageLog, GovernanceServiceType, GovernanceTier } from '../entities/usage-log.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { QuotaEnforcerService } from '../services/quota-enforcer.service';
import { User } from '../../users/entities/user.entity';

@Injectable()
export class UsageTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(UsageTrackingInterceptor.name);

  constructor(
    private usageTracker: UsageTrackerService,
    private quotaEnforcer: QuotaEnforcerService,
    @InjectRepository(UsageLog)
    private usageLogRepo: Repository<UsageLog>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const user: User = request.user;

    const serviceType = this.inferServiceType(context);
    if (!serviceType || !user) {
      return next.handle();
    }

    const tier = this.getUserTier(user);
    const startTime = Date.now();

    return next.handle().pipe(
      tap(async (response) => {
        const duration = Date.now() - startTime;
        const wasCached = response?.wasCached || false;
        const wasEscalated = response?.wasEscalated || false;

        if (!wasCached) {
          await this.usageTracker.incrementUsage(user.id, serviceType);
          if (user.institutionId) {
            await this.usageTracker.incrementInstitutionUsage(user.institutionId, serviceType);
          }
        }

        const costEstimate = this.estimateCost(serviceType, response, wasCached);
        if (costEstimate > 0 && !wasCached) {
          await this.usageTracker.addCost(user.id, serviceType, costEstimate);
        }

        const usageLog = this.usageLogRepo.create({
          userId: user.id,
          institutionId: user.institutionId,
          service: serviceType,
          action: this.getAction(context),
          costEstimate,
          tokensUsed: response?.usage?.total_tokens || 0,
          pagesProcessed: serviceType === GovernanceServiceType.OCR ? (response?.pages || 1) : 0,
          confidence: response?.confidence,
          userTier: tier,
          wasCached,
          wasEscalated,
          escalatedFrom: response?.escalatedFrom,
          escalatedTo: response?.escalatedTo,
          modelUsed: response?.model,
          metadata: {
            duration,
            statusCode: response?.statusCode,
          },
        });

        await this.usageLogRepo.save(usageLog);
      }),
    );
  }

  private inferServiceType(context: ExecutionContext): GovernanceServiceType | null {
    const request = context.switchToHttp().getRequest();
    const url = request.url;
    const method = request.method;

    if (method !== 'POST') {
      return null; // Usage is only consumed on POST/action requests
    }

    if (url.includes('/ocr/upload') || url.includes('/ocr/process')) {
      return GovernanceServiceType.OCR;
    }
    if (url.includes('/explain')) {
      return GovernanceServiceType.AI_EXPLANATION;
    }
    if (url.includes('/quiz') || url.includes('/questions/generate')) {
      return GovernanceServiceType.AI_QUESTION_GEN;
    }
    if (url.includes('/similar')) {
      return GovernanceServiceType.AI_SIMILAR_QUESTIONS;
    }
    if (url.includes('/simplify') || url.includes('/concept')) {
      return GovernanceServiceType.AI_CONCEPT_SIMPLIFY;
    }
    if (url.includes('/validate') || url.includes('/answer')) {
      return GovernanceServiceType.AI_VALIDATE_ANSWER;
    }
    if (url.includes('/onboarding')) {
      return GovernanceServiceType.AI_ONBOARDING;
    }
    if (url.includes('/recommend')) {
      return GovernanceServiceType.AI_RECOMMENDATIONS;
    }

    return null;
  }

  private getAction(context: ExecutionContext): string {
    const handler = context.getHandler();
    return handler.name;
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
    return roleTierMap[user.role] || GovernanceTier.FREE;
  }

  private estimateCost(
    service: GovernanceServiceType,
    response: any,
    wasCached: boolean,
  ): number {
    if (wasCached) return 0;

    switch (service) {
      case GovernanceServiceType.OCR:
        return 0.0015;
      case GovernanceServiceType.AI_EXPLANATION:
        return (response?.usage?.total_tokens || 500) / 1000 * 0.00125;
      case GovernanceServiceType.AI_QUESTION_GEN:
        return (response?.usage?.total_tokens || 2000) / 1000 * 0.00125;
      case GovernanceServiceType.AI_SIMILAR_QUESTIONS:
        return (response?.usage?.total_tokens || 1000) / 1000 * 0.00125;
      case GovernanceServiceType.AI_CONCEPT_SIMPLIFY:
        return (response?.usage?.total_tokens || 800) / 1000 * 0.00125;
      case GovernanceServiceType.AI_VALIDATE_ANSWER:
        return (response?.usage?.total_tokens || 600) / 1000 * 0.00125;
      case GovernanceServiceType.AI_ONBOARDING:
        return (response?.usage?.total_tokens || 3000) / 1000 * 0.00125;
      case GovernanceServiceType.AI_RECOMMENDATIONS:
        return (response?.usage?.total_tokens || 1500) / 1000 * 0.00125;
      default:
        return 0;
    }
  }
}
