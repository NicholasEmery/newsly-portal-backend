// Importações para o módulo
// Module: Decorator do NestJS para definir um módulo
import { Module } from "@nestjs/common";
// CreateUsersService: Serviço para lógica de criação de usuários
// PrismaModule: Módulo que fornece PrismaService para acesso ao banco
// JwtModule: Para geração de tokens JWT
import { JwtModule } from "@nestjs/jwt";
import { UploadsService } from "src/common/services/upload/uploads.service";
import { CreateUsersService } from "./create-users.service";
import { TokensService } from "../../auth/tokens.service";
import { TokenHelper } from "../../auth/util/generateTokens";
import { PrismaModule } from "../../database/prisma.module";

// Classe CreateUsersModule: Módulo NestJS para funcionalidades de criação de usuários
// Define dependências, controllers e providers
// Casos de uso: Organiza e encapsula lógica relacionada à criação de usuários
@Module({
  // imports: Módulos necessários (PrismaModule para injeção de PrismaService, JwtModule para tokens)
  imports: [
    PrismaModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "15m" },
    }),
  ],
  providers: [CreateUsersService, UploadsService, TokensService, TokenHelper],
  exports: [CreateUsersService, UploadsService, TokensService, TokenHelper],
})
export class CreateUsersModule {}
