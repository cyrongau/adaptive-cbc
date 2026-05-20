import { Module, OnModuleInit, Logger } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsageLog } from './entities/usage-log.entity';
import { CreditBalance } from './entities/credit-balance.entity';
import { QuotaConfig } from './entities/quota-config.entity';
import { UsageTrackerService } from './services/usage-tracker.service';
import { QuotaEnforcerService } from './services/quota-enforcer.service';
import { CreditLedgerService } from './services/credit-ledger.service';
import { CostRouterService } from './services/cost-router.service';
import { QuotaGuard } from './guards/quota.guard';
import { UsageTrackingInterceptor } from './interceptors/usage-tracking.interceptor';
import { GovernanceController } from './controllers/governance.controller';
import { RedisService } from '../../common/redis.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsageLog, CreditBalance, QuotaConfig]),
  ],
  controllers: [GovernanceController],
  providers: [
    RedisService,
    UsageTrackerService,
    QuotaEnforcerService,
    CreditLedgerService,
    CostRouterService,
    QuotaGuard,
    UsageTrackingInterceptor,
  ],
  exports: [
    RedisService,
    UsageTrackerService,
    QuotaEnforcerService,
    CreditLedgerService,
    CostRouterService,
    QuotaGuard,
    UsageTrackingInterceptor,
  ],
})
export class GovernanceModule implements OnModuleInit {
  private readonly logger = new Logger(GovernanceModule.name);

  constructor(private quotaEnforcer: QuotaEnforcerService) {}

  async onModuleInit() {
    try {
      await this.quotaEnforcer.initializeDefaults();
      this.logger.log('Governance module initialized with default quota configs');
    } catch (error) {
      this.logger.warn('Could not initialize governance defaults (DB may not be ready):', error.message);
    }
  }
}
