// Importações para o controller
// Controller, Get, Param, Query: Decorators para rotas GET
import { Role } from "@generated/prisma/enums";
import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
// GetUsersService: Serviço para lógica de leitura
import { AuthGuard } from "src/common/guards/auth.guard";
import { GetUsersService } from "./get-users.service";

// Classe GetUsersController: Controla rotas para leitura de usuários
// Prefixo '/users'
// Casos de uso: APIs para buscar usuários
@Controller("users")
export class GetUsersController {
  // Construtor: Injeta serviço
  constructor(private readonly getUsersService: GetUsersService) {}

  // Método findById: Rota GET /users/:id para buscar por ID
  // @Param('id'): Extrai ID da URL
  // Exemplo: GET /users/123 retorna usuário com ID 123
  // Caso de uso: Perfil de usuário
  @Get(":id")
  @UseGuards(AuthGuard)
  async findById(@Param("id") id: string) {
    return this.getUsersService.findById(id);
  }

  // Método findByEmail: Rota GET /users/email/:email para buscar por email
  // Exemplo: GET /users/email/user@example.com
  // Caso de uso: Verificação de email existente
  @Get("email/:email")
  async findByEmail(@Param("email") email: string) {
    return this.getUsersService.findByEmail(email);
  }
}
