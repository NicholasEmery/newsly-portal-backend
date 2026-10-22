import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { SystemService } from "./system.service";

@Controller("api")
@ApiTags("System")
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get("compatibility")
  @ApiOperation({
    summary: "Contrato de compatibilidade da API",
    description:
      "Expõe a release ativa e a faixa de contratos de frontend aceita para bloqueios de deploy e diagnóstico operacional.",
  })
  @ApiOkResponse({
    description: "Metadados públicos de compatibilidade da release ativa.",
    schema: {
      example: {
        service: "newsly-backend",
        release: { id: "<sha>-<run>-<attempt>", sha: "<commit-sha>" },
        contract: { api: "2026.1", frontend: { minimum: "2026.1", maximum: "2026.1" } },
      },
    },
  })
  compatibility() {
    return this.systemService.compatibility();
  }

  @Get("health")
  @ApiOperation({
    summary: "Health check",
    description: "Verifica se o processo HTTP está ativo e expõe um payload simples para monitoramento.",
  })
  @ApiOkResponse({
    description: "Resposta de health check.",
    schema: {
      example: {
        status: "ok",
        service: "newsly-api",
        featureFlag: "mock-feature-flow",
        timestamp: "2026-06-22T12:00:00.000Z",
      },
    },
  })
  health() {
    return this.systemService.checkHealth();
  }

  @Get("ready")
  @ApiOperation({
    summary: "Readiness check",
    description: "Tenta acessar o banco para confirmar se a aplicação está pronta para receber tráfego.",
  })
  @ApiOkResponse({
    description: "Aplicação pronta.",
    schema: {
      example: {
        status: "ready",
        service: "newsly-api",
        timestamp: "2026-06-22T12:00:00.000Z",
      },
    },
  })
  ready() {
    return this.systemService.checkReadiness();
  }
}
