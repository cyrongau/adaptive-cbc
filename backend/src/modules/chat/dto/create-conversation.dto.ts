import { IsEnum, IsArray, IsOptional, IsString, IsUUID } from 'class-validator';
import { ConversationType } from '../entities/chat-conversation.entity';

export class CreateConversationDto {
  @IsEnum(ConversationType)
  type: ConversationType;

  @IsArray()
  @IsUUID('all', { each: true })
  participantIds: string[];

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsUUID()
  ticketId?: string;
}
