import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { KycService } from './kyc.service';
import { SubmitKycDto, ReviewKycDto } from './dto/kyc.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('kyc')
@Controller('kyc')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class KycController {
  constructor(private readonly kycService: KycService) {}

  @Post('submit')
  @ApiOperation({ summary: 'Submit KYC application (teacher/tutor)' })
  async submit(@Request() req, @Body() dto: SubmitKycDto) {
    return this.kycService.submit(req.user.id, dto);
  }

  @Get('my-applications')
  @ApiOperation({ summary: 'Get my KYC applications' })
  async getMyApplications(@Request() req) {
    return this.kycService.findByUser(req.user.id);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Get all KYC applications (admin)' })
  async getAllApplications(@Query('status') status?: string) {
    return this.kycService.findAll(status);
  }

  @Get('stats')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Get KYC statistics (admin)' })
  async getStats() {
    return this.kycService.getStats();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Get KYC application details (admin)' })
  async getApplication(@Param('id') id: string) {
    return this.kycService.findOne(id);
  }

  @Patch(':id/review')
  @UseGuards(RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Review KYC application (admin)' })
  async review(@Request() req, @Param('id') id: string, @Body() dto: ReviewKycDto) {
    return this.kycService.review(id, req.user.id, dto);
  }
}