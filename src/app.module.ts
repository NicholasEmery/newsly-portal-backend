// Importações para o módulo raiz
// Module: Decorator para definir módulo
import { CacheModule } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
// ConfigModule: Para configuração global (env vars)
import { ConfigModule } from "@nestjs/config";
// CacheModule: Para cache com Redis
import * as redisStore from "cache-manager-redis-store";
// AuthModule: Módulo de autenticação
import { AuthModule } from "./auth/auth.module";
// UsersModule: Módulo de usuários (removido - agora apenas pasta organizacional)
// import { UsersModule } from "./users/users.module";
// PrismaModule: Módulo para Prisma ORM
import { SystemModule } from "./common/system/system.module";
import { PrismaModule } from "./database/prisma.module";

@Module({
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
