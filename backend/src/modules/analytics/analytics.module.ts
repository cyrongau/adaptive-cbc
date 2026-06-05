import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { PerformanceMetric, RevisionSession, LearningInsight, ParentReport } from './entities/analytics.entity';
import { User } from '../users/entities/user.entity';
import { Question } from '../questions/entities/question.entity';
import { UsageLog } from '../governance/entities/usage-log.entity';
import { Assignment } from '../assignments/entities/assignment.entity';
import { Lesson } from '../lessons/entities/lesson.entity';
import { Course } from '../courses/entities/course.entity';
import { Enrollment } from '../enrollment/entities/enrollment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([PerformanceMetric, RevisionSession, LearningInsight, ParentReport, User, Question, UsageLog, Assignment, Lesson, Course, Enrollment]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
  exports: [AnalyticsService],
})
export class AnalyticsModule {}
