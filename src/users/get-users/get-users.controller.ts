import { Controller, Get, Param, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from "@nestjs/swagger";
// GetUsersService: Serviço para lógica de leitura
import { AuthGuard } from "src/common/guards/auth.guard";
import { GetUsersService } from "./get-users.service";

// Classe GetUsersController: Controla rotas para leitura de usuários
// Prefixo '/users'
// Casos de uso: APIs para buscar usuários
@Controller("users")
@ApiTags("Users")
export class GetUsersController {
  // Construtor: Injeta serviço
  constructor(private readonly getUsersService: GetUsersService) {}

  // Método findById: Rota GET /users/:id para buscar por ID
  // @Param('id'): Extrai ID da URL
  // Exemplo: GET /users/123 retorna usuário com ID 123
  // Caso de uso: Perfil de usuário
  @Get(":id")
  @UseGuards(AuthGuard)
  @ApiBearerAuth("bearer")
  @ApiOperation({
    summary: "Buscar usuário por ID",
    description: "Retorna o usuário autenticado ou qualquer usuário autorizado quando o guard permitir acesso.",
  })
  @ApiParam({ name: "id", example: "550e8400-e29b-41d4-a716-446655440000" })
  @ApiOkResponse({
    description: "Usuário encontrado.",
    schema: {
      example: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "nicholas@example.com",
      },
    },
  })
  findById(@Param("id") id: string) {
    return this.getUsersService.findById(id);
  }

  // Método findByEmail: Rota GET /users/email/:email para buscar por email
  // Exemplo: GET /users/email/user@example.com
  // Caso de uso: Verificação de email existente
  @Get("email/:email")
  @ApiOperation({
    summary: "Buscar usuário por email",
    description: "Consulta um usuário pelo email cadastrado.",
  })
  @ApiParam({ name: "email", example: "nicholas@example.com" })
  @ApiOkResponse({
    description: "Usuário encontrado pelo email.",
    schema: {
      example: {
        id: "550e8400-e29b-41d4-a716-446655440000",
        email: "nicholas@example.com",
      },
    },
  })
  findByEmail(@Param("email") email: string) {
    return this.getUsersService.findByEmail(email);
  }
}
