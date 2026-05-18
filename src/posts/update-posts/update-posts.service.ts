// Importações para o serviço de edição de posts
// Injectable: Decorator para injeção de dependências
import { PostStatus, Role, RequestStatus, CollaboratorPermission } from "@generated/prisma/enums";
import { Injectable, ForbiddenException, NotFoundException } from "@nestjs/common";
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
        collab.userId === userId && collab.permissions.includes(CollaboratorPermission.NO_REQUEST_EDITOR as any),
    );
    if (canEditWithoutApproval) throw new ForbiddenException("User can edit directly");

    // Cria EditRequest
    return this.prisma.editRequest.create({
      data: {
        postId,
        requesterId: userId,
        targetRole: Role.CREATOR,
        proposedChanges: JSON.parse(JSON.stringify(dto)),
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
        collab.userId === userId && collab.permissions.includes(CollaboratorPermission.NO_REQUEST_EDITOR as any),
    );

    if (!isCreator && !isCollaborator && !isAdmin) {
      throw new ForbiddenException("No permission to edit");
    }

    return this.prisma.post.update({
      where: { id: postId },
      data: dto,
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
    await this.prisma.post.update({
      where: { id: request.postId },
      data: request.proposedChanges as any,
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
