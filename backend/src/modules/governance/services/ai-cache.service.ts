import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../../../common/redis.service';

@Injectable()
export class AICacheService {
  private readonly logger = new Logger(AICacheService.name);
  private readonly CACHE_PREFIX = 'ai:cache:';
  private readonly CACHE_TTL = 86400 * 30;

  constructor(private redis: RedisService) {}

  private buildKey(serviceType: string, content: string, model: string = ''): string {
    const crypto = require('crypto');
    const contentHash = crypto.createHash('sha256').update(content).digest('hex').substring(0, 16);
    const modelPart = model ? `:${model}` : '';
    return `${this.CACHE_PREFIX}${serviceType}:${contentHash}${modelPart}`;
  }

  async get(serviceType: string, content: string, model: string = ''): Promise<any> {
    const key = this.buildKey(serviceType, content, model);
    const cached = await this.redis.get(key);
    if (cached) {
      const data = JSON.parse(cached);
      return { ...data.result, wasCached: true, cachedAt: data.cachedAt };
    }
    return null;
  }

  async set(serviceType: string, content: string, result: any, model: string = ''): Promise<void> {
    const key = this.buildKey(serviceType, content, model);
    const cacheData = {
      result,
      cachedAt: Date.now(),
    };
    await this.redis.set(key, JSON.stringify(cacheData), this.CACHE_TTL);
    this.logger.debug(`Cached AI response for ${serviceType}`);
  }

  async getStats(): Promise<{ totalCached: number; estimatedSavings: string }> {
    const keys = await this.redis.keys(`${this.CACHE_PREFIX}*`);
    const total = keys.length;
    return {
      totalCached: total,
      estimatedSavings: `$${(total * 0.001).toFixed(4)}`,
    };
  }
}
