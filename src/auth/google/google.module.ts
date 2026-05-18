import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import { EmailService } from "src/common/services/email/email.service";
import { GoogleController } from "./google.controller";
import { GoogleService } from "./google.service";
import { GoogleOauthGuard } from "./guard/google-oauth.guard";
import { GoogleStrategy } from "./strategy/google.strategy";
import { PrismaModule } from "../../database/prisma.module";
import { CreateUsersModule } from "../../users/create-users/create-users.module";
import { TokenHelper } from "../util/generateTokens";

@Module({
  imports: [PrismaModule, CreateUsersModule, CacheModule.register()],
  providers: [GoogleStrategy, GoogleOauthGuard, GoogleService, TokenHelper, EmailService],
  controllers: [GoogleController],
  exports: [GoogleStrategy, GoogleOauthGuard, GoogleService],
})
export class GoogleModule {}
