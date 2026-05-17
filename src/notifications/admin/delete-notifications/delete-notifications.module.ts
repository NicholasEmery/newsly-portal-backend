// Importações para o módulo de exclusão de notificações
import { Module } from "@nestjs/common";
import { DeleteNotificationsController } from "./delete-notifications.controller";
import { DeleteNotificationsService } from "./delete-notifications.service";
import { NotificationsModule } from "../../notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [DeleteNotificationsController],
  providers: [DeleteNotificationsService],
  exports: [DeleteNotificationsService],
})
export class DeleteNotificationsModule {}
