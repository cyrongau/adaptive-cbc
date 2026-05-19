import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('gamification')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Get('tournaments')
  @ApiOperation({ summary: 'Get all tournaments' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'subjectId', required: false })
  async getTournaments(
    @Query('status') status?: string,
    @Query('subjectId') subjectId?: string,
  ) {
    return this.gamificationService.findAllTournaments({
      status: status as any,
      subjectId,
    });
  }

  @Get('tournaments/active')
  @ApiOperation({ summary: 'Get active tournaments' })
  async getActiveTournaments() {
    return this.gamificationService.getActiveTournaments();
  }

  @Get('tournaments/:id')
  @ApiOperation({ summary: 'Get tournament details' })
  async getTournament(@Param('id') id: string) {
    return this.gamificationService.findOneTournament(id);
  }

  @Post('tournaments/:id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Join a tournament' })
  async joinTournament(@Request() req, @Param('id') id: string) {
    return this.gamificationService.joinTournament(req.user.id, id);
  }

  @Post('tournaments/:id/score')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Submit tournament score' })
  async submitScore(
    @Request() req,
    @Param('id') id: string,
    @Body() data: {
      score: number;
      correctAnswers: number;
      totalQuestions: number;
      timeSpent: number;
    },
  ) {
    return this.gamificationService.submitTournamentScore(
      req.user.id,
      id,
      data.score,
      data.correctAnswers,
      data.totalQuestions,
      data.timeSpent,
    );
  }

  @Get('tournaments/:id/leaderboard')
  @ApiOperation({ summary: 'Get tournament leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTournamentLeaderboard(@Param('id') id: string, @Query('limit') limit: number = 20) {
    return this.gamificationService.getTournamentLeaderboard(id, limit);
  }

  @Get('badges')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get user badges' })
  async getUserBadges(@Request() req) {
    return this.gamificationService.getUserBadges(req.user.id);
  }

  @Get('leaderboard/global')
  @ApiOperation({ summary: 'Get global leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getGlobalLeaderboard(@Query('limit') limit: number = 50) {
    return this.gamificationService.getGlobalLeaderboard(limit);
  }

  @Get('leaderboard/grade/:grade')
  @ApiOperation({ summary: 'Get grade leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getGradeLeaderboard(@Param('grade') grade: number, @Query('limit') limit: number = 20) {
    return this.gamificationService.getGradeLeaderboard(grade, limit);
  }

  @Get('leaderboard/subject/:subjectId')
  @ApiOperation({ summary: 'Get subject leaderboard' })
  @ApiQuery({ name: 'grade', required: false, type: Number })
  async getSubjectLeaderboard(
    @Param('subjectId') subjectId: string,
    @Query('grade') grade?: number,
  ) {
    return this.gamificationService.getSubjectLeaderboard(subjectId, grade);
  }

  @Post('tournaments')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN, UserRole.INSTITUTION_ADMIN)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Create new tournament' })
  async createTournament(@Body() tournamentData: any) {
    return this.gamificationService.createTournament(tournamentData);
  }
}