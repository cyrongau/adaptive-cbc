import {
  IsString, IsOptional, IsNumber, IsEnum, IsObject, Min, ValidateNested, IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { TransactionType, TransactionStatus, WithdrawalMethod, WithdrawalStatus } from '../entities/financial.entity';

export class UpdateWalletDetailsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  mpesaDetails?: {
    phoneNumber: string;
    accountName: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  bankDetails?: {
    bankName: string;
    branchName: string;
    accountNumber: string;
    accountName: string;
    swiftCode: string;
  };
}

export class CreateWithdrawalDto {
  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(1000)
  amount: number;

  @ApiProperty({ enum: WithdrawalMethod })
  @IsEnum(WithdrawalMethod)
  method: WithdrawalMethod;

  @ApiPropertyOptional({ example: 'Withdraw to M-Pesa' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ProcessWithdrawalDto {
  @ApiProperty({ enum: WithdrawalStatus })
  @IsEnum(WithdrawalStatus)
  status: WithdrawalStatus;

  @ApiPropertyOptional({ example: 'Payment sent via M-Pesa B2C' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Insufficient float balance' })
  @IsOptional()
  @IsString()
  rejectionReason?: string;

  @ApiPropertyOptional({ example: 'QJK7XXXXXX' })
  @IsOptional()
  @IsString()
  reference?: string;
}

export class AdjustBalanceDto {
  @ApiProperty({ example: 500 })
  @IsNumber()
  amount: number;

  @ApiProperty({ example: 'Manual correction for failed payout' })
  @IsString()
  reason: string;
}

export class RecordSaleDto {
  @ApiProperty({ example: 'seller-user-uuid' })
  @IsString()
  sellerId: string;

  @ApiProperty({ example: 499.99 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ example: 'order-uuid' })
  @IsString()
  orderId: string;

  @ApiProperty({ example: 'Grade 4 Mathematics Textbook' })
  @IsString()
  productTitle: string;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  commissionRate?: number;
}

export class GetTransactionsFilterDto {
  @ApiPropertyOptional({ enum: TransactionType })
  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;

  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

export class GetWithdrawalsFilterDto {
  @ApiPropertyOptional({ enum: WithdrawalStatus })
  @IsOptional()
  @IsEnum(WithdrawalStatus)
  status?: WithdrawalStatus;

  @ApiPropertyOptional({ enum: WithdrawalMethod })
  @IsOptional()
  @IsEnum(WithdrawalMethod)
  method?: WithdrawalMethod;

  @ApiPropertyOptional({ example: '2024-01-01' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2024-12-31' })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'user-uuid' })
  @IsOptional()
  @IsString()
  userId?: string;
}
