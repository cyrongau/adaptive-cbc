import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { TicketStatus, TicketPriority } from '../entities/support-ticket.entity';

export class UpdateTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @IsOptional()
  @IsUUID()
  assignedAgentId?: string;

  @IsOptional()
  @IsUUID()
  conversationId?: string;
}
