import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PerformanceMetric, RevisionSession, LearningInsight, ParentReport } from './entities/analytics.entity';
import { User, UserRole } from '../users/entities/user.entity';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(PerformanceMetric)
    private metricsRepository: Repository<PerformanceMetric>,
    @InjectRepository(RevisionSession)
    private sessionRepository: Repository<RevisionSession>,
    @InjectRepository(LearningInsight)
    private insightRepository: Repository<LearningInsight>,
    @InjectRepository(ParentReport)
    private reportRepository: Repository<ParentReport>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async getUserPerformance(userId: string, subjectId?: string): Promise<PerformanceMetric> {
    const query = this.metricsRepository.createQueryBuilder('metric')
      .where('metric.userId = :userId', { userId });

    if (subjectId) {
      query.andWhere('metric.subjectId = :subjectId', { subjectId });
    }

    const metric = await query.getOne();

    if (!metric) {
      return this.metricsRepository.create({
        userId,
        subjectId,
        totalAttempts: 0,
        correctAttempts: 0,
        successRate: 0,
        averageTimeSeconds: 0,
      });
    }

    return metric;
  }

  async getUserStats(userId: string): Promise<any> {
    const sessions = await this.sessionRepository.find({
      where: { userId },
    });

    const totalSessions = sessions.length;
    const totalQuestions = sessions.reduce((sum, s) => sum + s.questionsAttempted, 0);
    const totalCorrect = sessions.reduce((sum, s) => sum + s.correctAnswers, 0);
    const totalTime = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const averageScore = totalSessions > 0
      ? sessions.reduce((sum, s) => sum + (s.score || 0), 0) / totalSessions
      : 0;

    return {
      totalSessions,
      totalQuestions,
      totalCorrect,
      totalTimeMinutes: totalTime,
      averageScore: Math.round(averageScore * 100) / 100,
      successRate: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 10000) / 100 : 0,
    };
  }

  async getSubjectPerformance(userId: string, subjectId: string): Promise<any> {
    const metrics = await this.metricsRepository.find({
      where: { userId, subjectId },
    });

    const sessions = await this.sessionRepository.find({
      where: { userId, subjectId },
    });

    return {
      metrics: metrics[0] || null,
      recentSessions: sessions.slice(-5),
      totalAttempts: metrics.reduce((sum, m) => sum + m.totalAttempts, 0),
      successRate: metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.successRate, 0) / metrics.length
        : 0,
    };
  }

  async getWeakAreas(userId: string): Promise<any[]> {
    const metrics = await this.metricsRepository.find({
      where: { userId },
    });

    return metrics
      .filter((m) => m.successRate < 70)
      .sort((a, b) => a.successRate - b.successRate)
      .map((m) => ({
        subjectId: m.subjectId,
        topicId: m.topicId,
        successRate: m.successRate,
        totalAttempts: m.totalAttempts,
      }));
  }

  async recordSession(sessionData: Partial<RevisionSession>): Promise<RevisionSession> {
    const session = this.sessionRepository.create(sessionData);
    return this.sessionRepository.save(session);
  }

  async getLearningInsights(userId: string): Promise<LearningInsight[]> {
    return this.insightRepository.find({
      where: { userId, isRead: false },
      order: { createdAt: 'DESC' },
    });
  }

  async generateInsight(userId: string, insightData: Partial<LearningInsight>): Promise<LearningInsight> {
    const insight = this.insightRepository.create({
      userId,
      ...insightData,
    });
    return this.insightRepository.save(insight);
  }

  async markInsightRead(insightId: string): Promise<LearningInsight> {
    const insight = await this.insightRepository.findOne({ where: { id: insightId } });
    if (!insight) {
      throw new NotFoundException('Insight not found');
    }
    insight.isRead = true;
    return this.insightRepository.save(insight);
  }

  async generateParentReport(parentId: string, childId: string): Promise<ParentReport> {
    const sessions = await this.sessionRepository.find({
      where: { userId: childId },
      order: { createdAt: 'DESC' },
    });

    const subjectPerformance: any[] = [];
    const subjectMap = new Map<string, { total: number; correct: number }>();

    sessions.forEach((session) => {
      if (!session.subjectId) return;
      const existing = subjectMap.get(session.subjectId) || { total: 0, correct: 0 };
      existing.total += session.questionsAttempted;
      existing.correct += session.correctAnswers;
      subjectMap.set(session.subjectId, existing);
    });

    subjectMap.forEach((value, key) => {
      subjectPerformance.push({
        subjectId: key,
        subjectName: key,
        score: Math.round((value.correct / value.total) * 100),
        trend: 'stable',
      });
    });

    const strongAreas = subjectPerformance
      .filter((s) => s.score >= 70)
      .map((s) => s.subjectName);

    const areasForImprovement = subjectPerformance
      .filter((s) => s.score < 50)
      .map((s) => s.subjectName);

    const totalTimeSpent = sessions.reduce((sum, s) => sum + s.durationMinutes, 0);
    const overallProgress = sessions.length > 0
      ? Math.round(sessions.reduce((sum, s) => sum + (s.score || 0), 0) / sessions.length)
      : 0;

    const report = this.reportRepository.create({
      parentId,
      childId,
      periodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(),
      summary: {
        overallProgress,
        strongAreas,
        areasForImprovement,
        totalTimeSpent,
        sessionsCompleted: sessions.length,
      },
      subjectPerformance,
      recentActivity: sessions.slice(-10).map((s) => ({
        date: s.createdAt.toISOString(),
        activity: `${s.sessionType} session`,
        score: s.score || 0,
      })),
      recommendations: [
        {
          title: 'Continue Practice',
          description: 'Regular practice is key to improvement',
          priority: 'high',
        },
        ...(areasForImprovement.length > 0 ? [{
          title: 'Focus on Weak Areas',
          description: `Work on improving: ${areasForImprovement.join(', ')}`,
          priority: 'medium',
        }] : []),
      ],
    });

    return this.reportRepository.save(report);
  }

  async getParentReports(parentId: string): Promise<ParentReport[]> {
    return this.reportRepository.find({
      where: { parentId },
      order: { createdAt: 'DESC' },
    });
  }

  async getDashboardData(userId: string): Promise<any> {
    const stats = await this.getUserStats(userId);
    const weakAreas = await this.getWeakAreas(userId);
    const insights = await this.getLearningInsights(userId);

    return {
      stats,
      weakAreas: weakAreas.slice(0, 5),
      recentInsights: insights.slice(0, 3),
      streak: 0,
    };
  }

  async getPlatformStats(): Promise<any> {
    try {
      const totalUsers = await this.usersRepository.count();
      const students = await this.usersRepository.count({ where: { role: UserRole.STUDENT } });
      const teachers = await this.usersRepository.count({ where: { role: UserRole.TEACHER } });
      const tutors = await this.usersRepository.count({ where: { role: UserRole.TUTOR } });
      const parents = await this.usersRepository.count({ where: { role: UserRole.PARENT } });
      const activeUsers = await this.usersRepository.count({ where: { isActive: true } });
      const legacyStudents = await this.usersRepository.count({
        where: { role: UserRole.STUDENT, grade: null },
      });

      let totalSessions = 0;
      let totalQuestions = 0;
      let avgScore = 0;

      try {
        totalSessions = await this.sessionRepository.count();
        const tq = await this.sessionRepository
          .createQueryBuilder('session')
          .select('SUM(session.questionsAttempted)', 'total')
          .getRawOne();
        totalQuestions = parseInt(tq?.total || '0');

        const as = await this.sessionRepository
          .createQueryBuilder('session')
          .select('AVG(session.score)', 'avg')
          .getRawOne();
        avgScore = parseFloat(as?.avg || '0');
      } catch {
        // Tables may not exist yet
      }

      let usersByGrade: any[] = [];
      try {
        usersByGrade = await this.usersRepository
          .createQueryBuilder('user')
          .select('user.grade', 'grade')
          .addSelect('COUNT(*)', 'count')
          .where('user.role = :role', { role: UserRole.STUDENT })
          .andWhere('user.grade IS NOT NULL')
          .groupBy('user.grade')
          .orderBy('user.grade', 'ASC')
          .getRawMany();
      } catch {
        // Ignore if query fails
      }

      const recentUsers = await this.usersRepository.find({
        order: { createdAt: 'DESC' },
        take: 10,
      });

      let monthlyGrowth: any[] = [];
      try {
        monthlyGrowth = await this.usersRepository
          .createQueryBuilder('user')
          .select("TO_CHAR(user.createdAt, 'YYYY-MM')", 'month')
          .addSelect('COUNT(*)', 'count')
          .groupBy("TO_CHAR(user.createdAt, 'YYYY-MM')")
          .orderBy('month', 'ASC')
          .getRawMany();
      } catch {
        // Ignore if query fails
      }

      return {
        totalUsers,
        students,
        teachers,
        tutors,
        parents,
        activeUsers,
        legacyStudents,
        totalSessions,
        totalQuestionsAttempted: totalQuestions,
        averageScore: avgScore.toFixed(1),
        usersByGrade,
        recentUsers: recentUsers.map(u => ({
          id: u.id,
          name: `${u.firstName} ${u.lastName}`,
          email: u.email,
          role: u.role,
          grade: u.grade,
          createdAt: u.createdAt,
        })),
        monthlyGrowth,
      };
    } catch (error) {
      console.error('Error in getPlatformStats:', error);
      return {
        totalUsers: 0, students: 0, teachers: 0, tutors: 0, parents: 0,
        activeUsers: 0, legacyStudents: 0, totalSessions: 0,
        totalQuestionsAttempted: 0, averageScore: '0.0',
        usersByGrade: [], recentUsers: [], monthlyGrowth: [],
      };
    }
  }

  async getSubjectPopularity(): Promise<any[]> {
    try {
      const metrics = await this.metricsRepository
        .createQueryBuilder('metric')
        .select('metric.subjectId', 'subject')
        .addSelect('COUNT(*)', 'count')
        .addSelect('AVG(metric.successRate)', 'avgSuccessRate')
        .groupBy('metric.subjectId')
        .orderBy('count', 'DESC')
        .getRawMany();
      return metrics;
    } catch {
      return [];
    }
  }

  async getRecentActivity(): Promise<any[]> {
    try {
      let recentSessions: any[] = [];
      try {
        recentSessions = await this.sessionRepository.find({
          order: { createdAt: 'DESC' },
          take: 20,
        });
      } catch {
        // Table may not exist
      }

      const recentUsers = await this.usersRepository.find({
        order: { createdAt: 'DESC' },
        take: 10,
      });

      const activities = [
        ...recentUsers.map(u => ({
          type: 'user_created',
          title: `New ${u.role} registered`,
          description: `${u.firstName} ${u.lastName} (${u.email})`,
          timestamp: u.createdAt,
        })),
        ...recentSessions.map(s => ({
          type: 'session_completed',
          title: `Practice session completed`,
          description: `User ${s.userId} - Score: ${s.score}%`,
          timestamp: s.createdAt,
        })),
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 20);

      return activities;
    } catch (error) {
      console.error('Error in getRecentActivity:', error);
      return [];
    }
  }
}