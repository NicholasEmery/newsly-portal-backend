import { Injectable } from "@nestjs/common";
import { NotificationsService } from "../../../notifications/services/notifications.service";
import { CreateNotificationDto } from "./dto/create-notification.dto";

@Injectable()
export class CreateNotificationsService {
  constructor(private notificationsService: NotificationsService) {}

  async createNotification(userId: string, dto: CreateNotificationDto) {
    return this.notificationsService.createNotification(userId, dto);
  }
}
