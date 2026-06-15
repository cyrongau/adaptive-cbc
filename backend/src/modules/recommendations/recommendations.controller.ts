import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RecommendationsService } from './recommendations.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('recommendations')
@Controller('recommendations')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class RecommendationsController {
  constructor(private readonly recommendationsService: RecommendationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get recommendations for current user' })
  async getRecommendations(@Request() req) {
    return this.recommendationsService.getUserRecommendations(req.user.id);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate AI recommendations based on performance' })
  async generateRecommendations(@Request() req) {
    return this.recommendationsService.generateRecommendations(req.user.id, Number(req.user.grade) || 4);
  }

  @Post(':id/dismiss')
  @ApiOperation({ summary: 'Dismiss a recommendation' })
  async dismissRecommendation(@Param('id') id: string, @Request() req) {
    await this.recommendationsService.dismissRecommendation(id, req.user.id);
    return { success: true };
  }

  @Get('goals')
  @ApiOperation({ summary: 'Get study goals for current user' })
  async getGoals(@Request() req) {
    return this.recommendationsService.getUserGoals(req.user.id);
  }

  @Post('goals')
  @ApiOperation({ summary: 'Create a study goal' })
  async createGoal(@Request() req, @Body() data: { title: string; description?: string; subjectId?: string; topicId?: string; targetScore?: number; deadline?: Date }) {
    return this.recommendationsService.createGoal(req.user.id, data);
  }

  @Patch('goals/:id')
  @ApiOperation({ summary: 'Update a study goal' })
  async updateGoal(@Param('id') id: string, @Request() req, @Body() data: Partial<{ title: string; description: string; currentScore: number; targetScore: number; status: string }>) {
    return this.recommendationsService.updateGoal(id, req.user.id, data);
  }

  @Post('goals/:id/complete')
  @ApiOperation({ summary: 'Mark a study goal as completed' })
  async completeGoal(@Param('id') id: string, @Request() req) {
    return this.recommendationsService.completeGoal(id, req.user.id);
  }

  @Delete('goals/:id')
  @ApiOperation({ summary: 'Delete a study goal' })
  async deleteGoal(@Param('id') id: string, @Request() req) {
    await this.recommendationsService.deleteGoal(id, req.user.id);
    return { success: true };
  }

  @Get('weak-areas')
  @ApiOperation({ summary: 'Get weak areas based on performance' })
  async getWeakAreas(@Request() req) {
    return this.recommendationsService.getWeakAreas(req.user.id);
  }
}
