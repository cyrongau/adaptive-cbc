import { Controller, Get, Post, Put, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsageLog, GovernanceServiceType, GovernanceTier } from '../entities/usage-log.entity';
import { CreditBalance, CreditType } from '../entities/credit-balance.entity';
import { QuotaConfig } from '../entities/quota-config.entity';
import { UsageTrackerService } from '../services/usage-tracker.service';
import { QuotaEnforcerService } from '../services/quota-enforcer.service';
import { CreditLedgerService } from '../services/credit-ledger.service';
import { CostRouterService, TaskComplexity } from '../services/cost-router.service';
import { UsageQueryDto, CreditAllocationDto, QuotaUpdateDto } from '../dto/governance.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

@ApiTags('Governance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/governance')
export class GovernanceController {
  constructor(
    @InjectRepository(UsageLog)
    private usageLogRepo: Repository<UsageLog>,
    @InjectRepository(CreditBalance)
    private creditBalanceRepo: Repository<CreditBalance>,
    @InjectRepository(QuotaConfig)
    private quotaConfigRepo: Repository<QuotaConfig>,
    private usageTracker: UsageTrackerService,
    private quotaEnforcer: QuotaEnforcerService,
    private creditLedger: CreditLedgerService,
    private costRouter: CostRouterService,
  ) {}

  @Get('usage')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Get usage logs with filters' })
  async getUsageLogs(@Query() query: UsageQueryDto) {
    const qb = this.usageLogRepo.createQueryBuilder('log');

    if (query.userId) qb.andWhere('log.userId = :userId', { userId: query.userId });
    if (query.institutionId) qb.andWhere('log.institutionId = :institutionId', { institutionId: query.institutionId });
    if (query.service) qb.andWhere('log.service = :service', { service: query.service });
    if (query.tier) qb.andWhere('log.userTier = :tier', { tier: query.tier });
    if (query.startDate) qb.andWhere('log.createdAt >= :startDate', { startDate: query.startDate });
    if (query.endDate) qb.andWhere('log.createdAt <= :endDate', { endDate: query.endDate });

    qb.orderBy('log.createdAt', 'DESC').limit(100);

    const [logs, total] = await qb.getManyAndCount();

    const totalCost = logs.reduce((sum, log) => sum + log.costEstimate, 0);
    const cacheHits = logs.filter((log) => log.wasCached).length;

    return {
      logs,
      total,
      totalCost: Math.round(totalCost * 1000) / 1000,
      cacheHitRate: logs.length > 0 ? Math.round((cacheHits / logs.length) * 100) : 0,
    };
  }

  @Get('usage/:userId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Get usage breakdown for a specific user' })
  async getUserUsage(@Param('userId') userId: string) {
    const today = new Date().toISOString().split('T')[0];

    const services = Object.values(GovernanceServiceType);
    const breakdown = await Promise.all(
      services.map(async (service) => {
        const count = await this.usageTracker.getUsage(userId, service);
        const cost = await this.usageTracker.getCost(userId, service);
        const cacheHits = await this.usageTracker.getCacheHits(service);
        return { service, count, cost: Math.round(cost * 1000) / 1000, cacheHits };
      }),
    );

    const totalCost = breakdown.reduce((sum, b) => sum + b.cost, 0);
    const totalRequests = breakdown.reduce((sum, b) => sum + b.count, 0);

    return {
      userId,
      date: today,
      breakdown,
      totalCost: Math.round(totalCost * 1000) / 1000,
      totalRequests,
    };
  }

  @Get('quotas')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all quota configurations' })
  async getQuotas() {
    const quotas = await this.quotaConfigRepo.find({ order: { tier: 'ASC' } });
    return { quotas };
  }

  @Get('quotas/:tier')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get quota config for a specific tier' })
  async getQuota(@Param('tier') tier: GovernanceTier) {
    const config = await this.quotaEnforcer.getQuotaConfig(tier);
    return { config };
  }

  @Put('quotas')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update quota configuration' })
  async updateQuota(@Body() dto: QuotaUpdateDto) {
    const config = await this.quotaConfigRepo.findOne({ where: { tier: dto.tier } });
    if (!config) {
      return { error: 'Tier not found' };
    }

    if (dto.dailyOcrPages !== undefined) config.dailyOcrPages = dto.dailyOcrPages;
    if (dto.dailyAiRequests !== undefined) config.dailyAiRequests = dto.dailyAiRequests;
    if (dto.dailyOcrCostCap !== undefined) config.dailyOcrCostCap = dto.dailyOcrCostCap;
    if (dto.dailyAiCostCap !== undefined) config.dailyAiCostCap = dto.dailyAiCostCap;
    if (dto.liveClassDurationMinutes !== undefined) config.liveClassDurationMinutes = dto.liveClassDurationMinutes;
    if (dto.liveClassMaxParticipants !== undefined) config.liveClassMaxParticipants = dto.liveClassMaxParticipants;
    if (dto.storageLimitMb !== undefined) config.storageLimitMb = dto.storageLimitMb;
    if (dto.canEscalateToPremium !== undefined) config.canEscalateToPremium = dto.canEscalateToPremium;
    if (dto.escalationConfidenceThreshold !== undefined) config.escalationConfidenceThreshold = dto.escalationConfidenceThreshold;

    await this.quotaConfigRepo.save(config);
    this.quotaEnforcer.clearCache();

    return { success: true, config };
  }

  @Get('credits/:userId')
  @ApiOperation({ summary: 'Get credit balances for a user' })
  async getUserCredits(@Param('userId') userId: string) {
    const balances = await this.creditLedger.getAllBalances(userId);
    return { userId, balances };
  }

  @Get('credits/institution/:institutionId')
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Get credit balances for an institution' })
  async getInstitutionCredits(@Param('institutionId') institutionId: string) {
    const balances = await this.creditLedger.getAllInstitutionBalances(institutionId);
    return { institutionId, balances };
  }

  @Post('credits/allocate')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Allocate credits to a user or institution' })
  async allocateCredits(@Body() dto: CreditAllocationDto) {
    const balance = await this.creditLedger.allocateCredits({
      userId: dto.userId,
      institutionId: dto.institutionId,
      type: dto.type,
      amount: dto.amount,
      source: 'admin_grant' as any,
      description: dto.description,
    });
    return { success: true, balance };
  }

  @Get('costs')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get cost analytics dashboard data' })
  async getCostAnalytics() {
    const today = new Date().toISOString().split('T')[0];

    const serviceCosts = await this.usageLogRepo
      .createQueryBuilder('log')
      .select('log.service', 'service')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(log.costEstimate)', 'totalCost')
      .where('DATE(log.createdAt) = :today', { today })
      .groupBy('log.service')
      .orderBy('SUM(log.costEstimate)', 'DESC')
      .getRawMany();

    const tierUsage = await this.usageLogRepo
      .createQueryBuilder('log')
      .select('log.userTier', 'tier')
      .addSelect('COUNT(*)', 'count')
      .addSelect('SUM(log.costEstimate)', 'totalCost')
      .where('DATE(log.createdAt) = :today', { today })
      .groupBy('log.userTier')
      .orderBy('SUM(log.costEstimate)', 'DESC')
      .getRawMany();

    const cacheHits = await this.usageLogRepo
      .createQueryBuilder('log')
      .select('COUNT(*)', 'count')
      .where('log.wasCached = :cached AND DATE(log.createdAt) = :today', { cached: true, today })
      .getRawOne();

    const totalLogs = await this.usageLogRepo
      .createQueryBuilder('log')
      .select('COUNT(*)', 'count')
      .where('DATE(log.createdAt) = :today', { today })
      .getRawOne();

    const totalCost = serviceCosts.reduce((sum, s) => sum + parseFloat(s.totalCost || '0'), 0);
    const cacheHitRate = totalLogs?.count > 0
      ? Math.round(((cacheHits?.count || 0) / parseInt(totalLogs.count)) * 100)
      : 0;

    return {
      date: today,
      totalCost: Math.round(totalCost * 1000) / 1000,
      totalRequests: parseInt(totalLogs?.count || '0'),
      cacheHitRate,
      serviceCosts: serviceCosts.map((s) => ({
        service: s.service,
        count: parseInt(s.count),
        totalCost: Math.round(parseFloat(s.totalCost || '0') * 1000) / 1000,
      })),
      tierUsage: tierUsage.map((t) => ({
        tier: t.tier,
        count: parseInt(t.count),
        totalCost: Math.round(parseFloat(t.totalCost || '0') * 1000) / 1000,
      })),
    };
  }

  @Get('forecast')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get projected monthly spend based on current usage' })
  async getForecast() {
    const today = new Date();
    const dayOfMonth = today.getDate();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

    const monthToDate = await this.usageLogRepo
      .createQueryBuilder('log')
      .select('SUM(log.costEstimate)', 'totalCost')
      .where('log.createdAt >= :monthStart', { monthStart })
      .getRawOne();

    const currentCost = parseFloat(monthToDate?.totalCost || '0');
    const projectedMonthly = dayOfMonth > 0 ? (currentCost / dayOfMonth) * daysInMonth : 0;

    const aiSpend = await this.usageLogRepo
      .createQueryBuilder('log')
      .select('SUM(log.costEstimate)', 'totalCost')
      .where('log.createdAt >= :monthStart AND log.service LIKE :pattern', { monthStart, pattern: 'ai_%' })
      .getRawOne();

    const ocrSpend = await this.usageLogRepo
      .createQueryBuilder('log')
      .select('SUM(log.costEstimate)', 'totalCost')
      .where('log.createdAt >= :monthStart AND log.service = :service', { monthStart, service: 'ocr' })
      .getRawOne();

    return {
      monthToDate: Math.round(currentCost * 1000) / 1000,
      projectedMonthly: Math.round(projectedMonthly * 1000) / 1000,
      aiSpendToDate: Math.round(parseFloat(aiSpend?.totalCost || '0') * 1000) / 1000,
      ocrSpendToDate: Math.round(parseFloat(ocrSpend?.totalCost || '0') * 1000) / 1000,
      daysRemaining: daysInMonth - dayOfMonth,
    };
  }

  @Post('routing/test')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Test AI cost routing decision' })
  async testRouting(
    @Body() body: { complexity: TaskComplexity; tier: GovernanceTier; confidence?: number },
  ) {
    const decision = this.costRouter.routeAiTask(
      body.complexity,
      body.tier,
      body.confidence,
    );
    return { decision };
  }
}
