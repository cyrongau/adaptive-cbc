import { Controller, Get, Post, Param, Query, UseGuards, Request, Body } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get user dashboard data' })
  async getDashboard(@Request() req) {
    return this.analyticsService.getDashboardData(req.user.id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get overall user statistics' })
  async getStats(@Request() req) {
    return this.analyticsService.getUserStats(req.user.id);
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get user performance metrics' })
  @ApiQuery({ name: 'subjectId', required: false })
  async getPerformance(@Request() req, @Query('subjectId') subjectId?: string) {
    return this.analyticsService.getUserPerformance(req.user.id, subjectId);
  }

  @Get('subject/:subjectId')
  @ApiOperation({ summary: 'Get performance for specific subject' })
  async getSubjectPerformance(
    @Request() req,
    @Param('subjectId') subjectId: string,
  ) {
    return this.analyticsService.getSubjectPerformance(req.user.id, subjectId);
  }

  @Get('weak-areas')
  @ApiOperation({ summary: 'Get areas needing improvement' })
  async getWeakAreas(@Request() req) {
    return this.analyticsService.getWeakAreas(req.user.id);
  }

  @Get('insights')
  @ApiOperation({ summary: 'Get learning insights' })
  async getInsights(@Request() req) {
    return this.analyticsService.getLearningInsights(req.user.id);
  }

  @Post('insights/:id/read')
  @ApiOperation({ summary: 'Mark insight as read' })
  async markInsightRead(@Param('id') id: string) {
    return this.analyticsService.markInsightRead(id);
  }

  @Get('parent/reports')
  @ApiOperation({ summary: 'Get parent reports' })
  async getParentReports(@Request() req) {
    return this.analyticsService.getParentReports(req.user.id);
  }

  @Post('parent/report/generate')
  @ApiOperation({ summary: 'Generate new parent report' })
  async generateParentReport(@Request() req, @Body() data: { childId: string }) {
    return this.analyticsService.generateParentReport(req.user.id, data.childId);
  }

  @Get('admin/platform-stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Get platform-wide statistics (admin only)' })
  async getPlatformStats() {
    return this.analyticsService.getPlatformStats();
  }

  @Get('admin/subject-popularity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Get subject popularity metrics (admin only)' })
  async getSubjectPopularity() {
    return this.analyticsService.getSubjectPopularity();
  }

  @Get('admin/recent-activity')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Get recent platform activity (admin only)' })
  async getRecentActivity() {
    return this.analyticsService.getRecentActivity();
  }
}