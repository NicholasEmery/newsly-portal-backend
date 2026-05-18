// Importações para o serviço de atualização
// Injectable: Decorator para injeção
import { Injectable } from "@nestjs/common";
// PrismaService: Acesso ao banco
// SafeUser: Tipo seguro para retorno
// import { SafeUser, UserOperationsService } from "../user-operations.service";
// Role: Enum de papéis
import { Role } from "../../../generated/prisma/enums";
// TokenHelper: Para hashear senhas
import { TokenHelper } from "../../auth/util/generateTokens";
import { PrismaService } from "../../database/prisma.service";

// Interface UpdateUserInput: Dados para atualizar usuário
// Exemplo: { id: '123', name: 'Novo Nome', role: Role.ADMIN }
// Caso de uso: Atualização parcial de dados do usuário
export interface UpdateUserInput {
  id: string; // ID obrigatório para identificar usuário
  email?: string; // Opcional
  name?: string;
  photo?: string;
  password?: string; // Senha em texto plano, será hasheada
  role?: Role;
}

// Classe UpdateUsersService: Serviço para atualizar usuários
// Lógica: Atualiza dados no banco via Prisma
// Caso de uso: Edição de perfil, mudança de role
@Injectable()
export class UpdateUsersService {
  // Construtor: Injeta PrismaService
  constructor(
    private readonly prisma: PrismaService,
    // private readonly userOperationsService: UserOperationsService,
    private readonly tokenHelper: TokenHelper,
  ) {}

  // Método updateUser: Atualiza usuário por ID
  // Lógica: Usa update do Prisma com dados fornecidos
  // Exemplo: updateUser({ id: '123', name: 'João' })
  // Caso de uso: API para editar usuário
  async updateUser(input: UpdateUserInput) {
    // Se há senha, hashear e atualizar LocalAuth
    if (input.password) {
      const passwordHash = await this.tokenHelper.hashToken(input.password);
      await this.prisma.localAuth.update({
        where: { userId: input.id },
        data: { passwordHash },
      });
    }

    // Atualiza User
    const updated = await this.prisma.user.update({
      where: { id: input.id },
      data: {
        email: input.email,
        name: input.name,
        photo: input.photo,
        role: input.role,
      },
    });
    // Retorna como SafeUser
    // return this.userOperationsService.findById(updated.id) as Promise<SafeUser>;
    return updated;
  }
}
