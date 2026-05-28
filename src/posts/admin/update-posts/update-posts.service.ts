// Importações para o serviço de edição de posts
// Injectable: Decorator para injeção de dependências
import { Post } from "@generated/prisma/browser";
import { PostStatus, Role, RequestStatus } from "@generated/prisma/enums";
import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
// PrismaService: Acesso ao banco de dados
import { RequestEditDto } from "./dto/request-edit.dto";
import { UpdateCreationStatusDto } from "./dto/update-creation-status.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { PrismaService } from "../../../database/prisma.service";
// UpdatePostDto: DTO para edição
// PostStatus: Enum de status

@Injectable()
export class UpdatePostsService {
  constructor(private readonly prisma: PrismaService) {}

  private isRequestEditDto(obj: unknown): obj is RequestEditDto {
    return typeof obj === "object" && obj !== null && "proposedChanges" in obj;
  }

  private normalizePagination(query: Record<string, unknown>) {
    const status = typeof query.status === "string" ? query.status : undefined;
    let page = 1;
    if (typeof query.page === "number") page = query.page;
    else if (typeof query.page === "string") page = Number(query.page);
    let limit = 10;
    if (typeof query.limit === "number") limit = query.limit;
    else if (typeof query.limit === "string") limit = Number(query.limit);
    return { status, page, limit };
  }

  // Método updatePost: Atualiza post ou cria request baseado no role
  async updatePost(userId: string, postId: string, body: UpdatePostDto | RequestEditDto, role: Role) {
    if (role === Role.ADMIN) {
      // Normaliza payload (pode ser UpdatePostDto ou RequestEditDto)
      const changes = this.isRequestEditDto(body) ? body.proposedChanges : body;
      const ch = changes as Partial<Record<"title" | "content" | "image" | "categories", unknown>>;
      const updateData: Partial<Post> = {};
      if (typeof ch.title === "string") updateData.title = ch.title;
      if (typeof ch.content === "string") updateData.content = ch.content;
      if (typeof ch.image === "string") updateData.imageUrl = String(ch.image);
      if (Array.isArray(ch.categories)) updateData.categories = ch.categories as unknown as Post["categories"];

      return this.prisma.post.update({ where: { id: postId }, data: updateData as unknown as Record<string, unknown> });
    } else {
      return this.createEditRequest(userId, postId, body, role);
    }
  }

  private async createEditRequest(userId: string, postId: string, body: UpdatePostDto | RequestEditDto, role: Role) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { collaborators: { select: { userId: true, permissions: true } } },
    });
    if (!post) throw new NotFoundException("Post not found");

    let targetRole: Role;
    if (role === Role.CREATOR) {
      if (post.creatorId !== userId) throw new ForbiddenException("Only the post creator can request edits");
      targetRole = Role.ADMIN;
    } else if (role === Role.COLLABORATOR) {
      const isCollaborator = post.collaborators.some((collab) => collab.userId === userId);
      if (!isCollaborator) throw new ForbiddenException("Only collaborators can request edits");
      const hasNoRequestPermission = post.collaborators.some(
        (collab) =>
          collab.userId === userId &&
          Array.isArray(collab.permissions) &&
          collab.permissions.includes("NO_REQUEST_EDITOR"),
      );
      targetRole = hasNoRequestPermission ? Role.ADMIN : Role.CREATOR;
    } else {
      throw new ForbiddenException("Invalid role for request");
    }

    const proposed = this.isRequestEditDto(body) ? body.proposedChanges : body;

    return this.prisma.editRequest.create({
      data: {
        postId,
        requesterId: userId,
        targetRole,
        proposedChanges: proposed as unknown as Record<string, unknown>,
        status: RequestStatus.PENDING,
      },
    });
  }
  /* eslint-disable-next-line complexity */
  async approveEdit(userId: string, userRole: string, requestId: string, reason?: string) {
    const request = await this.prisma.editRequest.findUnique({
      where: { id: requestId, status: RequestStatus.PENDING },
      include: { post: true, requester: { select: { role: true } } },
    });
    if (!request) throw new NotFoundException("Request not found");

    const isTargetRole = userRole === request.targetRole;
    const isTargetUser = request.targetRole === Role.CREATOR ? userId === request.post.creatorId : true; // Para CREATOR, verificar se é o creator do post
    if (!isTargetRole || !isTargetUser) throw new ForbiddenException("No permission to approve");

    // Filtrar proposedChanges baseado no role do requester
    const rawChanges = request.proposedChanges as Record<string, unknown>;
    let filteredChanges: Partial<Record<"title" | "content" | "image" | "categories", unknown>> = rawChanges;
    if (request.requester.role === Role.COLLABORATOR) {
      // Collaborator só pode editar title, image, content
      filteredChanges = {
        title: rawChanges.title,
        image: rawChanges.image,
        content: rawChanges.content,
      };
    }
    // Creator pode editar tudo

    // Se o approver é Admin, edita o post.
    if (userRole === Role.ADMIN) {
      // Aplica mudanças filtradas
      await this.prisma.post.update({
        where: { id: request.postId },
        data: {
          title: typeof filteredChanges?.title === "string" ? filteredChanges.title : undefined,
          content: typeof filteredChanges?.content === "string" ? filteredChanges.content : undefined,
          imageUrl: typeof filteredChanges?.image === "string" ? filteredChanges.image : undefined,
          categories: Array.isArray(filteredChanges?.categories)
            ? (filteredChanges?.categories as unknown as Post["categories"])
            : undefined,
        },
      });
    } else if (request.targetRole === Role.CREATOR && isTargetUser) {
      // Creator aprova request de Collaborator, cria novo request para Admin
      await this.prisma.editRequest.create({
        data: {
          postId: request.postId,
          requesterId: userId, // Creator
          targetRole: Role.ADMIN,
          proposedChanges: filteredChanges as unknown as Record<string, unknown>, // Usar mudanças filtradas
          status: RequestStatus.PENDING,
        },
      });
    }

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

  // Método updateCreationStatus: Atualiza status de criação (admin)
  // Lógica: Aprova ou rejeita request, publica post se aprovado
  // Caso de uso: Admin atualizando status de request
  async updateCreationStatus(
    adminId: string,
    requestId: UpdateCreationStatusDto["id"],
    status: UpdateCreationStatusDto["status"],
  ): Promise<Post["id"] | undefined> {
    const request = await this.prisma.creationRequest.findUnique({
      where: { id: requestId, status: "PENDING" },
      include: { post: true },
    });

    if (!request) throw new NotFoundException("Requisição de criação não encontrada.");

    if (status === "APPROVED") {
      // Publica post
      await this.prisma.post.update({
        where: { id: request.postId },
        data: { status: PostStatus.PUBLISHED, publishedAt: new Date() },
      });
    }

    // Atualiza request
    await this.prisma.creationRequest.update({
      where: { id: requestId },
      data: {
        status: status,
        adminReviewerId: adminId,
        reviewedAt: new Date(),
      },
    });
    return request.post?.id;
  }

  async getEditRequests(userId: string, userRole: Role, query: Record<string, unknown>) {
    const { status, page, limit } = this.normalizePagination(query);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { status, targetRole: userRole };
    if (userRole === Role.CREATOR) {
      where.post = { creatorId: userId }; // Específico para Creator do post
    }
    // Para Admin, targetRole: ADMIN já filtra, e qualquer Admin vê

    return this.prisma.editRequest.findMany({
      where,
      include: {
        post: { select: { id: true, title: true } },
        requester: { select: { id: true, name: true } },
      },
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
    });
  }
}
