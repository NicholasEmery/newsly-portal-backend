import { Controller, Put, Param, Body } from '@nestjs/common';
import { UpdateUsersService } from './update-users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
export class UpdateUsersController {
  constructor(private readonly updateUsersService: UpdateUsersService) {}

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.updateUsersService.updateUser({ id, ...dto });
  }
}