import { Injectable } from "@nestjs/common";
import type { Notification } from "@generated/prisma/client";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { NotificationsService } from "../../../notifications/services/notifications.service";

@Injectable()
export class CreateNotificationsService {
  constructor(private notificationsService: NotificationsService) {}

  async createNotification(userId: string, dto: CreateNotificationDto): Promise<Notification> {
    return this.notificationsService.createNotification(userId, dto);
  }
}
