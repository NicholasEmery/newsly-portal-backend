import { Module } from "@nestjs/common";
import { DeleteUsersService } from "./delete-users.service";
import { DeleteUsersController } from "./delete-users.controller";
import { PrismaModule } from "../../database/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [DeleteUsersController],
  providers: [DeleteUsersService],
  exports: [DeleteUsersService],
})
export class DeleteUsersModule {}
