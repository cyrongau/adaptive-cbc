import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreditBalance, CreditType, CreditSource } from '../entities/credit-balance.entity';
import { GovernanceTier } from '../entities/usage-log.entity';

export interface CreditOperation {
  userId?: string;
  institutionId?: string;
  type: CreditType;
  amount: number;
  source: CreditSource;
  description?: string;
}

@Injectable()
export class CreditLedgerService {
  private readonly logger = new Logger(CreditLedgerService.name);

  constructor(
    @InjectRepository(CreditBalance)
    private creditBalanceRepo: Repository<CreditBalance>,
  ) {}

  async getBalance(
    userId: string,
    type: CreditType,
  ): Promise<CreditBalance | null> {
    return this.creditBalanceRepo.findOne({
      where: { userId, type },
    });
  }

  async getInstitutionBalance(
    institutionId: string,
    type: CreditType,
  ): Promise<CreditBalance | null> {
    return this.creditBalanceRepo.findOne({
      where: { institutionId, type },
    });
  }

  async allocateCredits(operation: CreditOperation): Promise<CreditBalance> {
    let balance = operation.userId
      ? await this.getBalance(operation.userId, operation.type)
      : await this.getInstitutionBalance(operation.institutionId!, operation.type);

    if (!balance) {
      balance = this.creditBalanceRepo.create({
        userId: operation.userId,
        institutionId: operation.institutionId,
        type: operation.type,
        balance: 0,
        totalAllocated: 0,
        totalConsumed: 0,
        source: operation.source,
      });
    }

    balance.balance += operation.amount;
    balance.totalAllocated += operation.amount;

    if (operation.source === CreditSource.INSTITUTION_POOL) {
      balance.monthlyLimit = Math.max(balance.monthlyLimit, balance.totalAllocated);
    }

    await this.creditBalanceRepo.save(balance);

    this.logger.log(
      `Allocated ${operation.amount} ${operation.type} to ${operation.userId || operation.institutionId} (new balance: ${balance.balance})`,
    );

    return balance;
  }

  async consumeCredits(
    userId: string,
    type: CreditType,
    amount: number,
  ): Promise<{ success: boolean; balance: CreditBalance | null; reason?: string }> {
    const balance = await this.getBalance(userId, type);

    if (!balance) {
      return { success: false, balance: null, reason: 'No credit balance found' };
    }

    if (balance.balance < amount) {
      return {
        success: false,
        balance,
        reason: `Insufficient credits: ${balance.balance} available, ${amount} required`,
      };
    }

    balance.balance -= amount;
    balance.totalConsumed += amount;
    balance.consumedToday += amount;

    await this.creditBalanceRepo.save(balance);

    return { success: true, balance };
  }

  async consumeInstitutionCredits(
    institutionId: string,
    type: CreditType,
    amount: number,
  ): Promise<{ success: boolean; balance: CreditBalance | null; reason?: string }> {
    const balance = await this.getInstitutionBalance(institutionId, type);

    if (!balance) {
      return { success: false, balance: null, reason: 'No institution credit balance found' };
    }

    if (balance.balance < amount) {
      return {
        success: false,
        balance,
        reason: `Insufficient institution credits: ${balance.balance} available, ${amount} required`,
      };
    }

    balance.balance -= amount;
    balance.totalConsumed += amount;
    balance.consumedToday += amount;

    await this.creditBalanceRepo.save(balance);

    return { success: true, balance };
  }

  async initializeTierCredits(userId: string, tier: GovernanceTier, institutionId?: string): Promise<void> {
    const creditMappings: Record<GovernanceTier, { type: CreditType; amount: number }[]> = {
      [GovernanceTier.FREE]: [
        { type: CreditType.AI_CREDITS, amount: 15 },
        { type: CreditType.OCR_PAGES, amount: 3 },
      ],
      [GovernanceTier.STANDARD]: [
        { type: CreditType.AI_CREDITS, amount: 100 },
        { type: CreditType.OCR_PAGES, amount: 20 },
      ],
      [GovernanceTier.TUTOR]: [
        { type: CreditType.AI_CREDITS, amount: 500 },
        { type: CreditType.OCR_PAGES, amount: 100 },
        { type: CreditType.LIVE_CLASS_HOURS, amount: 10 },
      ],
      [GovernanceTier.SCHOOL]: [
        { type: CreditType.AI_CREDITS, amount: 5000 },
        { type: CreditType.OCR_PAGES, amount: 2000 },
        { type: CreditType.LIVE_CLASS_HOURS, amount: 200 },
      ],
      [GovernanceTier.ENTERPRISE]: [
        { type: CreditType.AI_CREDITS, amount: 50000 },
        { type: CreditType.OCR_PAGES, amount: 10000 },
        { type: CreditType.LIVE_CLASS_HOURS, amount: 1000 },
      ],
    };

    const credits = creditMappings[tier];
    for (const credit of credits) {
      await this.allocateCredits({
        userId: institutionId ? undefined : userId,
        institutionId,
        type: credit.type,
        amount: credit.amount,
        source: CreditSource.FREE_ALLOCATION,
      });
    }
  }

  async resetDailyConsumed(): Promise<void> {
    const today = new Date().toISOString().split('T')[0];
    await this.creditBalanceRepo
      .createQueryBuilder()
      .update(CreditBalance)
      .set({ consumedToday: 0, lastResetDate: new Date(today) })
      .where('lastResetDate < :today', { today })
      .execute();

    this.logger.log('Reset daily consumed counters');
  }

  async getAllBalances(userId: string): Promise<CreditBalance[]> {
    return this.creditBalanceRepo.find({
      where: { userId },
      order: { type: 'ASC' },
    });
  }

  async getAllInstitutionBalances(institutionId: string): Promise<CreditBalance[]> {
    return this.creditBalanceRepo.find({
      where: { institutionId },
      order: { type: 'ASC' },
    });
  }
}
