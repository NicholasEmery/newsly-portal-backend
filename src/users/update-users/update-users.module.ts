import { Module } from "@nestjs/common";
import { UpdateUsersService } from "./update-users.service";
import { UpdateUsersController } from "./update-users.controller";
import { PrismaModule } from "../../database/prisma.module";
import { TokenHelper } from "../../auth/util/generateTokens";

@Module({
  imports: [PrismaModule],
  controllers: [UpdateUsersController],
  providers: [UpdateUsersService, TokenHelper],
  exports: [UpdateUsersService],
})
export class UpdateUsersModule {}
