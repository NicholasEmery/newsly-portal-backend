import { Controller, Get, Param, Post, Query, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { GetNotificationsService } from "./get-notifications.service";
import { AuthGuard } from "../../common/guards/auth.guard";
import { AuthenticatedRequest } from "../../common/interfaces/auth.interface";

@Controller("notifications")
@UseGuards(AuthGuard)
@ApiTags("Notifications")
export class GetNotificationsController {
  constructor(private getNotificationsService: GetNotificationsService) {}

  @Get()
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Listar notificações do usuário",
    description: "Retorna notificações filtradas por data, limite e leitura.",
  })
  @ApiQuery({ name: "since", required: false, example: "2026-06-01T00:00:00.000Z" })
  @ApiQuery({ name: "limit", required: false, example: 20 })
  @ApiQuery({ name: "onlyUnread", required: false, example: false })
  @ApiOkResponse({
    description: "Lista de notificações.",
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
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Marcar notificação como lida",
    description: "Atualiza a notificação especificada como lida para o usuário autenticado.",
  })
  @ApiParam({ name: "id", example: "notification-uuid-1" })
  @ApiOkResponse({
    description: "URL ou identificador retornado pelo serviço ao marcar como lida.",
    schema: {
      example: { url: true },
    },
  })
  async markRead(@Request() req: AuthenticatedRequest, @Param("id") id: string) {
    return { url: await this.getNotificationsService.markAsRead(req.user.id, id) };
  }

  @Get("unread/count")
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Contar notificações não lidas",
    description: "Retorna a quantidade de notificações ainda não lidas do usuário autenticado.",
  })
  @ApiOkResponse({
    description: "Contagem de notificações não lidas.",
    schema: {
      example: { count: 3 },
    },
  })
  async getUnreadCount(@Request() req: AuthenticatedRequest) {
    return { count: await this.getNotificationsService.getUnreadCount(req.user.id) };
  }
}
