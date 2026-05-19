import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialService } from './financial.service';
import { FinancialController } from './financial.controller';
import { Wallet, Transaction, WithdrawalRequest } from './entities/financial.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, Transaction, WithdrawalRequest])],
  controllers: [FinancialController],
  providers: [FinancialService],
  exports: [FinancialService],
})
export class FinancialModule {}
