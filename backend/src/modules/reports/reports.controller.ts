import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
@ApiBearerAuth('JWT-auth')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('enrollment')
  @ApiOperation({ summary: 'Get enrollment growth and demographic reports' })
  async getEnrollmentReport(@Request() req) {
    const institutionId = req.user.role === UserRole.INSTITUTION_ADMIN ? req.user.institutionId : undefined;
    return this.reportsService.getEnrollmentReport(institutionId);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get academic/practice performance summary report' })
  async getPerformanceReport(@Request() req) {
    const institutionId = req.user.role === UserRole.INSTITUTION_ADMIN ? req.user.institutionId : undefined;
    return this.reportsService.getPerformanceReport(institutionId);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Get platform user activity logs' })
  async getActivityReport(@Request() req) {
    const institutionId = req.user.role === UserRole.INSTITUTION_ADMIN ? req.user.institutionId : undefined;
    return this.reportsService.getActivityReport(institutionId);
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get system usage and AI logs report' })
  async getUsageReport(@Request() req) {
    const institutionId = req.user.role === UserRole.INSTITUTION_ADMIN ? req.user.institutionId : undefined;
    return this.reportsService.getUsageReport(institutionId);
  }
}
