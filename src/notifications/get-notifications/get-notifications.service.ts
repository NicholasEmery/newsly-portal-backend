import { Injectable } from "@nestjs/common";
import { NotificationsService } from "../services/notifications.service";

@Injectable()
export class GetNotificationsService {
  constructor(private notificationsService: NotificationsService) {}
  async getNotifications(userId: string, since?: Date, limit = 20, onlyUnread = false) {
    return this.notificationsService.getNotifications(userId, since, limit, onlyUnread);
  }

  async markAsRead(userId: string, id: string) {
    return this.notificationsService.markAsRead(userId, id);
  }

  async getUnreadCount(userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }
}
