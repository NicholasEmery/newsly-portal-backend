// Importações para o serviço Prisma
// Injectable, OnModuleInit, OnModuleDestroy: Decorators do NestJS para lifecycle
import { Injectable, OnModuleInit, OnModuleDestroy, Logger, OnApplicationShutdown } from "@nestjs/common";
// PrismaClient: Cliente gerado pelo Prisma para banco
import { PrismaClient } from "../../generated/prisma/client";

// Classe PrismaService: Serviço para interagir com o banco via Prisma
// Extende PrismaClient, implementa hooks de lifecycle
// Caso de uso: Acesso ao banco em toda a aplicação
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy, OnApplicationShutdown {
  // Logger: Para logs do serviço
  private readonly logger: Logger = new Logger(PrismaService.name);

  // Construtor: Configura logging baseado no ambiente e middlewares para segurança
  constructor() {
    super({
      log: process.env.NODE_ENV === "development" ? ["query", "info", "warn", "error"] : ["error"],
    });

    // Nota: Middlewares não são suportados para MongoDB no Prisma
    // Para segurança, evite logar queries em produção
  }

  // onModuleInit: Hook chamado ao iniciar módulo
  // Lógica: Conecta ao banco com retry, loga sucesso ou erro
  // Caso de uso: Garantir conexão ao iniciar app
  async onModuleInit() {
    await this.connectWithRetry();
  }

  // onModuleDestroy: Hook chamado ao destruir módulo
  // Lógica: Desconecta do banco
  // Caso de uso: Limpeza ao encerrar app
  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log("Database disconnected");
  }

  // onApplicationShutdown: Hook para shutdown graceful
  // Lógica: Garante desconexão antes do shutdown
  async onApplicationShutdown(signal?: string) {
    this.logger.log(`Application shutdown signal: ${signal}`);
    await this.$disconnect();
  }

  // Método connectWithRetry: Conecta com retry para resiliência
  private async connectWithRetry(retries: number = 3): Promise<void> {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        await this.$connect();
        this.logger.log("Database connected successfully");
        return;
      } catch (error) {
        this.logger.warn(`Database connection attempt ${attempt} failed: ${(error as Error).message}`);
        if (attempt === retries) {
          this.logger.error("Failed to connect to database after retries", error as Error);
          throw error;
        }
        // Espera exponencial: 1s, 2s, 4s...
        await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
      }
    }
  }

  // Método healthCheck: Verifica saúde da conexão
  // Lógica: Faz query simples (count) para testar
  // Exemplo: Usado em endpoints de health check
  // Caso de uso: Monitoramento da app
  async healthCheck(): Promise<boolean> {
    try {
      // Query simples no modelo User, sem dados sensíveis
      await this.user.count({ take: 1 });
      return true;
    } catch (error) {
      this.logger.error("Health check failed", error as Error);
      return false;
    }
  }

  // Método runInTransaction: Helper para transações
  // Lógica: Envolve função em $transaction do Prisma
  // Exemplo: runInTransaction(async (tx) => { ... })
  // Caso de uso: Operações atômicas no banco
  async runInTransaction<T>(
    fn: (prisma: Omit<PrismaClient, "$connect" | "$disconnect" | "$on" | "$transaction">) => Promise<T>,
  ): Promise<T> {
    return this.$transaction(fn);
  }

  // Método getMetrics: Retorna métricas básicas (opcional para monitoramento)
  // Lógica: Conta registros em tabelas principais
  // Caso de uso: Dashboards ou logs
  async getMetrics(): Promise<{ users: number }> {
    try {
      const users = await this.user.count();
      return { users };
    } catch (error) {
      this.logger.error("Failed to get metrics", error as Error);
      throw error;
    }
  }
}
