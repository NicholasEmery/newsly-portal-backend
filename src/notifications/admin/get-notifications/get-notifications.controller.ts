import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { AdminGetNotificationsService } from "./get-notifications.service";
import { Roles } from "../../../common/decorators/roles.decorator";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";

@Controller("admin/notifications")
@UseGuards(AuthGuard, RolesGuard)
export class AdminGetNotificationsController {
  constructor(private adminGetNotificationsService: AdminGetNotificationsService) {}

  @Get()
  @Roles("ADMIN")
  async getAll(@Query("since") since?: string, @Query("limit") limit = 20, @Query("onlyUnread") onlyUnread = false) {
    const sinceDate = since ? new Date(since) : undefined;
    return this.adminGetNotificationsService.getAllNotifications(sinceDate, +limit, Boolean(onlyUnread));
  }
}
