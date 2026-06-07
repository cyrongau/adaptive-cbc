import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket, TicketStatus } from './entities/support-ticket.entity';
import { ChatService } from '../chat/chat.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { User } from '../users/entities/user.entity';
import { ConversationType } from '../chat/entities/chat-conversation.entity';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private ticketRepository: Repository<SupportTicket>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private chatService: ChatService,
  ) {}

  async createTicket(userId: string, dto: CreateTicketDto): Promise<SupportTicket> {
    const ticket = this.ticketRepository.create({
      subject: dto.subject,
      description: dto.description,
      priority: dto.priority,
      category: dto.category,
      userId,
    });

    const savedTicket = await this.ticketRepository.save(ticket);

    // Automatically create a linked support chat conversation
    const conversation = await this.chatService.createConversation(userId, {
      type: ConversationType.SUPPORT,
      participantIds: [],
      ticketId: savedTicket.id,
      title: `Support: ${dto.subject}`,
    });

    savedTicket.conversationId = conversation.id;
    return this.ticketRepository.save(savedTicket);
  }

  async getUserTickets(userId: string): Promise<SupportTicket[]> {
    return this.ticketRepository.find({
      where: { userId },
      relations: ['assignedAgent'],
      order: { createdAt: 'DESC' },
    });
  }

  async getTicketById(ticketId: string, userId: string, userRole: string): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
      relations: ['user', 'assignedAgent'],
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const isAuthorized =
      ticket.userId === userId ||
      ['super_admin', 'institution_admin', 'tutor'].includes(userRole);

    if (!isAuthorized) {
      throw new ForbiddenException('You are not authorized to view this ticket');
    }

    return ticket;
  }

  async getAllTickets(userRole: string): Promise<SupportTicket[]> {
    if (!['super_admin', 'institution_admin', 'tutor'].includes(userRole)) {
      throw new ForbiddenException('Only support agents and admins can list all tickets');
    }
    return this.ticketRepository.find({
      relations: ['user', 'assignedAgent'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateTicket(
    ticketId: string,
    userId: string,
    userRole: string,
    dto: UpdateTicketDto,
  ): Promise<SupportTicket> {
    const ticket = await this.ticketRepository.findOne({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Permission check
    const isOwner = ticket.userId === userId;
    const isAgent = ['super_admin', 'institution_admin', 'tutor'].includes(userRole);

    if (!isOwner && !isAgent) {
      throw new ForbiddenException('You are not authorized to update this ticket');
    }

    // Agent checks for modifications
    if (dto.assignedAgentId || dto.priority) {
      if (!isAgent) {
        throw new ForbiddenException('Only support agents can assign agents or update priority');
      }
    }

    if (dto.status && dto.status !== TicketStatus.CLOSED && !isAgent) {
      throw new ForbiddenException('Only support agents can update ticket status');
    }

    if (dto.status) {
      ticket.status = dto.status;
    }

    if (dto.priority) {
      ticket.priority = dto.priority;
    }

    if (dto.assignedAgentId) {
      const agent = await this.userRepository.findOne({ where: { id: dto.assignedAgentId } });
      if (!agent || !['super_admin', 'institution_admin', 'tutor'].includes(agent.role)) {
        throw new BadRequestException('Assigned agent ID is not a valid support agent');
      }
      ticket.assignedAgentId = dto.assignedAgentId;

      if (ticket.conversationId) {
        await this.chatService.addParticipant(ticket.conversationId, dto.assignedAgentId);
      }
    }

    return this.ticketRepository.save(ticket);
  }
}
