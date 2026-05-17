// Importações para o serviço de exclusão
// Injectable: Decorator para injeção
import { Injectable } from "@nestjs/common";
// PrismaService: Acesso ao banco
import { PrismaService } from "../../database/prisma.service";

// Classe DeleteUsersService: Serviço para deletar usuários
// Lógica: Remove usuário do banco por ID
// Caso de uso: Exclusão de conta, admin removendo usuário
@Injectable()
export class DeleteUsersService {
  // Construtor: Injeta PrismaService
  constructor(private readonly prisma: PrismaService) {}

  // Método deleteUser: Deleta usuário por ID
  // Lógica: Usa delete do Prisma
  // Exemplo: deleteUser('123') remove usuário com ID 123
  // Caso de uso: Endpoint DELETE /users/123
  async deleteUser(email: string): Promise<void> {
    await this.prisma.user.delete({
      where: { email },
    });
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
