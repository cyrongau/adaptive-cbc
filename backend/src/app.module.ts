import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { SubjectsModule } from './modules/subjects/subjects.module';
import { TopicsModule } from './modules/topics/topics.module';
import { QuestionsModule } from './modules/questions/questions.module';
import { OnboardingModule } from './modules/onboarding/onboarding.module';
import { PracticeModule } from './modules/practice/practice.module';
import { ExamsModule } from './modules/exams/exams.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { TutorsModule } from './modules/tutors/tutors.module';
import { InstitutionsModule } from './modules/institutions/institutions.module';
import { GamificationModule } from './modules/gamification/gamification.module';
import { DigitalLibraryModule } from './modules/digital-library/digital-library.module';
import { ClassesModule } from './modules/classes/classes.module';
import { AssignmentsModule } from './modules/assignments/assignments.module';
import { KycModule } from './modules/kyc/kyc.module';
import { SettingsModule } from './modules/settings/settings.module';
import { SearchModule } from './modules/search/search.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { EnrollmentModule } from './modules/enrollment/enrollment.module';
import { CoursesModule } from './modules/courses/courses.module';
import { LessonsModule } from './modules/lessons/lessons.module';
import { StoreModule } from './modules/store/store.module';
import { FinancialModule } from './modules/financial/financial.module';
import { GovernanceModule } from './modules/governance/governance.module';
import { DatabaseSeeder } from './common/database.seeder';
import { PromotionTaskService } from './common/promotion-task.service';
import { User } from './modules/users/entities/user.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST', 'localhost'),
        port: configService.get<number>('DATABASE_PORT', 5432),
        username: configService.get('DATABASE_USER', 'cbc_user'),
        password: configService.get('DATABASE_PASSWORD', ''),
        database: configService.get('DATABASE_NAME', 'adaptive_cbc'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') !== 'production',
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('DATABASE_SSL') === 'true'
          ? { rejectUnauthorized: false }
          : false,
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ttl: 600,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    SubjectsModule,
    TopicsModule,
    QuestionsModule,
    OnboardingModule,
    PracticeModule,
    ExamsModule,
    AnalyticsModule,
    TutorsModule,
    InstitutionsModule,
    GamificationModule,
    DigitalLibraryModule,
    ClassesModule,
    AssignmentsModule,
    KycModule,
    SettingsModule,
    SearchModule,
    NotificationsModule,
    IntegrationsModule,
    EnrollmentModule,
    CoursesModule,
    LessonsModule,
    StoreModule,
    FinancialModule,
    GovernanceModule,
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [],
  providers: [DatabaseSeeder, PromotionTaskService],
})
export class AppModule {}