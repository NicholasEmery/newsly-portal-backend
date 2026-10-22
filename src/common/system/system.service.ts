import { Injectable, ServiceUnavailableException } from "@nestjs/common";
import { PrismaService } from "../../database/prisma.service";

@Injectable()
export class SystemService {
  constructor(private readonly prisma: PrismaService) {}

  compatibility() {
    return {
      service: "newsly-backend",
      release: {
        id: process.env.NEWSLY_RELEASE_ID ?? "local",
        sha: process.env.NEWSLY_RELEASE_SHA ?? "local",
      },
      contract: {
        api: process.env.NEWSLY_API_CONTRACT_VERSION ?? "2026.1",
        frontend: {
          minimum: process.env.NEWSLY_FRONTEND_CONTRACT_MIN ?? "2026.1",
          maximum: process.env.NEWSLY_FRONTEND_CONTRACT_MAX ?? "2026.1",
        },
      },
      timestamp: new Date().toISOString(),
    };
  }

  checkHealth() {
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
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new ServiceUnavailableException(`Database connection failed: ${message}`);
    }
  }
}
