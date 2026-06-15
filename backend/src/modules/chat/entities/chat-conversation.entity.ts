import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, OneToMany } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { ChatMessage } from './chat-message.entity';

export enum ConversationType {
  TEACHER_STUDENT = 'teacher_student',
  SUPPORT = 'support',
  ADMIN_INITIATED = 'admin_initiated',
  COMMUNITY = 'community',
  DIRECT = 'direct',
  AI_SOCRATIC = 'ai_socratic',
}

@Entity('chat_conversations')
export class ChatConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: ConversationType })
  type: ConversationType;

  @Column({ nullable: true })
  ticketId: string;

  @Column({ nullable: true })
  title: string;

  @ManyToMany(() => User)
  @JoinTable({ name: 'chat_conversation_participants' })
  participants: User[];

  @OneToMany(() => ChatMessage, (message) => message.conversation)
  messages: ChatMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
