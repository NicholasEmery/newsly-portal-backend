import { Injectable } from "@nestjs/common";
import type { Notification } from "@generated/prisma/client";
import { NotificationsService } from "../../../notifications/services/notifications.service";

@Injectable()
export class AdminGetNotificationsService {
  constructor(private notificationsService: NotificationsService) {}

  // Para admins, talvez ver todas as notificações ou algo, mas por enquanto similar
  getAllNotifications(_since?: Date, _limit = 20, _onlyUnread = false): Promise<Notification[]> {
    return [];
  }
}
