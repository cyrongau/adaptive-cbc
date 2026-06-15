import { Injectable, NotFoundException, ForbiddenException, BadRequestException, Logger, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Not, IsNull } from 'typeorm';
import { ChatConversation, ConversationType } from './entities/chat-conversation.entity';
import { ChatMessage } from './entities/chat-message.entity';
import { User } from '../users/entities/user.entity';
import { UserRelationship, RelationshipType } from '../relationships/entities/relationship.entity';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ConfigService } from '@nestjs/config';
import { ChatGateway } from './chat.gateway';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    @InjectRepository(ChatConversation)
    private conversationRepository: Repository<ChatConversation>,
    @InjectRepository(ChatMessage)
    private messageRepository: Repository<ChatMessage>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(UserRelationship)
    private relationshipRepository: Repository<UserRelationship>,
    private readonly configService: ConfigService,
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateway: ChatGateway,
  ) {}

  async createConversation(userId: string, dto: CreateConversationDto): Promise<ChatConversation> {
    const creator = await this.userRepository.findOne({ where: { id: userId } });
    if (!creator) {
      throw new NotFoundException('Creator not found');
    }

    // Ensure all participant IDs exist
    const allParticipantIds = Array.from(new Set([...dto.participantIds, userId]));
    const participants = await this.userRepository.find({
      where: { id: In(allParticipantIds) },
    });

    if (participants.length !== allParticipantIds.length) {
      throw new BadRequestException('One or more participant IDs are invalid');
    }

    // Role-based permission checks
    if (dto.type === ConversationType.TEACHER_STUDENT) {
      // Check if creator is student. If so, check for a relationship with the teacher/tutor
      if (creator.role === 'student') {
        const teachers = participants.filter((p) => p.role === 'teacher' || p.role === 'tutor' || p.role === 'institution_admin' || p.role === 'super_admin');
        if (teachers.length === 0) {
          throw new ForbiddenException('Student must message a teacher or tutor');
        }
        // Check relationships or institutional boundary for each teacher
        for (const teacher of teachers) {
          const sharesInstitution = creator.institutionId && teacher.institutionId && creator.institutionId === teacher.institutionId;
          if (!sharesInstitution) {
            const relationship = await this.relationshipRepository.findOne({
              where: [
                { userId: creator.id, relatedUserId: teacher.id, isActive: true },
                { userId: teacher.id, relatedUserId: creator.id, isActive: true },
              ],
            });
            if (!relationship) {
              throw new ForbiddenException(`No active learning relationship or shared institution established with teacher ${teacher.firstName}`);
            }
          }
        }
      }
    } else if (dto.type === ConversationType.SUPPORT) {
      // Allow support conversation creation
    } else if (dto.type === ConversationType.ADMIN_INITIATED) {
      // Creator must be admin, teacher, or support agent
      const allowedRoles = ['super_admin', 'institution_admin', 'tutor', 'teacher'];
      if (!allowedRoles.includes(creator.role)) {
        throw new ForbiddenException('Only admin, teacher, or support roles can initiate this conversation');
      }
    } else if (dto.type === ConversationType.COMMUNITY) {
      // Creator must be admin
      const allowedRoles = ['super_admin', 'institution_admin'];
      if (!allowedRoles.includes(creator.role)) {
        throw new ForbiddenException('Only institutional admins can create communities');
      }
    } else if (dto.type === ConversationType.DIRECT) {
      // Direct messages allowed between any users — no extra permission checks
    }


    // Check if an existing 1-on-1 conversation of the same type already exists
    if (allParticipantIds.length === 2 && dto.type !== ConversationType.COMMUNITY) {
      const existingConversations = await this.conversationRepository
        .createQueryBuilder('c')
        .leftJoinAndSelect('c.participants', 'p')
        .where('c.type = :type', { type: dto.type })
        .getMany();

      for (const conv of existingConversations) {
        const ids = conv.participants.map((p) => p.id);
        if (ids.includes(allParticipantIds[0]) && ids.includes(allParticipantIds[1])) {
          return conv;
        }
      }
    }

    const conversation = this.conversationRepository.create({
      type: dto.type,
      ticketId: dto.ticketId,
      title: dto.title,
      participants,
    });

    const saved = await this.conversationRepository.save(conversation);

    // Re-fetch with relations so the response includes participants
    return this.conversationRepository.findOne({
      where: { id: saved.id },
      relations: ['participants'],
    }) as Promise<ChatConversation>;
  }

  async getConversationsForUser(userId: string): Promise<ChatConversation[]> {
    return this.conversationRepository
      .createQueryBuilder('conversation')
      .leftJoinAndSelect('conversation.participants', 'participant')
      .leftJoin('conversation.participants', 'userFilter')
      .leftJoinAndSelect('conversation.messages', 'message')
      .leftJoinAndSelect('message.sender', 'messageSender')
      .where('userFilter.id = :userId', { userId })
      .orderBy('conversation.updatedAt', 'DESC')
      .addOrderBy('message.createdAt', 'DESC')
      .getMany();
  }

  async getConversationMessages(
    conversationId: string,
    userId: string,
    limit = 50,
    beforeMessageId?: string,
  ): Promise<ChatMessage[]> {
    // Verify user is participant
    const conversation = await this.conversationRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.participants', 'p')
      .where('c.id = :conversationId', { conversationId })
      .getOne();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants.some((p) => p.id === userId);
    if (!isParticipant) {
      throw new ForbiddenException('User is not a participant in this conversation');
    }

    const query = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sender', 'sender')
      .leftJoinAndSelect('message.replyTo', 'replyTo')
      .leftJoinAndSelect('replyTo.sender', 'replyToSender')
      .where('message.conversationId = :conversationId', { conversationId })
      .orderBy('message.createdAt', 'DESC')
      .take(limit);

    if (beforeMessageId) {
      const beforeMessage = await this.messageRepository.findOne({
        where: { id: beforeMessageId },
      });
      if (beforeMessage) {
        query.andWhere('message.createdAt < :beforeDate', { beforeDate: beforeMessage.createdAt });
      }
    }

    const messages = await query.getMany();
    return messages.reverse();
  }

  async sendMessage(conversationId: string, senderId: string, dto: SendMessageDto): Promise<ChatMessage> {
    const conversation = await this.conversationRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.participants', 'p')
      .where('c.id = :conversationId', { conversationId })
      .getOne();

    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }

    const isParticipant = conversation.participants.some((p) => p.id === senderId);
    if (!isParticipant) {
      throw new ForbiddenException('User is not a participant in this conversation');
    }

    const message = this.messageRepository.create({
      conversationId,
      senderId,
      message: dto.message,
      attachmentKey: dto.attachmentKey,
      replyToId: dto.replyToId,
    });

    const savedMessage = await this.messageRepository.save(message);

    // Update conversation updatedAt timestamp
    conversation.updatedAt = new Date();
    await this.conversationRepository.save(conversation);

    // Fetch message with sender detail and replies
    const fullMessage = await this.messageRepository.findOne({
      where: { id: savedMessage.id },
      relations: [
        'sender',
        'conversation',
        'conversation.participants',
        'replyTo',
        'replyTo.sender',
      ],
    });

    // Check if it is a Socratic AI conversation and the sender is NOT the tutor itself
    this.getSocraticTutorId().then((tutorId) => {
      if (conversation.type === ConversationType.AI_SOCRATIC && senderId !== tutorId) {
        this.triggerSocraticResponse(conversationId, senderId, dto.message);
      }
    }).catch((err) => {
      this.logger.error('Failed to get Socratic tutor ID', err);
    });

    return fullMessage;
  }

  async markMessagesAsRead(conversationId: string, userId: string): Promise<string[]> {
    const result = await this.messageRepository
      .createQueryBuilder()
      .update(ChatMessage)
      .set({ readAt: new Date() })
      .where('conversationId = :conversationId AND senderId != :userId AND readAt IS NULL', {
        conversationId,
        userId,
      })
      .returning('id')
      .execute();

    return (result.raw || []).map((r: any) => r.id);
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.messageRepository
      .createQueryBuilder('m')
      .innerJoin('m.conversation', 'c')
      .innerJoin('c.participants', 'p')
      .where('p.id = :userId AND m.senderId != :userId AND m.readAt IS NULL', { userId })
      .getCount();
  }

  async addParticipant(conversationId: string, participantId: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    const user = await this.userRepository.findOne({ where: { id: participantId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const alreadyParticipant = conversation.participants.some((p) => p.id === participantId);
    if (!alreadyParticipant) {
      conversation.participants.push(user);
      await this.conversationRepository.save(conversation);
    }
  }

  async joinCommunity(conversationId: string, userId: string): Promise<void> {
    const conversation = await this.conversationRepository.findOne({
      where: { id: conversationId },
      relations: ['participants'],
    });
    if (!conversation) {
      throw new NotFoundException('Conversation not found');
    }
    if (conversation.type !== ConversationType.COMMUNITY) {
      throw new BadRequestException('Only community conversations can be joined directly');
    }
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const alreadyParticipant = conversation.participants.some((p) => p.id === userId);
    if (!alreadyParticipant) {
      conversation.participants.push(user);
      await this.conversationRepository.save(conversation);
    }
  }

  async getCommunitiesForUser(userId: string, institutionId?: string): Promise<ChatConversation[]> {
    if (!institutionId) {
      return [];
    }
    return this.conversationRepository
      .createQueryBuilder('conversation')
      .innerJoin('conversation.participants', 'participant')
      .leftJoinAndSelect('conversation.participants', 'allParticipants')
      .where('conversation.type = :type', { type: ConversationType.COMMUNITY })
      .andWhere('participant.institutionId = :institutionId', { institutionId })
      .getMany();
  }

  private socraticTutorId: string | null = null;

  async getSocraticTutorId(): Promise<string> {
    if (this.socraticTutorId) return this.socraticTutorId;
    const tutor = await this.userRepository.findOne({ where: { email: 'socratic.tutor@adaptive-cbc.com' } });
    if (tutor) {
      this.socraticTutorId = tutor.id;
      return tutor.id;
    }
    
    // Seed virtual tutor if not found
    const tutorEmail = 'socratic.tutor@adaptive-cbc.com';
    const hashedPassword = await bcrypt.hash('socratic_tutor_secret_password_2026', 10);
    const newTutor = this.userRepository.create({
      email: tutorEmail,
      password: hashedPassword,
      firstName: 'Socratic',
      lastName: 'AI Tutor',
      role: 'teacher' as any,
      isActive: true,
      isEmailVerified: true,
      avatar: 'socratic_avatar.png',
    });
    const saved = await this.userRepository.save(newTutor);
    this.socraticTutorId = saved.id;
    return saved.id;
  }

  async getOrCreateSocraticConversation(userId: string): Promise<ChatConversation> {
    const tutorId = await this.getSocraticTutorId();
    const tutorUser = await this.userRepository.findOne({ where: { id: tutorId } });
    const studentUser = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!studentUser || !tutorUser) {
      throw new NotFoundException('Student or Socratic AI Tutor user not found');
    }

    // Check if an existing Socratic conversation exists
    const existing = await this.conversationRepository
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.participants', 'p')
      .where('c.type = :type', { type: ConversationType.AI_SOCRATIC })
      .getMany();

    for (const conv of existing) {
      const ids = conv.participants.map((p) => p.id);
      if (ids.includes(userId) && ids.includes(tutorId)) {
        return conv;
      }
    }

    // Create a new Socratic conversation
    const conversation = this.conversationRepository.create({
      type: ConversationType.AI_SOCRATIC,
      title: 'Socratic AI Tutor',
      participants: [studentUser, tutorUser],
    });

    const saved = await this.conversationRepository.save(conversation);

    return this.conversationRepository.findOne({
      where: { id: saved.id },
      relations: ['participants'],
    }) as Promise<ChatConversation>;
  }

  async triggerSocraticResponse(conversationId: string, studentId: string, studentMessage: string) {
    // Run asynchronously to avoid blocking client
    setTimeout(async () => {
      try {
        const tutorId = await this.getSocraticTutorId();

        // Emit typing start indicator
        if (this.chatGateway) {
          this.chatGateway.server.to(`conversation_${conversationId}`).emit('typing', {
            conversationId,
            userId: tutorId,
            userName: 'Socratic AI Tutor',
            isTyping: true,
          });
        }

        // Fetch recent messages context (last 15 messages)
        const recentMessages = await this.messageRepository.find({
          where: { conversationId },
          order: { createdAt: 'DESC' },
          take: 15,
        });

        const history = recentMessages.reverse().map((msg) => ({
          role: msg.senderId === tutorId ? 'assistant' : 'user',
          content: msg.message,
        }));

        // Request AI response via OpenRouter
        const axios = require('axios');
        const apiKey = this.configService.get('OPENROUTER_API_KEY');
        
        let aiResponseText = "Let's think about that. What do you think our next step should be?";
        
        if (apiKey) {
          try {
            const response = await axios.post(
              'https://openrouter.ai/api/v1/chat/completions',
              {
                model: 'google/gemma-4-31b-it:free',
                messages: [
                  { role: 'system', content: 'You are a Socratic AI Tutor. Guide the student to the answer by asking questions. Do not just give them the answer.' },
                  ...history
                ],
              },
              {
                headers: {
                  'Authorization': `Bearer ${apiKey}`,
                  'Content-Type': 'application/json',
                },
              }
            );
            aiResponseText = response.data.choices[0].message.content;
          } catch (e) {
            this.logger.error('Failed to get response from OpenRouter', e);
          }
        }

        // Emit typing stop indicator
        if (this.chatGateway) {
          this.chatGateway.server.to(`conversation_${conversationId}`).emit('typing', {
            conversationId,
            userId: tutorId,
            userName: 'Socratic AI Tutor',
            isTyping: false,
          });
        }

        // Save and broadcast message
        const savedMsg = await this.sendMessage(conversationId, tutorId, {
          message: aiResponseText,
        });

        // Emit message via Socket
        if (this.chatGateway) {
          this.chatGateway.server.to(`conversation_${conversationId}`).emit('messageReceived', {
            ...savedMsg,
            attachmentUrl: null,
          });

          // Unread notification to student
          this.chatGateway.server.to(`user_${studentId}`).emit('unreadUpdate', {
            conversationId,
            unreadCount: 1,
          });
        }
      } catch (error) {
        this.logger.error('Error in Socratic AI background processing:', error);
        
        // Clean typing indicator in case of crash
        try {
          const tutorId = await this.getSocraticTutorId();
          if (this.chatGateway) {
            this.chatGateway.server.to(`conversation_${conversationId}`).emit('typing', {
              conversationId,
              userId: tutorId,
              userName: 'Socratic AI Tutor',
              isTyping: false,
            });
          }
        } catch (_) {}
      }
    }, 1000); // 1s delay for natural timing
  }
}

