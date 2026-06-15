import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { ChatGateway } from './chat.gateway';
import { ChatConversation } from './entities/chat-conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { User } from '../users/entities/user.entity';
import { UserRelationship } from '../relationships/entities/relationship.entity';
import { UsersModule } from '../users/users.module';
import { MinioService } from '../../common/minio.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ChatConversation, ChatMessage, User, UserRelationship]),
    UsersModule,
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET', 'cbc_jwt_secret_key_2024_adaptive'),
        signOptions: {
          expiresIn: configService.get('JWT_EXPIRES_IN', '1d'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, MinioService],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
