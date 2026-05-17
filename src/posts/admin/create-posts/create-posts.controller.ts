// Importações para o controller de criação de posts
// Controller: Decorator para controlador
import { Controller, Post, Body, UseGuards, Request, Param, Patch, Req, HttpCode } from "@nestjs/common";
// AuthGuard: Guarda de autenticação
import { AuthGuard } from "../../../common/guards/auth.guard";
// RolesGuard: Guarda de roles
import { RolesGuard } from "../../../common/guards/roles.guard";
// Roles: Decorator para roles
import { Roles } from "../../../common/decorators/roles.decorator";
// CreatePostDto: DTO para criação
import { CreatePostDto } from "./dto/create-post.dto";
// CreatePostsService: Serviço de criação
import { CreatePostsService } from "./create-posts.service";
// Role: Enum de roles
import { Role } from "@generated/prisma/enums";
import { AuthenticatedRequest } from "src/common/interfaces/auth.interface";
// Classe CreatePostsController: Controlador para criação de posts
// Rotas: POST /posts (criar), PATCH /posts/creation/:id/approve (aprovar), PATCH /posts/creation/:id/reject (rejeitar)
// Caso de uso: Usuários criando posts, admins aprovando/rejeitando
@Controller("posts")
@UseGuards(AuthGuard, RolesGuard)
export class CreatePostsController {
  // Construtor: Injeta CreatePostsService
  constructor(private readonly createPostsService: CreatePostsService) {}

  // Rota: POST /posts
  // Descrição: Cria um post pendente
  // Roles: Creator
  // Exemplo: POST /posts { title, content }
  @Post()
  @HttpCode(201)
  @Roles(Role.ADMIN, Role.CREATOR)
  async createPost(
    @Request() req: AuthenticatedRequest,
    @Body() body: CreatePostDto,
  ): Promise<{ statusCode: number; message: string; postId?: string; requestId?: string }> {
    const userId = req.user.id;
    const roleUser = req.user.role;

    const result = await this.createPostsService.createPost(userId, body, roleUser);

    return result;
  }
}
