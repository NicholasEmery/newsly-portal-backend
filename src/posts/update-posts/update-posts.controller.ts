// Importações para o controller de edição de posts
// Controller: Decorator para controlador
import { Role } from "@generated/prisma/enums";
import { Controller, Put, Body, UseGuards, Request, Param, Patch, Post } from "@nestjs/common";
// AuthGuard: Guarda de autenticação
import { Request as ExpressRequest } from "express";
import { UpdatePostDto } from "./dto/update-post.dto";
import { UpdatePostsService } from "./update-posts.service";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuthGuard } from "../../common/guards/auth.guard";
// RolesGuard: Guarda de roles
import { RolesGuard } from "../../common/guards/roles.guard";
// Roles: Decorator para roles
// UpdatePostDto: DTO para edição
// UpdatePostsService: Serviço de edição
// Role: Enum de roles
// Request: Interface para request

// Interface para request com user
interface AuthenticatedRequest extends ExpressRequest {
  user: { id: string };
}

// Classe UpdatePostsController: Controlador para edição de posts
// Rotas: PUT /posts/:id (editar diretamente), POST /posts/:id/request-edit (solicitar edição), PATCH /posts/editing/:id/approve (aprovar), PATCH /posts/editing/:id/reject (rejeitar)
// Caso de uso: Colaboradores editando posts
@Controller("posts")
@UseGuards(AuthGuard, RolesGuard)
export class UpdatePostsController {
  // Construtor: Injeta UpdatePostsService
  constructor(private readonly updatePostsService: UpdatePostsService) {}

  // Rota: PUT /posts/:id
  // Descrição: Edita post diretamente
  // Roles: Creator, Collaborator (com permissão), Admin
  // Exemplo: PUT /posts/post1 { title: 'Novo Título' }
  @Put(":id")
  async editPost(@Request() req: AuthenticatedRequest, @Param("id") postId: string, @Body() dto: UpdatePostDto) {
    return this.updatePostsService.editDirectly(req.user.id, postId, dto);
  }

  // Rota: POST /posts/:id/request-edit
  // Descrição: Solicita edição de post
  // Roles: Collaborator
  // Exemplo: POST /posts/post1/request-edit { title: 'Novo Título' }
  @Post(":id/request-edit")
  async requestEdit(@Request() req: AuthenticatedRequest, @Param("id") postId: string, @Body() dto: UpdatePostDto) {
    return this.updatePostsService.requestEdit(req.user.id, postId, dto);
  }

  // Rota: PATCH /posts/editing/:id/approve
  // Descrição: Aprova edição de post
  // Roles: Creator, Admin
  // Exemplo: PATCH /posts/editing/req1/approve
  @Patch("editing/:id/approve")
  async approveEdit(
    @Request() req: AuthenticatedRequest,
    @Param("id") requestId: string,
    @Body() body: { reason?: string },
  ) {
    return this.updatePostsService.approveEdit(req.user.id, requestId, body.reason);
  }

  // Rota: PATCH /posts/editing/:id/reject
  // Descrição: Rejeita edição de post
  // Roles: Creator, Admin
  // Exemplo: PATCH /posts/editing/req1/reject
  @Patch("editing/:id/reject")
  async rejectEdit(
    @Request() req: AuthenticatedRequest,
    @Param("id") requestId: string,
    @Body() body: { reason?: string },
  ) {
    return this.updatePostsService.rejectEdit(req.user.id, requestId, body.reason);
  }
}
