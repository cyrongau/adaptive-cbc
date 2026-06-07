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
import { Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { ConfigService } from '@nestjs/config';

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

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      if (!token) {
        this.logger.warn(`No token provided for connection client ${client.id}`);
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET', 'cbc_jwt_secret_key_2024_adaptive'),
      });

      const user = await this.usersService.findOne(payload.sub);
      if (!user || !user.isActive) {
        this.logger.warn(`User for client ${client.id} is inactive or not found`);
        client.disconnect();
        return;
      }

      client.data.user = user;
      client.join(`user_${user.id}`);
      this.logger.log(`Socket client connected: ${user.email} (${client.id})`);
    } catch (err) {
      this.logger.error(`Socket connection error for client ${client.id}: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Socket client disconnected: ${client.id}`);
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
    this.server.to(`conversation_${conversationId}`).emit('messageReceived', chatMessage);

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
