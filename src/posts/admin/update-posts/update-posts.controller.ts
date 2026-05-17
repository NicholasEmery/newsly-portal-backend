// Importações para o controller de edição de posts
// Controller: Decorator para controlador
import { Controller, Put, Body, UseGuards, Request, Param, Patch, Post, HttpCode, Query } from "@nestjs/common";
// AuthGuard: Guarda de autenticação
import { AuthGuard } from "../../../common/guards/auth.guard";
// RolesGuard: Guarda de roles
import { RolesGuard } from "../../../common/guards/roles.guard";
// Roles: Decorator para roles
import { Roles } from "../../../common/decorators/roles.decorator";
// UpdatePostDto: DTO para edição
import { UpdatePostDto } from "./dto/update-post.dto";
// UpdatePostsService: Serviço de edição
import { UpdatePostsService } from "./update-posts.service";
// Role: Enum de roles
import { Role } from "@generated/prisma/enums";
import { AuthenticatedRequest } from "src/common/interfaces/auth.interface";
import { UpdateCreationStatusDto } from "./dto/update-creation-status.dto";
import { RequestEditDto } from "./dto/request-edit.dto";

// Classe UpdatePostsController: Controlador para edição de posts
// Rotas: PUT /posts/:id (editar diretamente), POST /posts/:id/request-edit (solicitar edição), PATCH /posts/editing/:id/approve (aprovar), PATCH /posts/editing/:id/reject (rejeitar)
// Caso de uso: Colaboradores editando posts
@Controller("posts")
@UseGuards(AuthGuard, RolesGuard)
export class UpdatePostsController {
  // Construtor: Injeta UpdatePostsService
  constructor(private readonly updatePostsService: UpdatePostsService) {}

  // Rota: PUT /posts/:id
  // Descrição: Edita post diretamente (se Admin/Creator) ou solicita edição (se Collaborator)
  // Roles: Creator, Collaborator, Admin
  // Exemplo: PUT /posts/post1 { title: 'Novo Título' }
  @Put(":id")
  @Roles(Role.ADMIN, Role.CREATOR, Role.COLLABORATOR)
  async editPost(
    @Request() req: AuthenticatedRequest,
    @Param("id") postId: string,
    @Body() body: UpdatePostDto | RequestEditDto,
  ) {
    const userId = req.user.id;
    const userRole = req.user.role;
    return this.updatePostsService.updatePost(userId, postId, body, userRole);
  }

  // Rota: PATCH /posts/editing/:id/approve
  // Descrição: Aprova edição de post
  // Roles: Creator, Admin
  // Exemplo: PATCH /posts/editing/req1/approve
  @Patch("editing/:id/approve")
  @UseGuards(AuthGuard)
  async approveEdit(@Request() req: any, @Param("id") requestId: string, @Body() body: { reason?: string }) {
    return this.updatePostsService.approveEdit(req.user.id, req.user.role, requestId, body.reason);
  }

  // Rota: PATCH /posts/editing/:id/reject
  // Descrição: Rejeita edição de post
  // Roles: Creator, Admin
  // Exemplo: PATCH /posts/editing/req1/reject
  @Patch("editing/:id/reject")
  @UseGuards(AuthGuard)
  async rejectEdit(@Request() req: any, @Param("id") requestId: string, @Body() body: { reason?: string }) {
    return this.updatePostsService.rejectEdit(req.user.id, requestId, body.reason);
  }

  // Rota: PATCH /posts/creation/:id/status?status=:status
  // Descrição: Atualiza status de criação de post (aprovar ou rejeitar)
  // Roles: Admin
  // Exemplo: PATCH /posts/creation/req1/status?status=APPROVED
  @Patch("published/:id/status")
  @HttpCode(200)
  @Roles(Role.ADMIN)
  async updateCreationStatus(
    @Request() req: AuthenticatedRequest,
    @Param("id") requestId: UpdateCreationStatusDto["id"],
    @Query("status") status: UpdateCreationStatusDto["status"],
  ) {
    const adminId = req.user.id;

    const result = await this.updatePostsService.updateCreationStatus(adminId, requestId, status);

    return {
      status: 200,
      message: `Requisição de criação de post ${status === "APPROVED" ? "aprovada" : "rejeitada"} com sucesso.`,
      postId: result,
    };
  }
}
