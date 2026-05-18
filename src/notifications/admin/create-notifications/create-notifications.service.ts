import { Injectable } from "@nestjs/common";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { NotificationsService } from "../../../notifications/services/notifications.service";

@Injectable()
export class CreateNotificationsService {
  constructor(private notificationsService: NotificationsService) {}

  async createNotification(userId: string, dto: CreateNotificationDto) {
    return this.notificationsService.createNotification(userId, dto);
  }
}
