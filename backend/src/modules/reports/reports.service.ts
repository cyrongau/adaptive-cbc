import { Injectable } from '@nestjs/common';
import { AnalyticsService } from '../analytics/analytics.service';

@Injectable()
export class ReportsService {
  constructor(private readonly analyticsService: AnalyticsService) {}

  async getEnrollmentReport(institutionId?: string) {
    const stats = await this.analyticsService.getPlatformStats(institutionId);
    return {
      title: 'Enrollment Report',
      generatedAt: new Date(),
      summary: {
        totalStudents: stats.students,
        totalTeachers: stats.teachers,
        totalTutors: stats.tutors,
        totalParents: stats.parents,
        totalUsers: stats.totalUsers,
        activeUsers: stats.activeUsers,
      },
      monthlyGrowth: stats.monthlyGrowth || [],
      byGrade: stats.usersByGrade || [],
      recentEnrollments: stats.recentUsers || [],
    };
  }

  async getPerformanceReport(institutionId?: string) {
    const stats = await this.analyticsService.getPlatformStats(institutionId);
    const subjectPopularity = await this.analyticsService.getSubjectPopularity(institutionId);
    const contentMetrics = await this.analyticsService.getContentCreationMetrics({ institutionId });

    return {
      title: 'Student Performance Summary',
      generatedAt: new Date(),
      metrics: {
        averageScore: stats.averageScore,
        totalSessions: stats.totalSessions,
        totalQuestionsAttempted: stats.totalQuestionsAttempted,
        totalQuestionsInBank: contentMetrics.totalQuestions || 0,
        questionsByStatus: contentMetrics.byStatus || {},
      },
      subjectPerformance: subjectPopularity.map((sp) => ({
        subject: sp.subject,
        sessionsCount: parseInt(sp.count || '0', 10),
        successRate: parseFloat(sp.avgSuccessRate || '0'),
      })),
      contentTrend: contentMetrics.trend || [],
    };
  }

  async getActivityReport(institutionId?: string) {
    const activities = await this.analyticsService.getRecentActivity(institutionId);
    return {
      title: 'Platform Activity Log',
      generatedAt: new Date(),
      totalActivities: activities.length,
      activities: activities.map((act) => ({
        type: act.type,
        title: act.title,
        description: act.description,
        timestamp: act.timestamp,
      })),
    };
  }

  async getUsageReport(institutionId?: string) {
    const aiUsage = await this.analyticsService.getAiUsageAnalytics({ period: 'month', institutionId });
    const stats = await this.analyticsService.getPlatformStats(institutionId);

    return {
      title: 'Platform Usage Statistics',
      generatedAt: new Date(),
      aiUsage: {
        totalCalls: aiUsage.totalCalls || 0,
        dailyTrend: aiUsage.dailyTrend || [],
        topUsers: aiUsage.topUsers || [],
      },
      systemUsage: {
        totalSessions: stats.totalSessions,
        totalQuestionsAttempted: stats.totalQuestionsAttempted,
        activeUsersCount: stats.activeUsers,
      },
    };
  }
}
