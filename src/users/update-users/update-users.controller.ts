import { Controller, Put, Param, Body } from "@nestjs/common";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUsersService } from "./update-users.service";

@Controller("users")
export class UpdateUsersController {
  constructor(private readonly updateUsersService: UpdateUsersService) {}

  @Put(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateUserDto) {
    return this.updateUsersService.updateUser({ id, ...dto });
  }
}
