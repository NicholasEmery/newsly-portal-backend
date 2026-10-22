import { Module } from "@nestjs/common";
import { GetUsersModule } from "./get-users/get-users.module";
import { UpdateUsersModule } from "./update-users/update-users.module";
import { DeleteUsersModule } from "./delete-users/delete-users.module";

@Module({
  imports: [GetUsersModule, UpdateUsersModule, DeleteUsersModule],
})
export class UsersModule {}