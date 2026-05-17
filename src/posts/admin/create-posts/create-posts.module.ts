// Importações para o módulo de criação de posts
// Module: Decorator para módulo
import { Module } from "@nestjs/common";
// CreatePostsController: Controlador
import { CreatePostsController } from "./create-posts.controller";
// CreatePostsService: Serviço
import { CreatePostsService } from "./create-posts.service";
// PrismaModule: Módulo do banco
import { PrismaModule } from "../../../database/prisma.module";
import { UploadsService } from "src/common/services/upload/uploads.service";

// Classe CreatePostsModule: Módulo para criação de posts
// Providers: CreatePostsService
// Controllers: CreatePostsController
// Imports: PrismaModule
@Module({
  imports: [PrismaModule],
  controllers: [CreatePostsController],
  providers: [CreatePostsService, UploadsService],
  exports: [CreatePostsService],
})
export class CreatePostsModule {}
