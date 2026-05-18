import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthController } from "./auth.controller";
import { PrismaModule } from "../database/prisma.module";
import { GoogleModule } from "./google/google.module";
import { LocalModule } from "./local/local.module";
import { TokensService } from "./tokens.service";
import { TokenHelper } from "./util/generateTokens";
import { AuthGuard } from "../common/guards/auth.guard";
import { RolesGuard } from "../common/guards/roles.guard";
import { CreateUsersModule } from "../users/create-users/create-users.module";

@Module({
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
    }),
    GoogleModule,
    LocalModule,
    CreateUsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthGuard, RolesGuard, TokensService, TokenHelper],
  exports: [AuthGuard, RolesGuard, TokensService, JwtModule],
})
export class AuthModule {}
