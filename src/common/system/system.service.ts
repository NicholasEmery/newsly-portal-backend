import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class SystemService {
  constructor(private readonly prisma: PrismaService) {}

  async checkHealth() {
    return {
      status: "ok",
      service: "newsly-api",
      featureFlag: "mock-feature-flow",
      timestamp: new Date().toISOString(),
    };
  }

  async checkReadiness() {
    try {
      // Verifica se consegue conectar ao banco de dados
      await this.prisma.$runCommandRaw({ ping: 1 });
      return {
        status: "ready",
        service: "newsly-api",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw {
        status: 503,
        message: "Database connection failed",
        detail: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }
}
