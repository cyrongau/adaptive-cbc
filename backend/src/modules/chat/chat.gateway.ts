import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';
import { MinioService } from '../../common/minio.service';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3003',
      'http://localhost:8100',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3003',
      'http://127.0.0.1:8100',
    ],
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  // Track online users per conversation: Map<conversationId, Set<userId>>
  private onlineUsers = new Map<string, Set<string>>();

  // Global online tracking: Map<userId, Set<socketId>>
  // Tracks ALL connected users regardless of which conversation they're viewing
  private connectedUsers = new Map<string, Set<string>>();

  @WebSocketServer()
  server: Server;

  constructor(
    @Inject(forwardRef(() => ChatService))
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    private readonly minioService: MinioService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`No token provided for connection client ${client.id}`);
        client.emit('authError', { message: 'Authentication required' });
        client.disconnect();
        return;
      }

      let payload: any;
      try {
        payload = this.jwtService.verify(token, {
          secret: this.configService.get('JWT_SECRET', 'cbc_jwt_secret_key_2024_adaptive'),
        });
      } catch (jwtErr) {
        this.logger.warn(`Invalid JWT for client ${client.id}: ${jwtErr.message}`);
        client.emit('authError', { message: 'Invalid or expired token' });
        client.disconnect();
        return;
      }

      const user = await this.usersService.findOne(payload.sub);
      if (!user || !user.isActive) {
        this.logger.warn(`User for client ${client.id} is inactive or not found`);
        client.emit('authError', { message: 'User not found or inactive' });
        client.disconnect();
        return;
      }

      client.data.user = user;
      client.join(`user_${user.id}`);

      // Track in global connected users map
      if (!this.connectedUsers.has(user.id)) {
        this.connectedUsers.set(user.id, new Set());
      }
      this.connectedUsers.get(user.id)!.add(client.id);

      this.logger.log(`Socket client connected: ${user.email} (${client.id})`);
    } catch (err) {
      this.logger.error(`Socket connection error for client ${client.id}: ${err.message}`);
      client.emit('authError', { message: 'Connection failed' });
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket client disconnected: ${client.id}`);

    const userId = client.data.user?.id;
    if (!userId) return;

    // Remove from global connected users
    const sockets = this.connectedUsers.get(userId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.connectedUsers.delete(userId);
      }
    }

    // Remove user from all conversation online tracking
    for (const [convId, users] of this.onlineUsers.entries()) {
      if (users.delete(userId)) {
        if (users.size === 0) this.onlineUsers.delete(convId);
        else this.emitOnlineUsers(convId);
      }
    }
  }

  @SubscribeMessage('joinConversation')
  handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody('conversationId') conversationId: string,
  ) {
    const user = client.data.user;
    if (!user) {
      client.disconnect();
      return;
    }
    client.join(`conversation_${conversationId}`);
    this.logger.log(`User ${user.email} joined conversation room: conversation_${conversationId}`);

    // Track online user in this conversation
    if (!this.onlineUsers.has(conversationId)) {
      this.onlineUsers.set(conversationId, new Set());
    }
    this.onlineUsers.get(conversationId)!.add(user.id);
    this.emitOnlineUsers(conversationId);
  }

  @SubscribeMessage('leaveConversation')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody('conversationId') conversationId: string,
  ) {
    const user = client.data.user;
    if (!user) return;
    client.leave(`conversation_${conversationId}`);
    this.logger.log(`User ${user.email} left conversation room: conversation_${conversationId}`);

    // Untrack online user
    const users = this.onlineUsers.get(conversationId);
    if (users) {
      users.delete(user.id);
      if (users.size === 0) this.onlineUsers.delete(conversationId);
      else this.emitOnlineUsers(conversationId);
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; message: string; attachmentKey?: string; replyToId?: string },
  ) {
    const user = client.data.user;
    if (!user) {
      client.disconnect();
      return;
    }

    const { conversationId, message, attachmentKey, replyToId } = payload;
    const chatMessage = await this.chatService.sendMessage(conversationId, user.id, {
      message,
      attachmentKey,
      replyToId,
    });

    // Broadcast message to everyone in the room
    const messageWithUrl = {
      ...chatMessage,
      attachmentUrl: chatMessage.attachmentKey ? this.minioService.getPublicUrl(chatMessage.attachmentKey) : null,
    };
    this.server.to(`conversation_${conversationId}`).emit('messageReceived', messageWithUrl);

    // Send unread notifications to other participants in their user-specific rooms
    if (chatMessage.conversation && chatMessage.conversation.participants) {
      for (const p of chatMessage.conversation.participants) {
        if (p.id !== user.id) {
          this.server.to(`user_${p.id}`).emit('unreadUpdate', {
            conversationId,
            unreadCount: 1,
          });
        }
      }
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { conversationId: string; isTyping: boolean },
  ) {
    const user = client.data.user;
    if (!user) return;

    client.to(`conversation_${payload.conversationId}`).emit('typing', {
      conversationId: payload.conversationId,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      isTyping: payload.isTyping,
    });
  }

  emitMessagesRead(conversationId: string, readByUserId: string, readByUserName: string, messageIds: string[]) {
    if (messageIds.length === 0) return;
    this.server.to(`conversation_${conversationId}`).emit('messagesRead', {
      conversationId,
      readBy: { id: readByUserId, name: readByUserName },
      messageIds,
      readAt: new Date().toISOString(),
    });
  }

  emitOnlineUsers(conversationId: string) {
    const userIds = Array.from(this.onlineUsers.get(conversationId) || []);
    const payload = { conversationId, userIds };
    this.server.to(`conversation_${conversationId}`).emit('onlineUsers', payload);
    this.server.to(`conversation_${conversationId}`).emit('onlineUserIds', payload);
  }

  /** Check if a user is currently connected to the chat gateway (any socket) */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
  }

  /** Get list of globally connected user IDs */
  getConnectedUserIds(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  private extractToken(client: Socket): string | null {
    if (client.handshake.auth?.token) {
      return client.handshake.auth.token.replace('Bearer ', '');
    }
    if (client.handshake.query?.token) {
      return (client.handshake.query.token as string).replace('Bearer ', '');
    }
    const cookieHeader = client.handshake.headers.cookie;
    if (cookieHeader) {
      const match = cookieHeader.match(/accessToken=([^;]+)/);
      if (match) {
        return match[1];
      }
    }
    return null;
  }
}
