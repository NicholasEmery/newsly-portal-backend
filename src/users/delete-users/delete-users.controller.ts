import { Role } from "@generated/prisma/enums";
import { Controller, Delete, Param, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { Roles } from "src/common/decorators/roles.decorator";
import { RolesGuard } from "src/common/guards/roles.guard";
import { AuthenticatedRequest } from "src/common/interfaces/auth.interface";
import { DeleteUsersService } from "./delete-users.service";
import { AuthGuard } from "../../common/guards/auth.guard";

@Controller("users")
@UseGuards(AuthGuard, RolesGuard)
@ApiTags("Users")
export class DeleteUsersController {
  constructor(private readonly deleteUsersService: DeleteUsersService) {}

  @Delete("delete/:email")
  @Roles(Role.ADMIN)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Excluir usuário por email",
    description: "Rota administrativa para remover uma conta pelo email cadastrado.",
  })
  @ApiParam({ name: "email", example: "nicholas@example.com" })
  async delete(@Param("email") email: string) {
    await this.deleteUsersService.deleteUser(email);
    return { message: "User deleted" };
  }

  @Delete("delete/my-account")
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Excluir a própria conta",
    description: "Remove a conta do usuário autenticado usando o identificador presente no JWT.",
  })
  async deleteMyAccount(@Req() req: AuthenticatedRequest) {
    const userId = req.user.id;

    await this.deleteUsersService.deleteAccount(userId);
    return { message: "User deleted" };
  }
}
