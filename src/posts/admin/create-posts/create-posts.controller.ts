// Importações para o controller de criação de posts
// Controller: Decorator para controlador
import { BadRequestException, Body, Controller, HttpCode, Post, Request, UseGuards } from "@nestjs/common";
import { Role } from "@generated/prisma/enums";
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from "@nestjs/swagger";
// AuthGuard: Guarda de autenticação
import { AuthenticatedRequest } from "src/common/interfaces/auth.interface";
import { CreatePostsService } from "./create-posts.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { Roles } from "../../../common/decorators/roles.decorator";
import { AuthGuard } from "../../../common/guards/auth.guard";
// RolesGuard: Guarda de roles
import { RolesGuard } from "../../../common/guards/roles.guard";
import type { FastifyRequest } from "fastify";
import { parseMultipartJsonField, readMultipartFormData } from "src/common/utils/multipart-form-data";
// Classe CreatePostsController: Controlador para criação de posts
// Rotas: POST /posts (criar), PATCH /posts/creation/:id/approve (aprovar), PATCH /posts/creation/:id/reject (rejeitar)
// Caso de uso: Usuários criando posts, admins aprovando/rejeitando
@Controller("posts")
@UseGuards(AuthGuard, RolesGuard)
@ApiTags("Posts")
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
  @ApiBearerAuth("bearer")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Criar post",
    description: "Cria um novo post usando multipart/form-data, com imagem, texto e metadados opcionais.",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["title", "content", "imageFile"],
      properties: {
        title: {
          type: "string",
          example: "Minha primeira publicação",
        },
        content: {
          type: "string",
          example: "Texto completo do post...",
        },
        imageFile: {
          type: "string",
          format: "binary",
          description: "Imagem principal do post.",
        },
        categories: {
          type: "string",
          description: "JSON com categorias do post.",
          example: JSON.stringify(["SPOTLIGHT"]),
        },
        collaborators: {
          type: "string",
          description: "JSON com lista de colaboradores e permissões.",
          example: JSON.stringify([
            {
              email: "collab@example.com",
              permission: ["NO_REQUEST_EDITOR"],
            },
          ]),
        },
      },
    },
  })
  async createPost(
    @Request() req: AuthenticatedRequest,
    @Body() body?: CreatePostDto,
  ): Promise<{ statusCode: number; message: string; postId?: string; requestId?: string }> {
    const userId = req.user.id;
    const roleUser = req.user.role;

    if (body?.imageFile) {
      return this.createPostsService.createPost(userId, body, roleUser);
    }

    const { fields, file } = await readMultipartFormData(req as unknown as FastifyRequest);

    if (!file) {
      throw new BadRequestException('Campo "imageFile" é obrigatório.');
    }

    const categories = parseMultipartJsonField<CreatePostDto["categories"]>(fields, "categories", false);
    const collaborators = parseMultipartJsonField<CreatePostDto["collaborators"]>(fields, "collaborators", false);

    const multipartBody: CreatePostDto = {
      title: fields.title,
      content: fields.content,
      imageFile: file,
      categories,
      collaborators,
    };

    const result = await this.createPostsService.createPost(userId, multipartBody, roleUser);

    return result;
  }
}
