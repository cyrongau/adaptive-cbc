import {
  Controller,
  Post,
  Get,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { MinioService } from '../../common/minio.service';
import { extname } from 'path';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly minioService: MinioService,
  ) {}

  @Post('conversations')
  async createConversation(@Request() req, @Body() dto: CreateConversationDto) {
    return this.chatService.createConversation(req.user.id, dto);
  }

  @Get('conversations')
  async getConversations(@Request() req) {
    return this.chatService.getConversationsForUser(req.user.id);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @Request() req,
    @Param('id') conversationId: string,
    @Query('limit') limit?: number,
    @Query('beforeMessageId') beforeMessageId?: string,
  ) {
    const messages = await this.chatService.getConversationMessages(
      conversationId,
      req.user.id,
      limit ? parseInt(limit.toString(), 10) : undefined,
      beforeMessageId,
    );

    return messages.map((msg) => ({
      ...msg,
      attachmentUrl: msg.attachmentKey ? this.minioService.getPublicUrl(msg.attachmentKey) : null,
    }));
  }

  @Get('messages/:id')
  async getMessagesAlt(
    @Request() req,
    @Param('id') conversationId: string,
    @Query('limit') limit?: number,
    @Query('beforeMessageId') beforeMessageId?: string,
  ) {
    return this.getMessages(req, conversationId, limit, beforeMessageId);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @Request() req,
    @Param('id') conversationId: string,
    @Body() dto: SendMessageDto,
  ) {
    const msg = await this.chatService.sendMessage(conversationId, req.user.id, dto);
    return {
      ...msg,
      attachmentUrl: msg.attachmentKey ? this.minioService.getPublicUrl(msg.attachmentKey) : null,
    };
  }

  @Put('conversations/:id/read')
  async markAsRead(@Request() req, @Param('id') conversationId: string) {
    await this.chatService.markMessagesAsRead(conversationId, req.user.id);
    return { success: true };
  }

  @Post('messages/:id/read')
  async markAsReadAlt(@Request() req, @Param('id') conversationId: string) {
    return this.markAsRead(req, conversationId);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.chatService.getUnreadCount(req.user.id);
    return { unreadCount: count };
  }

  @Get('communities')
  async getCommunities(@Request() req) {
    return this.chatService.getCommunitiesForUser(req.user.id, req.user.institutionId);
  }

  @Post('conversations/:id/join')
  async joinCommunity(@Request() req, @Param('id') conversationId: string) {
    await this.chatService.joinCommunity(conversationId, req.user.id);
    return { success: true };
  }

  @Post('conversations/:id/participants')
  async addParticipant(
    @Request() req,
    @Param('id') conversationId: string,
    @Body('userId') participantId: string,
  ) {
    await this.chatService.addParticipant(conversationId, participantId);
    return { success: true };
  }


  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async uploadAttachment(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    const timestamp = Date.now();
    const ext = extname(file.originalname);
    const filename = `${timestamp}-${Math.random().toString(36).substring(2)}${ext}`;
    const { objectName, url } = await this.minioService.uploadFile('chat', filename, file.buffer, file.mimetype);
    return {
      attachmentKey: objectName,
      attachmentUrl: url,
    };
  }
}
