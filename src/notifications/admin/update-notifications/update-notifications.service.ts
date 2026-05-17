import { Injectable } from "@nestjs/common";
import { NotificationsService } from "../../../notifications/services/notifications.service";

@Injectable()
export class UpdateNotificationsService {
  constructor(private notificationsService: NotificationsService) {}

  async markAsRead(userId: string, id: string) {
    return this.notificationsService.markAsRead(userId, id);
  }
}
