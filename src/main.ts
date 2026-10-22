// Importações para inicialização da aplicação
// dotenv/config: Carrega variáveis de ambiente do .env
import "dotenv/config";
// NestFactory: Fábrica para criar app NestJS
// AppModule: Módulo raiz da aplicação
// ValidationPipe: Pipe global para validação de DTOs
import { Logger, ValidationPipe } from "@nestjs/common";
// ConfigService: Serviço para acessar config/env
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { FastifyAdapter, NestFastifyApplication } from "@nestjs/platform-fastify";
import multipart from "@fastify/multipart";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";
import { isAllowedFrontendOrigin } from "./common/config/environment";

// Função bootstrap:Inicializa e configura a aplicação NestJS
// Lógica: Cria app, configura validação, CORS e inicia servidor
// Caso de uso: Ponto de entrada da aplicação
async function bootstrap() {
  // Cria instância da aplicação com AppModule
  const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter());
  // Obtém ConfigService para variáveis de ambiente
  const configService = app.get(ConfigService);
  const corsOrigin = (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void): void => {
    if (isAllowedFrontendOrigin(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`Origin not allowed: ${origin ?? "unknown"}`), false);
  };

  // Ativa validação global: Remove campos não whitelist, rejeita inválidos
  // whitelist: true - remove campos não definidos no DTO
  // forbidNonWhitelisted: true - lança erro se campo extra
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  app.enableCors({
    credentials: true,
    origin: corsOrigin as never,
  });

  await app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Newsly Portal API")
    .setDescription(
      "Documentação completa da API do Newsly Portal, com exemplos de payload, autenticação Bearer e casos de uso por rota.",
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
      "bearer",
    )
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, swaggerDocument, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Obtém porta do ambiente
  const port = configService.get<string>("BACKEND_PORT") ?? configService.get<string>("PORT") ?? "3333";
  if (!port) {
    console.warn("BACKEND_PORT environment variable is not set.");
  }
  // Inicia servidor na porta especificada
  await app.listen(Number(port), "0.0.0.0");
  Logger.log(`Server is running on port ${port}`, "Bootstrap");
}
// Chama bootstrap para iniciar a app
void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown bootstrap error";
  console.error(message);
  process.exit(1);
});
