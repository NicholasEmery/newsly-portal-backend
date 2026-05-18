import { Module } from "@nestjs/common";
import { GetUsersController } from "./get-users.controller";
import { GetUsersService } from "./get-users.service";
import { PrismaModule } from "../../database/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [GetUsersController],
  // providers: [GetUsersService],
  exports: [GetUsersService],
})
export class GetUsersModule {}
