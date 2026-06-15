import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsArray, IsNotEmpty } from 'class-validator';

export class ChatHistoryDto {
  @ApiProperty({
    description: 'Array of conversation messages',
    example: [{ role: 'user', content: 'What is photosynthesis?' }],
  })
  @IsArray()
  @IsNotEmpty()
  messages: { role: string; content: string }[];
}

@ApiTags('ai')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('chat')
  @ApiOperation({ summary: 'Centralized Socratic AI tutor completion endpoint' })
  async getSocraticChat(@Body() dto: ChatHistoryDto) {
    const response = await this.aiService.getSocraticResponse(dto.messages);
    return {
      success: true,
      response,
    };
  }
}
