import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TutorsService } from './tutors.service';
import { TutorsController } from './tutors.controller';
import {
  TutorProfile, TutorApplication, TutorSession, TutorBooking, TutorReview, StudentTutor,
} from './entities/tutor.entity';
import { UsersModule } from '../users/users.module';
import { LiveKitModule } from '../livekit/livekit.module';
import { FinancialModule } from '../financial/financial.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([TutorProfile, TutorApplication, TutorSession, TutorBooking, TutorReview, StudentTutor]),
    UsersModule,
    LiveKitModule,
    FinancialModule,
  ],
  controllers: [TutorsController],
  providers: [TutorsService],
  exports: [TutorsService],
})
export class TutorsModule {}