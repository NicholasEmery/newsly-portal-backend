// Importações para o módulo de obtenção de notificações para admin
import { Module } from "@nestjs/common";
import { AdminGetNotificationsController } from "./get-notifications.controller";
import { AdminGetNotificationsService } from "./get-notifications.service";
import { NotificationsModule } from "../../notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [AdminGetNotificationsController],
  providers: [AdminGetNotificationsService],
  exports: [AdminGetNotificationsService],
})
export class AdminGetNotificationsModule {}
