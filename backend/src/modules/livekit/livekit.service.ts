import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccessToken } from 'livekit-server-sdk';

@Injectable()
export class LiveKitService {
  private apiKey: string;
  private apiSecret: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('LIVEKIT_API_KEY', 'devkey');
    this.apiSecret = this.configService.get<string>('LIVEKIT_API_SECRET', 'secret');
  }

  async generateToken(
    roomName: string,
    participantIdentity: string,
    participantName: string,
    role: string,
  ): Promise<string> {
    try {
      const at = new AccessToken(this.apiKey, this.apiSecret, {
        identity: participantIdentity,
        name: participantName,
        ttl: '2h', // Expire after 2 hours
      });

      const isTeacher =
        role === 'teacher' ||
        role === 'tutor' ||
        role === 'super_admin' ||
        role === 'institution_admin';
      const isStudent = role === 'student';

      at.addGrant({
        roomJoin: true,
        room: roomName,
        canPublish: isTeacher || isStudent,
        canSubscribe: true,
        canPublishData: true,
        roomAdmin: isTeacher,
      });

      return await at.toJwt();
    } catch (error) {
      console.error('LiveKit Token generation error:', error);
      throw new InternalServerErrorException('Failed to generate LiveKit access token');
    }
  }
}
