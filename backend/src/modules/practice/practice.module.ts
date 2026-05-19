import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { PracticeService } from './practice.service';
import { PracticeController } from './practice.controller';
import { PracticeSession, PracticeAnswer } from './entities/practice.entity';
import { QuestionsModule } from '../questions/questions.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([PracticeSession, PracticeAnswer]),
    HttpModule,
    ConfigModule,
    QuestionsModule,
    UsersModule,
  ],
  controllers: [PracticeController],
  providers: [PracticeService],
  exports: [PracticeService],
})
export class PracticeModule {}