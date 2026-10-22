import { Module } from "@nestjs/common";
import { NotificationsCoreModule } from "./notifications-core.module";
import { GetNotificationsModule } from "./get-notifications/get-notifications.module";
import { CreateNotificationsModule } from "./admin/create-notifications/create-notifications.module";
import { UpdateNotificationsModule } from "./admin/update-notifications/update-notifications.module";
import { DeleteNotificationsModule } from "./admin/delete-notifications/delete-notifications.module";

@Module({
  imports: [NotificationsCoreModule, GetNotificationsModule, CreateNotificationsModule, UpdateNotificationsModule, DeleteNotificationsModule],
})
export class NotificationsModule {}
