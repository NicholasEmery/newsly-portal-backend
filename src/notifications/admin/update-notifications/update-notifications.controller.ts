import { Controller, Post, Param, UseGuards } from "@nestjs/common";
import { UpdateNotificationsService } from "./update-notifications.service";
import { Roles } from "../../../common/decorators/roles.decorator";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";

@Controller("notifications")
@UseGuards(AuthGuard, RolesGuard)
export class UpdateNotificationsController {
  constructor(private updateNotificationsService: UpdateNotificationsService) {}

  @Post(":id/mark-read")
  @Roles("ADMIN")
  markRead(@Param("id") _id: string) {
    return { message: "Marked as read" };
  }
}
