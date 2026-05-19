import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { ExamsService } from './exams.service';
import { ExamsController } from './exams.controller';
import { Exam, ExamAttempt } from './entities/exam.entity';
import { QuestionsModule } from '../questions/questions.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exam, ExamAttempt]),
    HttpModule,
    ConfigModule,
    QuestionsModule,
    UsersModule,
  ],
  controllers: [ExamsController],
  providers: [ExamsService],
  exports: [ExamsService],
})
export class ExamsModule {}