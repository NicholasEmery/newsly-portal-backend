// Importações para o serviço de criação de posts
// Injectable: Decorator para injeção de dependências
import { Post } from "@generated/prisma/browser";
import { Category, PostStatus } from "@generated/prisma/enums";
import { Injectable } from "@nestjs/common";
// PrismaService: Acesso ao banco de dados
import { UploadsService } from "src/common/services/upload/uploads.service";
import { CreatePostDto } from "./dto/create-post.dto";
import { PrismaService } from "../../../database/prisma.service";
// CreatePostDto: DTO para criação
// PostStatus: Enum de status
import { CollaboratorsPostDto } from "../dto/collaboratorsPost.dto";

// Classe CreatePostsService: Serviço para criação de posts
// Lógica: Valida permissões, cria post e request de criação
// Caso de uso: Usuários com quota criando posts pendentes
@Injectable()
export class CreatePostsService {
  // Construtor: Injeta PrismaService
  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadsService: UploadsService,
  ) {}

  // Método createPost: Cria um post pendente
  // Lógica: Verifica quota, cria post e CreationRequest
  // Exemplo: createPost(userId, dto) -> Post
  // Caso de uso: Endpoint POST /posts
  async createPost(
    userId: string,
    body: CreatePostDto,
    roleUser: string,
  ): Promise<{ statusCode: number; message: string; postId?: Post["id"]; requestId?: string }> {
    const imgUpload = await this.uploadsService.saveUploadedFile(body.imageFile);

    const isCreator = roleUser === "CREATOR";

    const categories = body.categories ?? [Category.SPOTLIGHT];

    const collaborators = body.collaborators?.map((collab: CollaboratorsPostDto) => ({
      user: { connect: { email: collab.email } },
      invitedByUser: { connect: { id: userId } },
      permissions: collab.permission,
    }));

    const dataObject = {
      title: body.title,
      content: body.content,
      imageUrl: imgUpload,
      categories,
      status: isCreator ? PostStatus.PENDING : PostStatus.PUBLISHED,
      creatorId: userId,
      ...(collaborators?.length ? { collaborators: { create: collaborators } } : {}),
    };

    // Cria post
    const post = await this.prisma.post.create({
      data: dataObject,
    });

    if (isCreator) {
      // Cria CreationRequest
      const creationRequest = await this.prisma.creationRequest.create({
        data: { postId: post.id, requesterId: userId },
      });

      return {
        statusCode: 201,
        message: "Requisição de criação de post enviada com sucesso para revisão.",
        requestId: creationRequest.id,
      };
    }

    const findAdminUsers = await this.prisma.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true },
    });

    await this.prisma.notification.create({
      data: {
        title: isCreator ? "Nova requisição de criação de post" : "Novo post criado",
        body: isCreator
          ? `O usuário com ID ${userId} solicitou a criação do post "${body.title}".`
          : `O usuário com ID ${userId} criou o post "${body.title}".`,
        imageUrl: imgUpload,
        linkUrl: `https://admin.newsly.com/posts/${post.id}`,
        recipientsType: isCreator ? "USERS" : "ALL",
        recipients: isCreator ? findAdminUsers.map((admin) => admin.id) : [],
        expiresAt: new Date(new Date().setDate(new Date().getDate() + 5)),
      },
    });

    return { statusCode: 201, message: "Post criado com sucesso.", postId: post.id };
  }
}
