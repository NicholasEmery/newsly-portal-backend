import { NotificationType } from "@generated/prisma/enums";
import { Injectable, ForbiddenException } from "@nestjs/common";
import type { Notification } from "@generated/prisma/client";
import { PrismaService } from "../../database/prisma.service";
import { CreateNotificationDto } from "../admin/create-notifications/dto/create-notification.dto";

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(adminId: string, notificationInfo: CreateNotificationDto): Promise<Notification> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 5); // Default 5 days expiry

    let recipients: string[] = [];
    if (notificationInfo.recipientsType === NotificationType.ALL) {
      // não adc nenhum user porque aqui sera para todos os users e quando é para todos não precisamos verificar se eles leram ou não, porque se não o campo recipents ficaria gigante
    } else if (notificationInfo.recipientsType === NotificationType.POST_ALL) {
      // Buscar todos os colaboradores de posts
      if (!notificationInfo.postId) {
        throw new ForbiddenException("Post ID is required for POST_ALL notifications");
      }
      const post = await this.prisma.post.findUnique({
        where: { id: notificationInfo.postId },
        include: { collaborators: true, creator: true },
      });
      if (!post) {
        throw new ForbiddenException("Post not found");
      }
      recipients = [post.creatorId, ...post.collaborators.map((c) => c.userId)];
    } else if (notificationInfo.recipientsType === NotificationType.POST_COLLABORATORS) {
      // Buscar apenas os colaboradores de posts
      if (!notificationInfo.postId) {
        throw new ForbiddenException("Post ID is required for POST_COLLABORATORS notifications");
      }
      const post = await this.prisma.post.findUnique({
        where: { id: notificationInfo.postId },
        include: { collaborators: true },
      });
      if (!post) {
        throw new ForbiddenException("Post not found");
      }
      recipients = post.collaborators.map((c) => c.userId);
    } else if (notificationInfo.recipientsType === NotificationType.USERS) {
      if (!notificationInfo.recipients || notificationInfo.recipients.length === 0) {
        throw new ForbiddenException("Recipients are required for USERS notifications");
      }
      recipients = notificationInfo.recipients;
    }

    const notification = await this.prisma.notification.create({
      data: {
        title: notificationInfo.title,
        body: notificationInfo.body,
        imageUrl: notificationInfo.imageUrl,
        linkUrl: notificationInfo.linkUrl,
        recipientsType: notificationInfo.recipientsType,
        recipients: recipients,
        expiresAt,
      },
    });

    return notification;
  }

  async getNotifications(userId: string, since?: Date, limit = 20, onlyUnread = false) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const readNotifications = user?.readNotifications ?? [];

    const where: {
      expiresAt: { gt: Date };
      OR: Array<{ recipientsType: NotificationType } | { recipients: { has: string } }>;
      createdAt?: { gt: Date };
      id?: { notIn: string[] };
    } = {
      expiresAt: { gt: new Date() },
      OR: [{ recipientsType: NotificationType.ALL }, { recipients: { has: userId } }],
    };

    if (since) where.createdAt = { gt: since };
    if (onlyUnread) where.id = { notIn: readNotifications };

    const notifications = await this.prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return notifications;
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notification) {
      throw new ForbiddenException("Notification not found");
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        readNotifications: { push: notificationId },
      },
    });

    return true;
  }

  async getUnreadCount(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const readNotifications = user?.readNotifications ?? [];

    return this.prisma.notification.count({
      where: {
        expiresAt: { gt: new Date() },
        AND: [{ id: { notIn: readNotifications } }],
        OR: [{ recipientsType: NotificationType.ALL }, { recipients: { has: userId } }],
      },
    });
  }

  async deleteNotification(userId: string, notificationId: string) {
    // Mark the notification as read/removed for this user by adding to their readNotifications
    await this.prisma.user.update({
      where: { id: userId },
      data: { readNotifications: { push: notificationId } },
    });
  }

  // Helper to send notification for new post
  async notifyNewPost(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { creator: true, collaborators: { include: { user: true } } },
    });
    if (!post) return;

    const recipients = [post.creatorId, ...post.collaborators.map((c) => c.userId)];

    await this.prisma.notification.create({
      data: {
        title: "Novo post publicado",
        body: `O post "${post.title}" foi publicado.`,
        linkUrl: `/posts/${postId}`,
        recipientsType: NotificationType.USERS,
        recipients,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });
  }
}
