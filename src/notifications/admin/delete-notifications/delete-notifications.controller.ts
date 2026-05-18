import { Controller, Delete, Param, UseGuards } from "@nestjs/common";
import { DeleteNotificationsService } from "./delete-notifications.service";
import { Roles } from "../../../common/decorators/roles.decorator";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";

@Controller("notifications")
@UseGuards(AuthGuard, RolesGuard)
export class DeleteNotificationsController {
  constructor(private deleteNotificationsService: DeleteNotificationsService) {}

  @Delete(":id")
  @Roles("ADMIN")
  async delete(@Param("id") id: string) {
    // Para admin, deletar qualquer notificação
    await this.deleteNotificationsService.deleteNotification("", id); // Ajustar
    return { message: "Deleted" };
  }
}
