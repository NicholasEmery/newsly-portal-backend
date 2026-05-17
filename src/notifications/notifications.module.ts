import { Module } from "@nestjs/common";
import { NotificationsService } from "./services/notifications.service";
import { PrismaModule } from "../database/prisma.module";
import { GetNotificationsModule } from "./get-notifications/get-notifications.module";
import { CreateNotificationsModule } from "./admin/create-notifications/create-notifications.module";
import { AdminGetNotificationsModule } from "./admin/get-notifications/get-notifications.module";
import { UpdateNotificationsModule } from "./admin/update-notifications/update-notifications.module";
import { DeleteNotificationsModule } from "./admin/delete-notifications/delete-notifications.module";

@Module({
  imports: [
    PrismaModule,
    // GetNotificationsModule,
    // CreateNotificationsModule,
    // AdminGetNotificationsModule,
    // UpdateNotificationsModule,
    // DeleteNotificationsModule,
  ],
  // providers: [NotificationsService],
  // exports: [NotificationsService],
})
export class NotificationsModule {}
