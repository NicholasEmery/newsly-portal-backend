import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { AdminGetNotificationsService } from "./get-notifications.service";
import { Roles } from "../../../common/decorators/roles.decorator";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";

@Controller("admin/notifications")
@UseGuards(AuthGuard, RolesGuard)
@ApiTags("Notifications")
export class AdminGetNotificationsController {
  constructor(private adminGetNotificationsService: AdminGetNotificationsService) {}

  @Get()
  @Roles("ADMIN")
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Listar notificações administrativas",
    description: "Retorna todas as notificações com filtros administrativos de data e leitura.",
  })
  @ApiQuery({ name: "since", required: false, example: "2026-06-01T00:00:00.000Z" })
  @ApiQuery({ name: "limit", required: false, example: 20 })
  @ApiQuery({ name: "onlyUnread", required: false, example: false })
  @ApiOkResponse({
    description: "Lista administrativa de notificações.",
    schema: {
      example: [
        {
          id: "notification-uuid-1",
          title: "Novo post publicado",
          body: "Seu post foi publicado com sucesso.",
          read: false,
        },
      ],
    },
  })
  async getAll(@Query("since") since?: string, @Query("limit") limit = 20, @Query("onlyUnread") onlyUnread = false) {
    const sinceDate = since ? new Date(since) : undefined;
    return this.adminGetNotificationsService.getAllNotifications(sinceDate, +limit, Boolean(onlyUnread));
  }
}
