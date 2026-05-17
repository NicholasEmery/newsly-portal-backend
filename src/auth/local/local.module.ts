import { Module } from "@nestjs/common";
import { LocalService } from "./local.service";
import { LocalController } from "./local.controller";
import { PrismaModule } from "src/database/prisma.module";
import { CreateUsersModule } from "src/users/create-users/create-users.module";
import { CacheModule } from "@nestjs/cache-manager";
import { EmailService } from "src/common/services/email/email.service";
import { TokenHelper } from "../util/generateTokens";

@Module({
  imports: [PrismaModule, CreateUsersModule, CacheModule.register()],
  providers: [LocalService, TokenHelper, EmailService],
  controllers: [LocalController],
  exports: [LocalService],
})
export class LocalModule {}
