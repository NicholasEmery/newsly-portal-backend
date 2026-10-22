import { Module } from "@nestjs/common";
// ConfigModule: Para configuração global (env vars)
import { ConfigModule } from "@nestjs/config";
// AuthModule: Módulo de autenticação
import { AuthModule } from "./auth/auth.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { PostsModule } from "./posts/posts.module";
import { UsersModule } from "./users/users.module";
// PrismaModule: Módulo para Prisma ORM
import { SystemModule } from "./common/system/system.module";
import { PrismaModule } from "./database/prisma.module";
import { RedisCacheModule } from "./common/services/cache/redis-cache.module";

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    SystemModule,
    RedisCacheModule,
    UsersModule,
    PostsModule,
    NotificationsModule,
    ConfigModule.forRoot({ envFilePath: ".env", isGlobal: true }),
  ],
})
export class AppModule {}
