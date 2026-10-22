import { Body, Controller, Post, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from "@nestjs/swagger";
import { CreateNotificationsService } from "./create-notifications.service";
import { CreateNotificationDto } from "./dto/create-notification.dto";
import { Roles } from "../../../common/decorators/roles.decorator";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { AuthenticatedRequest } from "../../../common/interfaces/auth.interface";
import type { Notification } from "@generated/prisma/client";

@Controller("notifications")
@UseGuards(AuthGuard, RolesGuard)
@ApiTags("Notifications")
export class CreateNotificationsController {
  constructor(private createNotificationsService: CreateNotificationsService) {}

  @Post()
  @Roles("ADMIN")
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Criar notificação",
    description: "Cria uma notificação para um conjunto de usuários, todos os usuários ou leitores de um post.",
  })
  @ApiBody({
    type: CreateNotificationDto,
    examples: {
      default: {
        summary: "Notificação para usuários específicos",
        value: {
          title: "Nova atualização disponível",
          body: "Há novidades na plataforma.",
          imageUrl: "https://cdn.example.com/notifications/banner.png",
          linkUrl: "https://newsly.example.com/updates",
          recipientsType: "USERS",
          recipients: ["user-uuid-1", "user-uuid-2"],
          postId: "post-uuid-1",
        },
      },
    },
  })
  async create(@Request() req: AuthenticatedRequest, @Body() dto: CreateNotificationDto): Promise<Notification> {
    return this.createNotificationsService.createNotification(req.user.id, dto);
  }
}
