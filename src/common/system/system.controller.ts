import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { SystemService } from "./system.service";

@ApiTags("System")
@Controller("api")
export class SystemController {
  constructor(private readonly systemService: SystemService) {}

  @Get("health")
  @ApiOperation({ summary: "Verifica a saúde da API" })
  @ApiResponse({
    status: 200,
    description: "API está saudável",
    schema: { example: { status: "ok", service: "newsly-api", featureFlag: "mock-feature-flow" } },
  })
  health() {
    return this.systemService.checkHealth();
  }

  @Get("ready")
  @ApiOperation({ summary: "Verifica se a API está pronta (dependências OK)" })
  @ApiResponse({
    status: 200,
    description: "API está pronta e todas as dependências estão OK",
    schema: { example: { status: "ready" } },
  })
  @ApiResponse({
    status: 503,
    description: "API não está pronta - alguma dependência falhou",
  })
  ready() {
    return this.systemService.checkReadiness();
  }
}
