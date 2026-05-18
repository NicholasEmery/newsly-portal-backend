// Importações para o serviço de edição de posts
// Injectable: Decorator para injeção de dependências
import { Post } from "@generated/prisma/browser";
import { User } from "@generated/prisma/client";
import { PostStatus, Role, RequestStatus } from "@generated/prisma/enums";
import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
// PrismaService: Acesso ao banco de dados
import request from "supertest";
import { RequestEditDto } from "./dto/request-edit.dto";
import { UpdateCreationStatusDto } from "./dto/update-creation-status.dto";
import { UpdatePostDto } from "./dto/update-post.dto";
import { PrismaService } from "../../../database/prisma.service";
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
  // async requestEdit(userId: string, postId: string, dto: UpdatePostDto) {
  //   const post = await this.prisma.post.findUnique({
  //     where: { id: postId },
  //     include: { collaborators: { select: { userId: true, permissions: true } } },
  //   });
  //   if (!post) throw new NotFoundException("Post not found");

  //   const isCollaborator = post.collaborators.some((collab) => collab.userId === userId);
  //   const canEditWithoutApproval = post.collaborators.some(
  //     (collab) => collab.userId === userId && collab.permissions.includes("NO_REQUEST_EDITOR"),
  //   );
  //   if (!isCollaborator || canEditWithoutApproval) throw new ForbiddenException("No permission to request edit");

  //   // Cria EditRequest
  //   return this.prisma.editRequest.create({
  //     data: {
  //       postId,
  //       requesterId: userId,
  //       proposedChanges: JSON.parse(JSON.stringify(dto)),
  //     },
  //   });
  // }

  // Método updatePost: Atualiza post ou cria request baseado no role
  async updatePost(userId: string, postId: string, body: UpdatePostDto | RequestEditDto, role: Role) {
    if (role === Role.ADMIN) {
      return this.prisma.post.update({
        where: { id: postId },
        data: body as any,
      });
    } else {
      // Para Creator e Collaborator, cria EditRequest
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
        // Verificar se tem permissão para editar sem aprovação do creator
        const hasNoRequestPermission = post.collaborators.some(
          (collab) => collab.userId === userId && collab.permissions.includes("NO_REQUEST_EDITOR"),
        );
        targetRole = hasNoRequestPermission ? Role.ADMIN : Role.CREATOR;
      } else {
        throw new ForbiddenException("Invalid role for request");
      }

      return this.prisma.editRequest.create({
        data: {
          postId,
          requesterId: userId,
          targetRole,
          proposedChanges: body as any,
          status: RequestStatus.PENDING,
        },
      });
    }
  }
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
    let filteredChanges = request.proposedChanges as any;
    if (request.requester.role === Role.COLLABORATOR) {
      // Collaborator só pode editar title, image, content
      filteredChanges = {
        title: filteredChanges.title,
        image: filteredChanges.image,
        content: filteredChanges.content,
      };
    }
    // Creator pode editar tudo

    // Se o approver é Admin, edita o post.
    if (userRole === Role.ADMIN) {
      // Aplica mudanças filtradas
      await this.prisma.post.update({
        where: { id: request.postId },
        data: {
          title: filteredChanges.title,
          content: filteredChanges.content,
          imageUrl: filteredChanges.image,
          categories: filteredChanges.categories,
        },
      });
    } else if (request.targetRole === Role.CREATOR && isTargetUser) {
      // Creator aprova request de Collaborator, cria novo request para Admin
      await this.prisma.editRequest.create({
        data: {
          postId: request.postId,
          requesterId: userId, // Creator
          targetRole: Role.ADMIN,
          proposedChanges: filteredChanges, // Usar mudanças filtradas
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

    // TODO: Notificar
    return;
  }

  async getEditRequests(userId: string, userRole: Role, query: any) {
    const { status, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: any = { status, targetRole: userRole };
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
