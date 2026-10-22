// Importações para o módulo de criação de notificações
import { Module } from "@nestjs/common";
import { CreateNotificationsController } from "./create-notifications.controller";
import { CreateNotificationsService } from "./create-notifications.service";
import { NotificationsCoreModule } from "../../notifications-core.module";

@Module({
  imports: [NotificationsCoreModule],
  controllers: [CreateNotificationsController],
  providers: [CreateNotificationsService],
  exports: [CreateNotificationsService],
})
export class CreateNotificationsModule {}
