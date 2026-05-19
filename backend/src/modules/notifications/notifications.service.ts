import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationPriority } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async getUserNotifications(userId: string, limit: number = 20, unreadOnly: boolean = false): Promise<Notification[]> {
    const where: any = { userId };
    if (unreadOnly) {
      where.isRead = false;
    }
    return this.notificationRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  async markAsRead(notificationId: string, userId: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });
    if (!notification) {
      throw new NotFoundException('Notification not found');
    }
    notification.isRead = true;
    return this.notificationRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true },
    );
  }

  async deleteNotification(notificationId: string, userId: string): Promise<void> {
    const result = await this.notificationRepository.delete({ id: notificationId, userId });
    if (result.affected === 0) {
      throw new NotFoundException('Notification not found');
    }
  }

  async createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    priority?: NotificationPriority;
    actionUrl?: string;
    icon?: string;
    metadata?: Record<string, any>;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId: data.userId,
      title: data.title,
      message: data.message,
      type: data.type || NotificationType.SYSTEM,
      priority: data.priority || NotificationPriority.MEDIUM,
      actionUrl: data.actionUrl,
      icon: data.icon,
      metadata: data.metadata,
    });
    return this.notificationRepository.save(notification);
  }

  async createSystemNotification(userId: string, title: string, message: string): Promise<Notification> {
    return this.createNotification({ userId, title, message, type: NotificationType.SYSTEM });
  }

  async createAcademicNotification(userId: string, title: string, message: string, actionUrl?: string): Promise<Notification> {
    return this.createNotification({ userId, title, message, type: NotificationType.ACADEMIC, actionUrl });
  }

  async createReminderNotification(userId: string, title: string, message: string, actionUrl?: string): Promise<Notification> {
    return this.createNotification({ userId, title, message, type: NotificationType.REMINDER, actionUrl });
  }
}
