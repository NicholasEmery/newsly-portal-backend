import { Module } from "@nestjs/common";
import { UpdateUsersController } from "./update-users.controller";
import { UpdateUsersService } from "./update-users.service";
import { TokenHelper } from "../../auth/util/generateTokens";
import { PrismaModule } from "../../database/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [UpdateUsersController],
  providers: [UpdateUsersService, TokenHelper],
  exports: [UpdateUsersService],
})
export class UpdateUsersModule {}
