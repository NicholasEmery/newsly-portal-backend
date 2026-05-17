import { Controller, Get, Post, Param, Query, UseGuards, Request } from "@nestjs/common";
import { AuthGuard } from "../../common/guards/auth.guard";
import { GetNotificationsService } from "./get-notifications.service";
import { AuthenticatedRequest } from "../../common/interfaces/auth.interface";

@Controller("notifications")
@UseGuards(AuthGuard)
export class GetNotificationsController {
  constructor(private getNotificationsService: GetNotificationsService) {}

  @Get()
  async get(
    @Request() req: AuthenticatedRequest,
    @Query("since") since?: string,
    @Query("limit") limit = 20,
    @Query("onlyUnread") onlyUnread = false,
  ) {
    const sinceDate = since ? new Date(since) : undefined;
    return this.getNotificationsService.getNotifications(req.user.id, sinceDate, +limit, Boolean(onlyUnread));
  }

  @Post(":id/mark-read")
  async markRead(@Request() req: AuthenticatedRequest, @Param("id") id: string) {
    return { url: await this.getNotificationsService.markAsRead(req.user.id, id) };
  }

  @Get("unread/count")
  async getUnreadCount(@Request() req: AuthenticatedRequest) {
    return { count: await this.getNotificationsService.getUnreadCount(req.user.id) };
  }
}
