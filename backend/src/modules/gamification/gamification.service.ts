import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Tournament, TournamentParticipant, UserBadge, Leaderboard, TournamentStatus } from './entities/gamification.entity';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';
import { AiService } from '../ai/ai.service';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class GamificationService {
  constructor(
    @InjectRepository(Tournament)
    private tournamentRepository: Repository<Tournament>,
    @InjectRepository(TournamentParticipant)
    private participantRepository: Repository<TournamentParticipant>,
    @InjectRepository(UserBadge)
    private badgeRepository: Repository<UserBadge>,
    @InjectRepository(Leaderboard)
    private leaderboardRepository: Repository<Leaderboard>,
    private usersService: UsersService,
    private aiService: AiService,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async spawnDailyTournament() {
    console.log('Running daily tournament spawner...');
    const now = new Date();
    const activeDaily = await this.tournamentRepository.findOne({
      where: {
        name: `Daily Challenge - ${now.toISOString().split('T')[0]}`,
      }
    });

    if (!activeDaily) {
      const endTime = new Date(now);
      endTime.setHours(23, 59, 59, 999);
      
      const newTournament = this.tournamentRepository.create({
        name: `Daily Challenge - ${now.toISOString().split('T')[0]}`,
        description: 'Compete in the daily brain challenge to earn bonus XP and badges!',
        startTime: now,
        endTime: endTime,
        isActive: true,
        status: TournamentStatus.ACTIVE,
      });
      await this.tournamentRepository.save(newTournament);
      console.log(`Spawned new daily tournament: ${newTournament.name}`);
    }
  }

  async generateAIGame(subject: string, grade: number, topic?: string, difficulty?: string): Promise<any> {
    const t = topic || subject;
    const level = difficulty || 'medium';
    return this.aiService.generateAdaptiveGame(subject, t, grade, level);
  }

  private getFallbackGame(subject: string) {
    return {
      type: 'trivia',
      title: `${subject} Quick Quiz`,
      questions: [
        {
          prompt: `What is a basic concept in ${subject}?`,
          options: ['Concept A', 'Concept B', 'Concept C', 'Concept D'],
          correctAnswer: 'Concept A'
        }
      ]
    };
  }

  async submitGameScore(userId: string, score: number): Promise<{ xpAwarded: number }> {
    const xpToAward = Math.floor(score * 10);
    if (xpToAward > 0) {
      await this.usersService.addXpPoints(userId, xpToAward);
    }
    return { xpAwarded: xpToAward };
  }

  async findAllTournaments(filters?: { status?: TournamentStatus; subjectId?: string }): Promise<Tournament[]> {
    const query = this.tournamentRepository.createQueryBuilder('tournament')
      .where('tournament.isActive = :isActive', { isActive: true });

    if (filters?.status) {
      query.andWhere('tournament.status = :status', { status: filters.status });
    }

    if (filters?.subjectId) {
      query.andWhere('tournament.subjectId = :subjectId', { subjectId: filters.subjectId });
    }

    return query.orderBy('tournament.startTime', 'ASC').getMany();
  }

  async getActiveTournaments(): Promise<Tournament[]> {
    const now = new Date();
    return this.tournamentRepository
      .createQueryBuilder('tournament')
      .where('tournament.isActive = :isActive', { isActive: true })
      .andWhere('tournament.startTime <= :now', { now })
      .andWhere('tournament.endTime >= :now', { now })
      .orderBy('tournament.startTime', 'ASC')
      .getMany();
  }

  async findOneTournament(id: string): Promise<Tournament> {
    const tournament = await this.tournamentRepository.findOne({ where: { id } });
    if (!tournament) {
      throw new NotFoundException(`Tournament with ID ${id} not found`);
    }
    return tournament;
  }

  async joinTournament(userId: string, tournamentId: string): Promise<TournamentParticipant> {
    const tournament = await this.findOneTournament(tournamentId);

    if (tournament.status !== TournamentStatus.ACTIVE) {
      throw new BadRequestException('Tournament is not active');
    }

    const existingParticipant = await this.participantRepository.findOne({
      where: { tournamentId, userId },
    });

    if (existingParticipant) {
      return existingParticipant;
    }

    const participant = this.participantRepository.create({
      tournamentId,
      userId,
    });

    return this.participantRepository.save(participant);
  }

  async submitTournamentScore(userId: string, tournamentId: string, score: number, correctAnswers: number, totalQuestions: number, timeSpent: number): Promise<TournamentParticipant> {
    const participant = await this.participantRepository.findOne({
      where: { tournamentId, userId },
    });

    if (!participant) {
      throw new NotFoundException('Participant not found');
    }

    participant.score = score;
    participant.correctAnswers = correctAnswers;
    participant.totalQuestions = totalQuestions;
    participant.timeSpentSeconds = timeSpent;
    participant.isCompleted = true;
    participant.completedAt = new Date();

    const savedParticipant = await this.participantRepository.save(participant);

    const rank = await this.updateTournamentRanking(tournamentId);

    if (savedParticipant.score > 0) {
      await this.usersService.addXpPoints(userId, Math.floor(savedParticipant.score / 10));
    }

    return savedParticipant;
  }

  private async updateTournamentRanking(tournamentId: string): Promise<number[]> {
    const participants = await this.participantRepository.find({
      where: { tournamentId, isCompleted: true },
      order: { score: 'DESC', timeSpentSeconds: 'ASC' },
    });

    const ranks: number[] = [];
    for (let i = 0; i < participants.length; i++) {
      participants[i].rank = i + 1;
      ranks.push(i + 1);
      await this.participantRepository.save(participants[i]);
    }

    return ranks;
  }

  async getTournamentLeaderboard(tournamentId: string, limit: number = 20): Promise<TournamentParticipant[]> {
    return this.participantRepository.find({
      where: { tournamentId, isCompleted: true },
      order: { rank: 'ASC' },
      take: limit,
      relations: ['user'],
    });
  }

  async awardBadge(userId: string, badgeData: {
    badgeName: string;
    badgeType?: string;
    description?: string;
    icon?: string;
    metadata?: any;
  }): Promise<UserBadge> {
    const badge = this.badgeRepository.create({
      userId,
      ...badgeData,
      earnedAt: new Date(),
    });

    return this.badgeRepository.save(badge);
  }

  async getUserBadges(userId: string): Promise<UserBadge[]> {
    return this.badgeRepository.find({
      where: { userId },
      order: { earnedAt: 'DESC' },
    });
  }

  async getGlobalLeaderboard(limit: number = 50): Promise<any[]> {
    const users = await this.usersService.findAll();
    const leaderboard = users
      .filter((user) => user.role === UserRole.STUDENT)
      .sort((a, b) => b.xpPoints - a.xpPoints)
      .slice(0, limit)
      .map((user, index) => ({
        rank: index + 1,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        avatar: user.avatar,
        xpPoints: user.xpPoints,
        level: user.level,
        streakDays: user.streakDays,
      }));

    return leaderboard;
  }

  async getSubjectLeaderboard(subjectId: string, grade?: number): Promise<any[]> {
    return this.getGlobalLeaderboard(20);
  }

  async getGradeLeaderboard(grade: number, limit: number = 20): Promise<any[]> {
    const users = await this.usersService.findAll();
    const gradeLeaderboard = users
      .filter((user) => user.role === UserRole.STUDENT && user.grade === grade)
      .sort((a, b) => b.xpPoints - a.xpPoints)
      .slice(0, limit)
      .map((user, index) => ({
        rank: index + 1,
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        avatar: user.avatar,
        xpPoints: user.xpPoints,
        level: user.level,
      }));

    return gradeLeaderboard;
  }

  async createTournament(tournamentData: Partial<Tournament>): Promise<Tournament> {
    const tournament = this.tournamentRepository.create(tournamentData);
    return this.tournamentRepository.save(tournament);
  }

  async updateTournamentStatus(tournamentId: string, status: TournamentStatus): Promise<Tournament> {
    const tournament = await this.findOneTournament(tournamentId);
    tournament.status = status;
    return this.tournamentRepository.save(tournament);
  }
}