import { Controller, Post, Body, UseGuards, Request } from "@nestjs/common";
import { CreateNotificationsService } from "./create-notifications.service";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { Roles } from "../../../common/decorators/roles.decorator";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { AuthenticatedRequest } from "../../../common/interfaces/auth.interface";

@Controller("notifications")
@UseGuards(AuthGuard, RolesGuard)
export class CreateNotificationsController {
  constructor(private createNotificationsService: CreateNotificationsService) {}

  @Post()
  @Roles("ADMIN")
  async create(@Request() req: AuthenticatedRequest, @Body() dto: CreateNotificationDto) {
    return this.createNotificationsService.createNotification(req.user.id, dto);
  }
}
