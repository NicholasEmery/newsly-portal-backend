// Importações para o módulo de edição de posts
// Module: Decorator para módulo
import { Module } from "@nestjs/common";
// UpdatePostsController: Controlador
import { UpdatePostsController } from "./update-posts.controller";
// UpdatePostsService: Serviço
import { UpdatePostsService } from "./update-posts.service";
// PrismaModule: Módulo do banco
import { PrismaModule } from "../../../database/prisma.module";

// Classe UpdatePostsModule: Módulo para edição de posts
// Providers: UpdatePostsService
// Controllers: UpdatePostsController
// Imports: PrismaModule
@Module({
  imports: [PrismaModule],
  controllers: [UpdatePostsController],
  providers: [UpdatePostsService],
  exports: [UpdatePostsService],
})
export class UpdatePostsModule {}
