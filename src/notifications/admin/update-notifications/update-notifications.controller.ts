import { Controller, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { UpdateNotificationsService } from "./update-notifications.service";
import { Roles } from "../../../common/decorators/roles.decorator";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";

@Controller("notifications")
@UseGuards(AuthGuard, RolesGuard)
@ApiTags("Notifications")
export class UpdateNotificationsController {
  constructor(private updateNotificationsService: UpdateNotificationsService) {}

  @Post(":id/mark-read")
  @Roles("ADMIN")
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Marcar notificação como lida (admin)",
    description: "Endpoint administrativo para marcar uma notificação como lida.",
  })
  @ApiParam({ name: "id", example: "notification-uuid-1" })
  markRead(@Param("id") _id: string) {
    return { message: "Marked as read" };
  }
}
