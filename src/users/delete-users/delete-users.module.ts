import { Module } from "@nestjs/common";
import { DeleteUsersController } from "./delete-users.controller";
import { DeleteUsersService } from "./delete-users.service";
import { PrismaModule } from "../../database/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [DeleteUsersController],
  providers: [DeleteUsersService],
  exports: [DeleteUsersService],
})
export class DeleteUsersModule {}
