// Importações para o módulo de atualização de notificações
import { Module } from "@nestjs/common";
import { UpdateNotificationsController } from "./update-notifications.controller";
import { UpdateNotificationsService } from "./update-notifications.service";
import { NotificationsModule } from "../../notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [UpdateNotificationsController],
  providers: [UpdateNotificationsService],
  exports: [UpdateNotificationsService],
})
export class UpdateNotificationsModule {}
