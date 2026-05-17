import { Controller, Post, Param, UseGuards } from "@nestjs/common";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { Roles } from "../../../common/decorators/roles.decorator";
import { UpdateNotificationsService } from "./update-notifications.service";

@Controller("notifications")
@UseGuards(AuthGuard, RolesGuard)
export class UpdateNotificationsController {
  constructor(private updateNotificationsService: UpdateNotificationsService) {}

  @Post(":id/mark-read")
  @Roles("ADMIN")
  async markRead(@Param("id") id: string) {
    // Para admin, talvez marcar sem userId, ou com userId do admin
    // Por enquanto, placeholder
    return { message: "Marked as read" };
  }
}
