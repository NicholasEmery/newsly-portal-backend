// Importações para o módulo raiz
// Module: Decorator para definir módulo
import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
// ConfigModule: Para configuração global (env vars)
import { ConfigModule } from "@nestjs/config";
// CacheModule: Para cache com Redis
import { APP_GUARD } from "@nestjs/core";
import * as redisStore from "cache-manager-redis-store";
// AuthModule: Módulo de autenticação
import { AuthModule } from "./auth/auth.module";
// UsersModule: Módulo de usuários (removido - agora apenas pasta organizacional)
// import { UsersModule } from "./users/users.module";
// PrismaModule: Módulo para Prisma ORM
import { RolesGuard } from "./common/guards/roles.guard";
import { SystemModule } from "./common/system/system.module";
import { PrismaModule } from "./database/prisma.module";
// APP_GUARD: Para registrar guards globais
// RolesGuard: Guard global para verificação de roles
// SystemModule: Módulo para health check e readiness

// Classe AppModule: Módulo raiz da aplicação NestJS
// Define imports globais, controllers e providers
// Caso de uso: Organiza toda a aplicação
@Module({
  // imports: Módulos importados (Auth, Prisma, Config global, Cache com Redis)
  imports: [
    AuthModule,
    PrismaModule,
    SystemModule,
    ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),
    CacheModule.register({
      store: redisStore,
      host: process.env.REDIS_HOST,
      port: process.env.REDIS_PORT,
      ttl: 600, // 10 minutos padrão
      isGlobal: true,
    }),
    // PostsModule,
    // NotificationsModule,
  ],
})
export class AppModule {}
