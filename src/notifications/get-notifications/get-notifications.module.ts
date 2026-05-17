// Importações para o módulo de obtenção de notificações
// Module: Decorator para módulo
import { Module } from "@nestjs/common";
// GetNotificationsController: Controlador
import { GetNotificationsController } from "./get-notifications.controller";
// GetNotificationsService: Serviço
import { GetNotificationsService } from "./get-notifications.service";
// NotificationsModule: Para injetar o serviço principal
import { NotificationsModule } from "../notifications.module";

@Module({
  imports: [NotificationsModule],
  controllers: [GetNotificationsController],
  providers: [GetNotificationsService],
  exports: [GetNotificationsService],
})
export class GetNotificationsModule {}
