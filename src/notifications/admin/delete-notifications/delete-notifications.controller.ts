import { Controller, Delete, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { DeleteNotificationsService } from "./delete-notifications.service";
import { Roles } from "../../../common/decorators/roles.decorator";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";

@Controller("notifications")
@UseGuards(AuthGuard, RolesGuard)
@ApiTags("Notifications")
export class DeleteNotificationsController {
  constructor(private deleteNotificationsService: DeleteNotificationsService) {}

  @Delete(":id")
  @Roles("ADMIN")
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Excluir notificação",
    description: "Remove uma notificação existente, normalmente usada por administradores.",
  })
  @ApiParam({ name: "id", example: "notification-uuid-1" })
  async delete(@Param("id") id: string) {
    // Para admin, deletar qualquer notificação
    await this.deleteNotificationsService.deleteNotification("", id); // Ajustar
    return { message: "Deleted" };
  }
}
