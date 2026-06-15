import { Controller, Post, UseGuards, Request, Body, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiProperty } from '@nestjs/swagger';
import { LiveKitService } from './livekit.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsString, IsNotEmpty } from 'class-validator';

export class TokenRequestDto {
  @ApiProperty({ description: 'The unique name of the room to join' })
  @IsString()
  @IsNotEmpty()
  roomName: string;
}

@ApiTags('live-sessions')
@Controller('live-sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class LiveKitController {
  constructor(private readonly livekitService: LiveKitService) {}

  @Post('token')
  @ApiOperation({ summary: 'Generate a join token for a LiveKit room' })
  async getJoinToken(@Request() req, @Body() dto: TokenRequestDto) {
    const userId = req.user.id;
    const name = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Anonymous User';
    const role = req.user.role;

    if (!dto.roomName) {
      throw new BadRequestException('roomName is required');
    }

    const token = await this.livekitService.generateToken(
      dto.roomName,
      userId,
      name,
      role,
    );

    return {
      token,
      roomName: dto.roomName,
      identity: userId,
      name,
      role,
      serverUrl: process.env.LIVEKIT_URL || 'http://localhost:7880',
    };
  }
}
