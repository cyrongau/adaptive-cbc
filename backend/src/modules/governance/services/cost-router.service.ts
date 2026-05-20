import { Injectable, Logger } from '@nestjs/common';
import { GovernanceTier } from '../entities/usage-log.entity';
import { QuotaEnforcerService } from './quota-enforcer.service';

export enum IntelligenceTier {
  LOCAL = 'local',
  CHEAP_AI = 'cheap_ai',
  PREMIUM_AI = 'premium_ai',
}

export interface CostRoutingDecision {
  tier: IntelligenceTier;
  model?: string;
  reason: string;
  estimatedCost: number;
  shouldCache: boolean;
}

export enum TaskComplexity {
  TRIVIAL = 'trivial',
  SIMPLE = 'simple',
  MODERATE = 'moderate',
  COMPLEX = 'complex',
  EXPERT = 'expert',
}

const MODEL_COST_PER_1K_TOKENS: Record<string, number> = {
  'google/gemini-2.0-flash-001': 0.00035,
  'anthropic/claude-3-haiku': 0.00125,
  'anthropic/claude-3.5-sonnet': 0.015,
  'openai/gpt-4o-mini': 0.0006,
  'openai/gpt-4o': 0.01,
};

@Injectable()
export class CostRouterService {
  private readonly logger = new Logger(CostRouterService.name);

  constructor(private quotaEnforcer: QuotaEnforcerService) {}

  routeAiTask(
    complexity: TaskComplexity,
    tier: GovernanceTier,
    confidence?: number,
    isCached?: boolean,
  ): CostRoutingDecision {
    const canEscalate = this.quotaEnforcer.canEscalate(tier);
    const escalationThreshold = this.quotaEnforcer.getEscalationThreshold(tier);

    if (isCached) {
      return {
        tier: IntelligenceTier.LOCAL,
        reason: 'Cached response available',
        estimatedCost: 0,
        shouldCache: true,
      };
    }

    switch (complexity) {
      case TaskComplexity.TRIVIAL:
        return {
          tier: IntelligenceTier.LOCAL,
          reason: 'Trivial task - use local logic (regex, rules)',
          estimatedCost: 0,
          shouldCache: true,
        };

      case TaskComplexity.SIMPLE:
        return {
          tier: IntelligenceTier.CHEAP_AI,
          model: 'google/gemini-2.0-flash-001',
          reason: 'Simple task - cheap AI model sufficient',
          estimatedCost: MODEL_COST_PER_1K_TOKENS['google/gemini-2.0-flash-001'] * 2,
          shouldCache: true,
        };

      case TaskComplexity.MODERATE:
        if (canEscalate && confidence !== undefined && confidence < escalationThreshold / 100) {
          return {
            tier: IntelligenceTier.PREMIUM_AI,
            model: 'anthropic/claude-3.5-sonnet',
            reason: `Moderate task with low confidence (${confidence}) - escalating to premium`,
            estimatedCost: MODEL_COST_PER_1K_TOKENS['anthropic/claude-3.5-sonnet'] * 3,
            shouldCache: true,
          };
        }
        return {
          tier: IntelligenceTier.CHEAP_AI,
          model: 'anthropic/claude-3-haiku',
          reason: 'Moderate task - mid-tier model',
          estimatedCost: MODEL_COST_PER_1K_TOKENS['anthropic/claude-3-haiku'] * 2,
          shouldCache: true,
        };

      case TaskComplexity.COMPLEX:
        if (!canEscalate) {
          return {
            tier: IntelligenceTier.CHEAP_AI,
            model: 'anthropic/claude-3-haiku',
            reason: 'Complex task but user tier cannot escalate - using best available',
            estimatedCost: MODEL_COST_PER_1K_TOKENS['anthropic/claude-3-haiku'] * 4,
            shouldCache: true,
          };
        }
        return {
          tier: IntelligenceTier.PREMIUM_AI,
          model: 'anthropic/claude-3.5-sonnet',
          reason: 'Complex task - premium reasoning required',
          estimatedCost: MODEL_COST_PER_1K_TOKENS['anthropic/claude-3.5-sonnet'] * 4,
          shouldCache: true,
        };

      case TaskComplexity.EXPERT:
        if (!canEscalate) {
          return {
            tier: IntelligenceTier.CHEAP_AI,
            model: 'anthropic/claude-3-haiku',
            reason: 'Expert task but user tier cannot escalate - degraded service',
            estimatedCost: MODEL_COST_PER_1K_TOKENS['anthropic/claude-3-haiku'] * 5,
            shouldCache: true,
          };
        }
        return {
          tier: IntelligenceTier.PREMIUM_AI,
          model: 'anthropic/claude-3.5-sonnet',
          reason: 'Expert task - premium reasoning required',
          estimatedCost: MODEL_COST_PER_1K_TOKENS['anthropic/claude-3.5-sonnet'] * 5,
          shouldCache: true,
        };

      default:
        return {
          tier: IntelligenceTier.CHEAP_AI,
          model: 'google/gemini-2.0-flash-001',
          reason: 'Default routing - cheap AI model',
          estimatedCost: MODEL_COST_PER_1K_TOKENS['google/gemini-2.0-flash-001'] * 2,
          shouldCache: true,
        };
    }
  }

  routeOcrTask(
    confidence: number,
    tier: GovernanceTier,
    hasFormulas: boolean = false,
  ): CostRoutingDecision {
    const canEscalate = this.quotaEnforcer.canEscalate(tier);
    const escalationThreshold = this.quotaEnforcer.getEscalationThreshold(tier) / 100;

    if (confidence >= 0.85) {
      return {
        tier: IntelligenceTier.LOCAL,
        reason: `High confidence OCR (${(confidence * 100).toFixed(0)}%) - no escalation needed`,
        estimatedCost: 0,
        shouldCache: true,
      };
    }

    if (confidence >= escalationThreshold && !hasFormulas) {
      return {
        tier: IntelligenceTier.CHEAP_AI,
        model: 'google-cloud-vision',
        reason: `Medium confidence (${(confidence * 100).toFixed(0)}%) - Google Vision fallback`,
        estimatedCost: 0.0015,
        shouldCache: true,
      };
    }

    if (canEscalate && (confidence < escalationThreshold || hasFormulas)) {
      return {
        tier: IntelligenceTier.PREMIUM_AI,
        model: hasFormulas ? 'mathpix' : 'google-cloud-vision',
        reason: `Low confidence (${(confidence * 100).toFixed(0)}%)${hasFormulas ? ' + formulas' : ''} - premium OCR escalation`,
        estimatedCost: hasFormulas ? 0.005 : 0.002,
        shouldCache: true,
      };
    }

    return {
      tier: IntelligenceTier.CHEAP_AI,
      model: 'google-cloud-vision',
      reason: `Cannot escalate - using Google Vision as best available`,
      estimatedCost: 0.0015,
      shouldCache: true,
    };
  }

  estimateCost(model: string, inputTokens: number, outputTokens: number): number {
    const costPer1K = MODEL_COST_PER_1K_TOKENS[model] || 0.001;
    return ((inputTokens + outputTokens) / 1000) * costPer1K;
  }

  getCacheKey(
    serviceType: string,
    contentHash: string,
    model?: string,
  ): string {
    const modelPart = model ? `:${model}` : '';
    return `governance:cache:${serviceType}:${contentHash}${modelPart}`;
  }
}
