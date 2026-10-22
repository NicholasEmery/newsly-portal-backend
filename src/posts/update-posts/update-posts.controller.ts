// Importações para o controller de edição de posts
// Controller: Decorator para controlador
import { Body, Controller, Param, Patch, Post, Put, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
// AuthGuard: Guarda de autenticação
import { Request as ExpressRequest } from "express";
import { ApproveRejectDto } from "../admin/delete-posts/dto/approve-reject.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { UpdatePostsService } from "./update-posts.service";
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
@ApiTags("Posts")
export class UpdatePostsController {
  // Construtor: Injeta UpdatePostsService
  constructor(private readonly updatePostsService: UpdatePostsService) {}

  // Rota: PUT /posts/:id
  // Descrição: Edita post diretamente
  // Roles: Creator, Collaborator (com permissão), Admin
  // Exemplo: PUT /posts/post1 { title: 'Novo Título' }
  @Put(":id")
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Editar post diretamente",
    description: "Permite edição direta para usuários autorizados, sem fila de aprovação.",
  })
  @ApiParam({ name: "id", example: "post-uuid-1" })
  @ApiBody({ type: UpdatePostDto })
  async editPost(@Request() req: AuthenticatedRequest, @Param("id") postId: string, @Body() dto: UpdatePostDto) {
    return this.updatePostsService.editDirectly(req.user.id, postId, dto);
  }

  // Rota: POST /posts/:id/request-edit
  // Descrição: Solicita edição de post
  // Roles: Collaborator
  // Exemplo: POST /posts/post1/request-edit { title: 'Novo Título' }
  @Post(":id/request-edit")
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Solicitar edição de post",
    description: "Cria uma solicitação de edição para ser revisada por creator ou admin.",
  })
  @ApiParam({ name: "id", example: "post-uuid-1" })
  @ApiBody({ type: UpdatePostDto })
  async requestEdit(@Request() req: AuthenticatedRequest, @Param("id") postId: string, @Body() dto: UpdatePostDto) {
    return this.updatePostsService.requestEdit(req.user.id, postId, dto);
  }

  // Rota: PATCH /posts/editing/:id/approve
  // Descrição: Aprova edição de post
  // Roles: Creator, Admin
  // Exemplo: PATCH /posts/editing/req1/approve
  @Patch("editing/:id/approve")
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Aprovar edição de post",
    description: "Aprova uma solicitação pendente e aplica ou propaga as alterações aprovadas.",
  })
  @ApiParam({ name: "id", example: "edit-request-uuid-1" })
  @ApiBody({ type: ApproveRejectDto })
  async approveEdit(
    @Request() req: AuthenticatedRequest,
    @Param("id") requestId: string,
    @Body() body: ApproveRejectDto,
  ) {
    return this.updatePostsService.approveEdit(req.user.id, requestId, body.reason);
  }

  // Rota: PATCH /posts/editing/:id/reject
  // Descrição: Rejeita edição de post
  // Roles: Creator, Admin
  // Exemplo: PATCH /posts/editing/req1/reject
  @Patch("editing/:id/reject")
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Rejeitar edição de post",
    description: "Rejeita uma solicitação pendente e registra o motivo, quando informado.",
  })
  @ApiParam({ name: "id", example: "edit-request-uuid-1" })
  @ApiBody({ type: ApproveRejectDto })
  async rejectEdit(
    @Request() req: AuthenticatedRequest,
    @Param("id") requestId: string,
    @Body() body: ApproveRejectDto,
  ) {
    return this.updatePostsService.rejectEdit(req.user.id, requestId, body.reason);
  }
}
