// Importações para o módulo de exclusão de posts
// Module: Decorator para módulo
import { Module } from "@nestjs/common";
// DeletePostsController: Controlador
import { DeletePostsController } from "./delete-posts.controller";
// DeletePostsService: Serviço (usar GetPostsService ou criar)
// PrismaModule: Módulo do banco
import { PrismaModule } from "../../../database/prisma.module";

// Classe DeletePostsModule: Módulo para exclusão de posts
// Controllers: DeletePostsController
// Imports: PrismaModule
@Module({
  imports: [PrismaModule],
  controllers: [DeletePostsController],
})
export class DeletePostsModule {}
