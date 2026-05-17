// Importações para o serviço
// Injectable: Decorator para injeção de dependências
import { Injectable } from "@nestjs/common";
// UserOperationsService: Serviço central para operações de usuário
// import { UserOperationsService, SafeUser } from "../user-operations.service";

// Classe ReadUsersService: Serviço para leitura de usuários
// Fornece métodos para buscar usuários por ID, email ou todos
// Casos de uso: Perfil de usuário, listagem de usuários, autenticação
@Injectable()
export class GetUsersService {
  // Construtor: Injeta UserOperationsService
  // constructor(private readonly userOperationsService: UserOperationsService) {}

  // Método findById: Busca usuário por ID único
  // Lógica: Delega para UserOperationsService
  // Exemplo: findById('user-123') retorna usuário ou null
  // Caso de uso: Carregar perfil de usuário logado
  async findById(id: string) {
    // return this.userOperationsService.findById(id);
  }

  // Método findByEmail: Busca usuário por email
  // Lógica: Delega para UserOperationsService
  // Exemplo: findByEmail('user@example.com')
  // Caso de uso: Verificar se email já existe no registro
  async findByEmail(email: string) {
    // return this.userOperationsService.findByEmail(email);
  }

  // Método findAll: Busca todos os usuários
  // Lógica: Delega para UserOperationsService
  // Exemplo: findAll() retorna array de SafeUser
  // Caso de uso: Admin listando todos os usuários
  async findAll() {
    // return this.userOperationsService.findAll();
  }
}
