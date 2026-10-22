// Importações para o módulo de obtenção de notificações
// Module: Decorator para módulo
import { Module } from "@nestjs/common";
// GetNotificationsController: Controlador
import { GetNotificationsController } from "./get-notifications.controller";
// GetNotificationsService: Serviço
import { GetNotificationsService } from "./get-notifications.service";
import { NotificationsCoreModule } from "../notifications-core.module";

@Module({
  imports: [NotificationsCoreModule],
  controllers: [GetNotificationsController],
  providers: [GetNotificationsService],
  exports: [GetNotificationsService],
})
export class GetNotificationsModule {}
