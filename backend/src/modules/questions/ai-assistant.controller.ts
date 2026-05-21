import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AIAssistantService } from './services/ai-assistant.service';
import { GovernanceTier } from '../governance/entities/usage-log.entity';

@ApiTags('ai-assistant')
@Controller('ai-assistant')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AIAssistantController {
  constructor(private readonly aiAssistantService: AIAssistantService) {}

  private getUserTier(role: string): GovernanceTier {
    const tierMap: Record<string, GovernanceTier> = {
      'super_admin': GovernanceTier.ENTERPRISE,
      'institution_admin': GovernanceTier.SCHOOL,
      'teacher': GovernanceTier.TUTOR,
      'tutor': GovernanceTier.TUTOR,
      'student': GovernanceTier.FREE,
      'parent': GovernanceTier.FREE,
    };
    return tierMap[role] || GovernanceTier.FREE;
  }

  @Post('enhance')
  @ApiOperation({ summary: 'Enhance question wording' })
  async enhanceQuestion(@Request() req, @Body() data: {
    content: string;
    options: string[];
  }) {
    const tier = this.getUserTier(req.user.role);
    return this.aiAssistantService.enhanceQuestion(req.user.id, data.content, data.options, tier);
  }

  @Post('simplify')
  @ApiOperation({ summary: 'Simplify question language for target grade' })
  async simplifyLanguage(@Request() req, @Body() data: {
    questionText: string;
    targetGrade: number;
  }) {
    const tier = this.getUserTier(req.user.role);
    return this.aiAssistantService.simplifyLanguage(req.user.id, data.questionText, data.targetGrade, tier);
  }

  @Post('align-cbc')
  @ApiOperation({ summary: 'Align question wording with CBC strand' })
  async alignWithCBC(@Request() req, @Body() data: {
    questionText: string;
    strand: string;
  }) {
    const tier = this.getUserTier(req.user.role);
    return this.aiAssistantService.alignWithCBC(req.user.id, data.questionText, data.strand, tier);
  }

  @Post('solution')
  @ApiOperation({ summary: 'Generate step-by-step solution' })
  async generateSolution(@Request() req, @Body() data: {
    question: string;
    options: string[];
    correctAnswer: string;
  }) {
    const tier = this.getUserTier(req.user.role);
    return this.aiAssistantService.generateSolution(req.user.id, data.question, data.options, data.correctAnswer, tier);
  }

  @Post('explanation')
  @ApiOperation({ summary: 'Generate answer explanation' })
  async generateExplanation(@Request() req, @Body() data: {
    question: string;
    correctAnswer: string;
  }) {
    const tier = this.getUserTier(req.user.role);
    return this.aiAssistantService.generateExplanation(req.user.id, data.question, data.correctAnswer, tier);
  }

  @Post('marking-scheme')
  @ApiOperation({ summary: 'Generate marking scheme' })
  async generateMarkingScheme(@Request() req, @Body() data: {
    question: string;
    correctAnswer: string;
    marks: number;
  }) {
    const tier = this.getUserTier(req.user.role);
    return this.aiAssistantService.generateMarkingScheme(req.user.id, data.question, data.correctAnswer, data.marks, tier);
  }

  @Post('hints')
  @ApiOperation({ summary: 'Generate progressive hints' })
  async generateHints(@Request() req, @Body() data: {
    question: string;
    correctAnswer: string;
    count: number;
  }) {
    const tier = this.getUserTier(req.user.role);
    return this.aiAssistantService.generateHints(req.user.id, data.question, data.correctAnswer, data.count || 3, tier);
  }

  @Post('map-competency')
  @ApiOperation({ summary: 'Map question to CBC competency' })
  async mapCompetency(@Request() req, @Body() data: {
    question: string;
    grade: number;
    subject: string;
  }) {
    const tier = this.getUserTier(req.user.role);
    return this.aiAssistantService.mapCompetency(req.user.id, data.question, data.grade, data.subject, tier);
  }

  @Post('suggest-curriculum')
  @ApiOperation({ summary: 'Suggest full curriculum mapping' })
  async suggestCurriculum(@Request() req, @Body() data: {
    questionText: string;
    subject: string;
    grade: number;
  }) {
    const tier = this.getUserTier(req.user.role);
    return this.aiAssistantService.suggestCurriculum(req.user.id, data.questionText, data.subject, data.grade, tier);
  }

  @Post('variations')
  @ApiOperation({ summary: 'Generate question variation' })
  async generateVariation(@Request() req, @Body() data: {
    question: {
      content: string;
      type: string;
      options?: { id: string; text: string; isCorrect: boolean }[];
      correctAnswer?: string;
      explanation?: string;
      difficulty: string;
      marks: number;
    };
    difficultyShift: 'easier' | 'harder' | 'same';
  }) {
    const tier = this.getUserTier(req.user.role);
    return this.aiAssistantService.generateVariation(req.user.id, data.question, data.difficultyShift, tier);
  }

  @Post('randomize')
  @ApiOperation({ summary: 'Randomize numerical values in a question' })
  async generateRandomizedValues(@Request() req, @Body() data: {
    question: {
      content: string;
      type: string;
      options?: { id: string; text: string; isCorrect: boolean }[];
      correctAnswer?: string;
    };
  }) {
    const tier = this.getUserTier(req.user.role);
    return this.aiAssistantService.generateRandomizedValues(req.user.id, data.question, tier);
  }
}
