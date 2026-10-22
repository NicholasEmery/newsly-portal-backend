import { Role } from "@generated/prisma/enums";
import { Body, Controller, HttpCode, Param, Patch, Put, Query, Request, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiBody, ApiExtraModels, ApiOperation, ApiParam, ApiQuery, ApiTags, getSchemaPath } from "@nestjs/swagger";
// AuthGuard: Guarda de autenticação
import { AuthenticatedRequest } from "src/common/interfaces/auth.interface";
import { ApproveRejectDto } from "../delete-posts/dto/approve-reject.dto";
import { RequestEditDto } from "./dto/request-edit.dto";
import { UpdateCreationStatusDto } from "./dto/update-creation-status.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { UpdatePostsService } from "./update-posts.service";
import { Roles } from "../../../common/decorators/roles.decorator";
import { AuthGuard } from "../../../common/guards/auth.guard";
// RolesGuard: Guarda de roles
import { RolesGuard } from "../../../common/guards/roles.guard";
// Roles: Decorator para roles
// UpdatePostDto: DTO para edição
// UpdatePostsService: Serviço de edição
// Role: Enum de roles

// Classe UpdatePostsController: Controlador para edição de posts
// Rotas: PUT /posts/:id (editar diretamente), POST /posts/:id/request-edit (solicitar edição), PATCH /posts/editing/:id/approve (aprovar), PATCH /posts/editing/:id/reject (rejeitar)
// Caso de uso: Colaboradores editando posts
@Controller("posts")
@UseGuards(AuthGuard, RolesGuard)
@ApiExtraModels(UpdatePostDto, RequestEditDto, ApproveRejectDto)
@ApiTags("Posts")
export class UpdatePostsController {
  // Construtor: Injeta UpdatePostsService
  constructor(private readonly updatePostsService: UpdatePostsService) {}

  // Rota: PUT /posts/:id
  // Descrição: Edita post diretamente (se Admin/Creator) ou solicita edição (se Collaborator)
  // Roles: Creator, Collaborator, Admin
  // Exemplo: PUT /posts/post1 { title: 'Novo Título' }
  @Put(":id")
  @Roles(Role.ADMIN, Role.CREATOR, Role.COLLABORATOR)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Atualizar post ou solicitar edição",
    description: "Admin atualiza diretamente; creator e collaborator seguem o fluxo de solicitação de edição.",
  })
  @ApiParam({ name: "id", example: "post-uuid-1" })
  @ApiBody({
    description: "Payload aceito depende da role do usuário.",
    schema: {
      oneOf: [
        { $ref: getSchemaPath(UpdatePostDto) },
        { $ref: getSchemaPath(RequestEditDto) },
      ],
    },
  })
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
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Aprovar edição de post",
    description: "Aprova uma solicitação de edição pendente e registra o motivo opcional.",
  })
  @ApiParam({ name: "id", example: "edit-request-uuid-1" })
  @ApiBody({ type: ApproveRejectDto })
  async approveEdit(
    @Request() req: AuthenticatedRequest,
    @Param("id") requestId: string,
    @Body() body: ApproveRejectDto,
  ) {
    return this.updatePostsService.approveEdit(req.user.id, req.user.role, requestId, body.reason);
  }

  // Rota: PATCH /posts/editing/:id/reject
  // Descrição: Rejeita edição de post
  // Roles: Creator, Admin
  // Exemplo: PATCH /posts/editing/req1/reject
  @Patch("editing/:id/reject")
  @UseGuards(AuthGuard)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Rejeitar edição de post",
    description: "Rejeita uma solicitação de edição pendente e registra o motivo opcional.",
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

  // Rota: PATCH /posts/creation/:id/status?status=:status
  // Descrição: Atualiza status de criação de post (aprovar ou rejeitar)
  // Roles: Admin
  // Exemplo: PATCH /posts/creation/req1/status?status=APPROVED
  @Patch("published/:id/status")
  @HttpCode(200)
  @Roles(Role.ADMIN)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Atualizar status de criação de post",
    description: "Admin aprova ou rejeita uma requisição de criação e pode publicar o post automaticamente.",
  })
  @ApiParam({ name: "id", example: "creation-request-uuid-1" })
  @ApiQuery({ name: "status", enum: ["APPROVED", "REJECTED"], example: "APPROVED" })
  async updateCreationStatus(
    @Request() req: AuthenticatedRequest,
    @Param("id") requestId: string,
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
