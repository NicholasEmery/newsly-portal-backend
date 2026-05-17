import { Injectable } from "@nestjs/common";
import { NotificationsService } from "../../../notifications/services/notifications.service";

@Injectable()
export class AdminGetNotificationsService {
  constructor(private notificationsService: NotificationsService) {}

  // Para admins, talvez ver todas as notificações ou algo, mas por enquanto similar
  async getAllNotifications(since?: Date, limit = 20, onlyUnread = false) {
    // Implementar lógica para admins verem todas
    // Por enquanto, placeholder
    return [];
  }
}
