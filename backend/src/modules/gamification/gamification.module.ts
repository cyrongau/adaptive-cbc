import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { Tournament, TournamentParticipant, UserBadge, Leaderboard, GameHistory } from './entities/gamification.entity';
import { UsersModule } from '../users/users.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Tournament, TournamentParticipant, UserBadge, Leaderboard, GameHistory]),
    UsersModule,
    HttpModule,
    AiModule,
  ],
  controllers: [GamificationController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}