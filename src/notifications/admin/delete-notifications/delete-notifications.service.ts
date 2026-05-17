import { Injectable } from "@nestjs/common";
import { NotificationsService } from "../../../notifications/services/notifications.service";

@Injectable()
export class DeleteNotificationsService {
  constructor(private notificationsService: NotificationsService) {}

  async deleteNotification(userId: string, id: string) {
    return this.notificationsService.deleteNotification(userId, id);
  }
}
