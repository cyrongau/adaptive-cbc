import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards, Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { FinancialService } from './financial.service';
import {
  UpdateWalletDetailsDto, CreateWithdrawalDto, ProcessWithdrawalDto, AdjustBalanceDto, RecordSaleDto,
  GetTransactionsFilterDto, GetWithdrawalsFilterDto,
} from './dto/financial.dto';

@ApiTags('financial')
@Controller('financial')
@ApiBearerAuth('JWT-auth')
export class FinancialController {
  constructor(private readonly financialService: FinancialService) {}

  @Get('wallet')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user wallet' })
  async getWallet(@Request() req) {
    return this.financialService.getOrCreateWallet(req.user.id);
  }

  @Put('wallet/details')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update wallet payout details' })
  async updateWalletDetails(@Body() dto: UpdateWalletDetailsDto, @Request() req) {
    return this.financialService.updateWalletDetails(req.user.id, dto);
  }

  @Get('transactions')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user transactions' })
  async getTransactions(@Request() req, @Query() filters: GetTransactionsFilterDto) {
    return this.financialService.getUserTransactions(req.user.id, filters);
  }

  @Get('withdrawals')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get user withdrawal requests' })
  async getWithdrawals(@Request() req, @Query() filters: GetWithdrawalsFilterDto) {
    return this.financialService.getUserWithdrawals(req.user.id, filters);
  }

  @Post('withdrawals')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create withdrawal request' })
  async createWithdrawal(@Body() dto: CreateWithdrawalDto, @Request() req) {
    return this.financialService.createWithdrawal(req.user.id, dto);
  }

  @Get('withdrawals/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get withdrawal by ID' })
  async getWithdrawal(@Param('id') id: string, @Request() req) {
    return this.financialService.getWithdrawalById(id, req.user.id, req.user.role);
  }

  @Get('admin/stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Get financial statistics (admin)' })
  async getFinancialStats() {
    return this.financialService.getFinancialStats();
  }

  @Get('admin/withdrawals')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Get all withdrawal requests (admin)' })
  async getAllWithdrawals(@Query() filters: GetWithdrawalsFilterDto) {
    return this.financialService.getAllWithdrawals(filters);
  }

  @Put('admin/withdrawals/:id/process')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Process withdrawal request (admin)' })
  async processWithdrawal(@Param('id') id: string, @Body() dto: ProcessWithdrawalDto, @Request() req) {
    return this.financialService.processWithdrawal(id, dto, req.user.id, req.user.role);
  }

  @Get('admin/wallets')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all wallets (super admin)' })
  async getAllWallets() {
    return this.financialService.getAllWallets();
  }

  @Put('admin/wallets/:userId/adjust')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Adjust user wallet balance (super admin)' })
  async adjustBalance(@Param('userId') userId: string, @Body() dto: AdjustBalanceDto, @Request() req) {
    return this.financialService.adjustBalance(userId, dto, req.user.id, req.user.role);
  }

  @Post('internal/record-sale')
  @ApiOperation({ summary: 'Record a sale (internal use)' })
  async recordSale(@Body() dto: RecordSaleDto) {
    return this.financialService.recordSale(dto);
  }
}
