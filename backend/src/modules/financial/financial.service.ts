import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Wallet, Transaction, WithdrawalRequest, TransactionType, TransactionStatus, WithdrawalStatus, WithdrawalMethod } from './entities/financial.entity';
import {
  UpdateWalletDetailsDto, CreateWithdrawalDto, ProcessWithdrawalDto, AdjustBalanceDto, RecordSaleDto,
  GetTransactionsFilterDto, GetWithdrawalsFilterDto,
} from './dto/financial.dto';
import { UserRole } from '../users/entities/user.entity';

const DEFAULT_COMMISSION_RATE = 0.20;
const MIN_WITHDRAWAL_AMOUNT = 1000;
const WITHDRAWAL_FEE_PERCENT = 0.01;

@Injectable()
export class FinancialService {
  constructor(
    @InjectRepository(Wallet)
    private walletRepo: Repository<Wallet>,
    @InjectRepository(Transaction)
    private transactionRepo: Repository<Transaction>,
    @InjectRepository(WithdrawalRequest)
    private withdrawalRepo: Repository<WithdrawalRequest>,
  ) {}

  async getOrCreateWallet(userId: string): Promise<Wallet> {
    let wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) {
      wallet = this.walletRepo.create({ userId });
      wallet = await this.walletRepo.save(wallet);
    }
    return wallet;
  }

  async getWallet(userId: string): Promise<Wallet> {
    const wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async updateWalletDetails(userId: string, dto: UpdateWalletDetailsDto): Promise<Wallet> {
    const wallet = await this.getWallet(userId);
    if (dto.mpesaDetails) wallet.mpesaDetails = dto.mpesaDetails;
    if (dto.bankDetails) wallet.bankDetails = dto.bankDetails;
    return this.walletRepo.save(wallet);
  }

  async recordSale(dto: RecordSaleDto): Promise<{ sellerTransaction: Transaction; commissionTransaction: Transaction }> {
    const commissionRate = dto.commissionRate ?? DEFAULT_COMMISSION_RATE;
    const commissionAmount = dto.amount * commissionRate;
    const sellerAmount = dto.amount - commissionAmount;

    const sellerWallet = await this.getOrCreateWallet(dto.sellerId);

    const sellerTransaction = this.transactionRepo.create({
      walletId: sellerWallet.id,
      userId: dto.sellerId,
      type: TransactionType.SALE_EARNING,
      status: TransactionStatus.COMPLETED,
      amount: sellerAmount,
      platformCommission: commissionAmount,
      balanceAfter: Number(sellerWallet.availableBalance) + sellerAmount,
      referenceId: dto.orderId,
      orderId: dto.orderId,
      description: `Sale: ${dto.productTitle}`,
      metadata: { productTitle: dto.productTitle, grossAmount: dto.amount, commissionRate },
    });

    const platformTransaction = this.transactionRepo.create({
      walletId: sellerWallet.id,
      userId: dto.sellerId,
      type: TransactionType.PLATFORM_COMMISSION,
      status: TransactionStatus.COMPLETED,
      amount: -commissionAmount,
      platformCommission: commissionAmount,
      balanceAfter: Number(sellerTransaction.balanceAfter),
      referenceId: dto.orderId,
      orderId: dto.orderId,
      description: `Platform commission (${(commissionRate * 100).toFixed(0)}%) for: ${dto.productTitle}`,
      metadata: { productTitle: dto.productTitle, grossAmount: dto.amount, commissionRate },
    });

    sellerWallet.availableBalance += sellerAmount;
    sellerWallet.totalEarnings += sellerAmount;

    await this.walletRepo.save(sellerWallet);
    await this.transactionRepo.save(sellerTransaction);
    await this.transactionRepo.save(platformTransaction);

    return { sellerTransaction, commissionTransaction: platformTransaction };
  }

  async createWithdrawal(userId: string, dto: CreateWithdrawalDto): Promise<WithdrawalRequest> {
    const wallet = await this.getWallet(userId);

    if (dto.amount < MIN_WITHDRAWAL_AMOUNT) {
      throw new BadRequestException(`Minimum withdrawal amount is KES ${MIN_WITHDRAWAL_AMOUNT}`);
    }

    if (dto.amount > Number(wallet.availableBalance)) {
      throw new BadRequestException('Insufficient available balance');
    }

    let payoutDetails: Record<string, any> = {};
    if (dto.method === WithdrawalMethod.M_PESA) {
      if (!wallet.mpesaDetails?.phoneNumber) {
        throw new BadRequestException('Please set your M-Pesa details in your wallet first');
      }
      payoutDetails = { phoneNumber: wallet.mpesaDetails.phoneNumber, accountName: wallet.mpesaDetails.accountName };
    } else {
      if (!wallet.bankDetails?.accountNumber) {
        throw new BadRequestException('Please set your bank details in your wallet first');
      }
      payoutDetails = { ...wallet.bankDetails };
    }

    const fee = dto.amount * WITHDRAWAL_FEE_PERCENT;
    const netAmount = dto.amount - fee;

    const withdrawal = this.withdrawalRepo.create({
      userId,
      walletId: wallet.id,
      amount: dto.amount,
      fee,
      netAmount,
      method: dto.method,
      payoutDetails,
      notes: dto.notes,
    });

    const savedWithdrawal = await this.withdrawalRepo.save(withdrawal);

    wallet.availableBalance -= dto.amount;
    wallet.pendingBalance += dto.amount;
    await this.walletRepo.save(wallet);

    const transaction = this.transactionRepo.create({
      walletId: wallet.id,
      userId,
      type: TransactionType.WITHDRAWAL,
      status: TransactionStatus.PENDING,
      amount: -dto.amount,
      balanceAfter: Number(wallet.availableBalance),
      referenceId: savedWithdrawal.id,
      withdrawalId: savedWithdrawal.id,
      description: `Withdrawal request via ${dto.method.replace('_', '-')}`,
    });
    await this.transactionRepo.save(transaction);

    return this.withdrawalRepo.findOne({ where: { id: savedWithdrawal.id }, relations: ['wallet'] });
  }

  async processWithdrawal(withdrawalId: string, dto: ProcessWithdrawalDto, adminId: string, adminRole: string): Promise<WithdrawalRequest> {
    if (adminRole !== UserRole.SUPER_ADMIN && adminRole !== UserRole.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Only admins can process withdrawals');
    }

    const withdrawal = await this.withdrawalRepo.findOne({
      where: { id: withdrawalId },
      relations: ['wallet', 'user'],
    });
    if (!withdrawal) throw new NotFoundException('Withdrawal request not found');

    if (withdrawal.status !== WithdrawalStatus.PENDING && withdrawal.status !== WithdrawalStatus.PROCESSING) {
      throw new BadRequestException('Withdrawal cannot be processed in its current state');
    }

    withdrawal.status = dto.status;
    withdrawal.processedBy = adminId;
    withdrawal.processedAt = new Date();
    withdrawal.notes = dto.notes || withdrawal.notes;
    withdrawal.rejectionReason = dto.rejectionReason;
    withdrawal.reference = dto.reference;

    const wallet = withdrawal.wallet;

    if (dto.status === WithdrawalStatus.COMPLETED) {
      wallet.pendingBalance -= withdrawal.amount;
      wallet.totalWithdrawn += withdrawal.amount;

      const transaction = await this.transactionRepo.findOne({
        where: { withdrawalId: withdrawal.id, type: TransactionType.WITHDRAWAL },
      });
      if (transaction) {
        transaction.status = TransactionStatus.COMPLETED;
        await this.transactionRepo.save(transaction);
      }
    } else if (dto.status === WithdrawalStatus.REJECTED || dto.status === WithdrawalStatus.FAILED) {
      wallet.pendingBalance -= withdrawal.amount;
      wallet.availableBalance += withdrawal.amount;

      const transaction = await this.transactionRepo.findOne({
        where: { withdrawalId: withdrawal.id, type: TransactionType.WITHDRAWAL },
      });
      if (transaction) {
        transaction.status = TransactionStatus.REVERSED;
        await this.transactionRepo.save(transaction);
      }
    }

    await this.walletRepo.save(wallet);
    return this.withdrawalRepo.save(withdrawal);
  }

  async getUserTransactions(userId: string, filters?: GetTransactionsFilterDto): Promise<Transaction[]> {
    const where: any = { userId };

    if (filters?.type) where.type = filters.type;
    if (filters?.status) where.status = filters.status;
    if (filters?.startDate && filters?.endDate) {
      where.createdAt = Between(new Date(filters.startDate), new Date(filters.endDate));
    }

    return this.transactionRepo.find({ where, order: { createdAt: 'DESC' }, relations: ['wallet'] });
  }

  async getUserWithdrawals(userId: string, filters?: GetWithdrawalsFilterDto): Promise<WithdrawalRequest[]> {
    const where: any = { userId };

    if (filters?.status) where.status = filters.status;
    if (filters?.method) where.method = filters.method;
    if (filters?.startDate && filters?.endDate) {
      where.createdAt = Between(new Date(filters.startDate), new Date(filters.endDate));
    }

    return this.withdrawalRepo.find({ where, order: { createdAt: 'DESC' }, relations: ['wallet'] });
  }

  async getAllWithdrawals(filters?: GetWithdrawalsFilterDto): Promise<WithdrawalRequest[]> {
    const where: any = {};

    if (filters?.userId) where.userId = filters.userId;
    if (filters?.status) where.status = filters.status;
    if (filters?.method) where.method = filters.method;
    if (filters?.startDate && filters?.endDate) {
      where.createdAt = Between(new Date(filters.startDate), new Date(filters.endDate));
    }

    return this.withdrawalRepo.find({
      where,
      order: { createdAt: 'DESC' },
      relations: ['wallet', 'user', 'processor'],
    });
  }

  async getWithdrawalById(id: string, userId: string, userRole: string): Promise<WithdrawalRequest> {
    const withdrawal = await this.withdrawalRepo.findOne({
      where: { id },
      relations: ['wallet', 'user', 'processor'],
    });
    if (!withdrawal) throw new NotFoundException('Withdrawal request not found');
    if (withdrawal.userId !== userId && userRole !== UserRole.SUPER_ADMIN && userRole !== UserRole.INSTITUTION_ADMIN) {
      throw new ForbiddenException('Access denied');
    }
    return withdrawal;
  }

  async adjustBalance(userId: string, dto: AdjustBalanceDto, adminId: string, adminRole: string): Promise<Wallet> {
    if (adminRole !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only super admins can adjust balances');
    }

    const wallet = await this.getWallet(userId);
    wallet.availableBalance += dto.amount;
    if (dto.amount > 0) {
      wallet.totalEarnings += dto.amount;
    }

    const transaction = this.transactionRepo.create({
      walletId: wallet.id,
      userId,
      type: TransactionType.ADJUSTMENT,
      status: TransactionStatus.COMPLETED,
      amount: dto.amount,
      balanceAfter: Number(wallet.availableBalance),
      description: dto.reason,
      metadata: { adjustedBy: adminId },
    });

    await this.walletRepo.save(wallet);
    await this.transactionRepo.save(transaction);

    return wallet;
  }

  async getFinancialStats(): Promise<any> {
    const wallets = await this.walletRepo.find();
    const transactions = await this.transactionRepo.find();
    const withdrawals = await this.withdrawalRepo.find();

    const totalPlatformCommission = transactions
      .filter((t) => t.type === TransactionType.PLATFORM_COMMISSION)
      .reduce((sum, t) => sum + Math.abs(Number(t.amount)), 0);

    const totalEarnings = wallets.reduce((sum, w) => sum + Number(w.totalEarnings), 0);
    const totalWithdrawn = wallets.reduce((sum, w) => sum + Number(w.totalWithdrawn), 0);
    const totalPending = wallets.reduce((sum, w) => sum + Number(w.pendingBalance), 0);
    const totalAvailable = wallets.reduce((sum, w) => sum + Number(w.availableBalance), 0);

    const pendingWithdrawals = withdrawals.filter((w) => w.status === WithdrawalStatus.PENDING);
    const completedWithdrawals = withdrawals.filter((w) => w.status === WithdrawalStatus.COMPLETED);

    const withdrawalByMethod = {
      m_pesa: withdrawals.filter((w) => w.method === WithdrawalMethod.M_PESA).length,
      bank_transfer: withdrawals.filter((w) => w.method === WithdrawalMethod.BANK_TRANSFER).length,
    };

    const monthlyRevenue: Record<string, number> = {};
    transactions
      .filter((t) => t.type === TransactionType.PLATFORM_COMMISSION && t.status === TransactionStatus.COMPLETED)
      .forEach((t) => {
        const month = new Date(t.createdAt).toISOString().slice(0, 7);
        monthlyRevenue[month] = (monthlyRevenue[month] || 0) + Math.abs(Number(t.amount));
      });

    return {
      totalPlatformCommission,
      totalEarnings,
      totalWithdrawn,
      totalPending,
      totalAvailable,
      totalWallets: wallets.length,
      totalTransactions: transactions.length,
      pendingWithdrawalsCount: pendingWithdrawals.length,
      pendingWithdrawalsAmount: pendingWithdrawals.reduce((sum, w) => sum + Number(w.amount), 0),
      completedWithdrawalsCount: completedWithdrawals.length,
      withdrawalByMethod,
      monthlyRevenue,
    };
  }

  async getAllWallets(): Promise<Wallet[]> {
    return this.walletRepo.find({
      relations: ['user'],
      order: { totalEarnings: 'DESC' },
    });
  }
}
