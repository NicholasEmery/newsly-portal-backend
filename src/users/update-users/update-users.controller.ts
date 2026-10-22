import { Body, Controller, Param, Put } from "@nestjs/common";
import { ApiBody, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUsersService } from "./update-users.service";

@Controller("users")
@ApiTags("Users")
export class UpdateUsersController {
  constructor(private readonly updateUsersService: UpdateUsersService) {}

  @Put(":id")
  @ApiOperation({
    summary: "Atualizar usuário",
    description: "Atualiza os campos permitidos de um usuário existente.",
  })
  @ApiParam({ name: "id", example: "550e8400-e29b-41d4-a716-446655440000" })
  @ApiBody({ type: UpdateUserDto })
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.updateUsersService.updateUser({ id, ...dto });
  }
}
