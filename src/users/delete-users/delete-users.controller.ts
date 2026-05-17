import { Controller, Delete, Param, Req, UseGuards } from "@nestjs/common";
import { DeleteUsersService } from "./delete-users.service";
import { AuthGuard } from "../../common/guards/auth.guard";
import { RolesGuard } from "src/common/guards/roles.guard";
import { Roles } from "src/common/decorators/roles.decorator";
import { Role } from "@generated/prisma/enums";
import { AuthenticatedRequest } from "src/common/interfaces/auth.interface";

@Controller("users")
@UseGuards(AuthGuard, RolesGuard)
export class DeleteUsersController {
  constructor(private readonly deleteUsersService: DeleteUsersService) {}

  @Delete("delete/:email")
  @Roles(Role.ADMIN)
  async delete(@Param("email") email: string) {
    await this.deleteUsersService.deleteUser(email);
    return { message: "User deleted" };
  }

  @Delete("delete/my-account")
  async deleteMyAccount(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;

    await this.deleteUsersService.deleteAccount(userId);
    return { message: "User deleted" };
  }
}
