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

  @Get('admin/content-metrics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Content creation metrics (questions per teacher/subject/week)' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'year'] })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'grade', required: false })
  async getContentMetrics(
    @Query('period') period?: 'week' | 'month' | 'year',
    @Query('subjectId') subjectId?: string,
    @Query('grade') grade?: number,
  ) {
    return this.analyticsService.getContentCreationMetrics({ period, subjectId, grade });
  }

  @Get('admin/curriculum-coverage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Curriculum coverage heatmap showing strand/sub-strand gaps' })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'grade', required: false })
  async getCurriculumCoverage(
    @Query('subjectId') subjectId?: string,
    @Query('grade') grade?: number,
  ) {
    return this.analyticsService.getCurriculumCoverage({ subjectId, grade });
  }

  @Get('admin/quality-distribution')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'Question quality distribution (difficulty, Bloom\'s taxonomy, types)' })
  @ApiQuery({ name: 'subjectId', required: false })
  @ApiQuery({ name: 'grade', required: false })
  async getQualityDistribution(
    @Query('subjectId') subjectId?: string,
    @Query('grade') grade?: number,
  ) {
    return this.analyticsService.getQualityDistribution({ subjectId, grade });
  }

  @Get('admin/ai-usage')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiOperation({ summary: 'AI usage analytics (calls by type, daily trend, top users)' })
  @ApiQuery({ name: 'period', required: false, enum: ['week', 'month', 'year'] })
  async getAiUsage(
    @Query('period') period?: 'week' | 'month' | 'year',
  ) {
    return this.analyticsService.getAiUsageAnalytics({ period });
  }
}