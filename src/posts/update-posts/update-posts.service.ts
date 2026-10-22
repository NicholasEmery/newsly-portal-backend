// Importações para o serviço de edição de posts
// Injectable: Decorator para injeção de dependências
import { Role, RequestStatus, CollaboratorPermission } from "@generated/prisma/enums";
import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
import type { Prisma } from "../../../generated/prisma/client";
// PrismaService: Acesso ao banco de dados
import { UpdatePostDto } from "./dto/update-post.dto";
import { PrismaService } from "../../database/prisma.service";
// UpdatePostDto: DTO para edição
// PostStatus: Enum de status

// Classe UpdatePostsService: Serviço para edição de posts
// Lógica: Valida permissões, cria requests de edição, aprova/rejeita
// Caso de uso: Colaboradores editando posts com aprovação
@Injectable()
export class UpdatePostsService {
  // Construtor: Injeta PrismaService
  constructor(private readonly prisma: PrismaService) {}

  // Método requestEdit: Solicita edição de post
  // Lógica: Cria EditRequest pendente
  // Exemplo: requestEdit(userId, postId, dto) -> EditRequest
  // Caso de uso: Colaborador solicitando edição
  async requestEdit(userId: string, postId: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { collaborators: true },
    });
    if (!post) throw new NotFoundException("Post not found");

    const isCollaborator = post.collaborators.some((collab) => collab.userId === userId);
    if (!isCollaborator) throw new ForbiddenException("No permission to request edit");

    const canEditWithoutApproval = post.collaborators.some(
      (collab) =>
        collab.userId === userId &&
        Array.isArray(collab.permissions) &&
        collab.permissions.includes(CollaboratorPermission.NO_REQUEST_EDITOR),
    );
    if (canEditWithoutApproval) throw new ForbiddenException("User can edit directly");

    // Cria EditRequest
    return this.prisma.editRequest.create({
      data: {
        postId,
        requesterId: userId,
        targetRole: Role.CREATOR,
        proposedChanges: JSON.parse(JSON.stringify(dto)) as Prisma.InputJsonValue,
      },
    });
  }

  // Método editDirectly: Edita diretamente (se permitido)
  // Lógica: Atualiza post sem request
  // Caso de uso: Colaborador com permissão editando
  async editDirectly(userId: string, postId: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { collaborators: true },
    });
    if (!post) throw new NotFoundException("Post not found");

    const isCreator = post.creatorId === userId;
    const isAdmin = (await this.prisma.user.findUnique({ where: { id: userId } }))?.role === Role.ADMIN;
    const isCollaborator = post.collaborators.some(
      (collab) =>
        collab.userId === userId &&
        Array.isArray(collab.permissions) &&
        collab.permissions.includes(CollaboratorPermission.NO_REQUEST_EDITOR),
    );

    if (!isCreator && !isCollaborator && !isAdmin) {
      throw new ForbiddenException("No permission to edit");
    }

    const safeDto = JSON.parse(JSON.stringify(dto)) as Partial<UpdatePostDto>;
    const updateData: Prisma.PostUpdateInput = {};

    if (typeof safeDto.title === "string") updateData.title = safeDto.title;
    if (typeof safeDto.content === "string") updateData.content = safeDto.content;
    if (typeof safeDto.imageUrl === "string") updateData.imageUrl = safeDto.imageUrl;
    if (typeof safeDto.image === "string") updateData.imageUrl = safeDto.image;
    if (Array.isArray(safeDto.categories)) updateData.categories = safeDto.categories as Prisma.PostUpdateInput["categories"];
    if (Array.isArray(safeDto.tags)) updateData.tags = safeDto.tags as Prisma.PostUpdateInput["tags"];
    if (safeDto.status) updateData.status = safeDto.status;

    return this.prisma.post.update({
      where: { id: postId },
      data: updateData,
    });
  }

  // Método approveEdit: Aprova edição (creator ou admin)
  // Lógica: Aplica mudanças, atualiza request
  // Caso de uso: Creator aprovando edição de colaborador
  async approveEdit(userId: string, requestId: string, reason?: string) {
    const request = await this.prisma.editRequest.findUnique({
      where: { id: requestId },
      include: { post: true },
    });
    if (!request || request.status !== RequestStatus.PENDING) throw new NotFoundException("Request not found");

    const isCreator = request.post.creatorId === userId;
    const isAdmin = (await this.prisma.user.findUnique({ where: { id: userId } }))?.role === Role.ADMIN;
    if (!isCreator && !isAdmin) throw new ForbiddenException("No permission to approve");

    // Aplica mudanças
    const changes = request.proposedChanges as Record<string, unknown>;
    const updateData: Prisma.PostUpdateInput = {};

    if (typeof changes.title === "string") updateData.title = changes.title;
    if (typeof changes.content === "string") updateData.content = changes.content;
    if (typeof changes.image === "string") updateData.imageUrl = changes.image;
    if (typeof changes.imageUrl === "string") updateData.imageUrl = changes.imageUrl;
    if (Array.isArray(changes.categories)) updateData.categories = changes.categories as Prisma.PostUpdateInput["categories"];
    if (Array.isArray(changes.tags)) updateData.tags = changes.tags as Prisma.PostUpdateInput["tags"];
    if (typeof changes.status === "string") updateData.status = changes.status as Prisma.PostUpdateInput["status"];
    await this.prisma.post.update({
      where: { id: request.postId },
      data: updateData,
    });

    // Atualiza request
    return this.prisma.editRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.APPROVED,
        reviewerId: userId,
        reviewedAt: new Date(),
        reason,
      },
    });
  }

  // Método rejectEdit: Rejeita edição
  // Lógica: Atualiza request sem aplicar mudanças
  async rejectEdit(userId: string, requestId: string, reason?: string) {
    const request = await this.prisma.editRequest.findUnique({
      where: { id: requestId },
      include: { post: true },
    });
    if (!request) throw new NotFoundException("Request not found");

    const isCreator = request.post.creatorId === userId;
    const isAdmin = (await this.prisma.user.findUnique({ where: { id: userId } }))?.role === Role.ADMIN;
    if (!isCreator && !isAdmin) throw new ForbiddenException("No permission to reject");

    return this.prisma.editRequest.update({
      where: { id: requestId },
      data: {
        status: RequestStatus.REJECTED,
        reviewerId: userId,
        reviewedAt: new Date(),
        reason,
      },
    });
  }
}
