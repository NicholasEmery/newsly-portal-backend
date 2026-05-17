import { Injectable } from "@nestjs/common";

@Injectable()
export class GetNotificationsService {

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
