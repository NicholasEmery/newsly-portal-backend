// Importações para inicialização da aplicação
// dotenv/config: Carrega variáveis de ambiente do .env
import "dotenv/config";
// NestFactory: Fábrica para criar app NestJS
// AppModule: Módulo raiz da aplicação
// ValidationPipe: Pipe global para validação de DTOs
import { ValidationPipe } from "@nestjs/common";
// ConfigService: Serviço para acessar config/env
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
// Swagger: Para documentação da API
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

// Função bootstrap:Inicializa e configura a aplicação NestJS
// Lógica: Cria app, configura validação, Swagger, e inicia servidor
// Caso de uso: Ponto de entrada da aplicação
async function bootstrap() {
  // Cria instância da aplicação com AppModule
  const app = await NestFactory.create(AppModule);
  // Obtém ConfigService para variáveis de ambiente
  const configService = app.get(ConfigService);

  // Ativa validação global: Remove campos não whitelist, rejeita inválidos
  // whitelist: true - remove campos não definidos no DTO
  // forbidNonWhitelisted: true - lança erro se campo extra
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  // Configura Swagger para documentação da API
  // DocumentBuilder: Constrói config do Swagger
  const config = new DocumentBuilder()
    .setTitle("Newsly Portal API") // Título da API
    .setDescription("Documentação completa da API do Newsly Portal") // Descrição
    .setVersion("1.0") // Versão
    .addBearerAuth() // Adiciona auth Bearer (JWT)
    .build();
  // Cria documento Swagger
  const document = SwaggerModule.createDocument(app, config);
  // Configura rota /docs para acessar Swagger UI
  SwaggerModule.setup("/docs", app, document, {
    swaggerOptions: {
      persistAuthorization: true, // Mantém auth entre reloads
      displayRequestDuration: true, // Mostra tempo de resposta
    },
  });

  // Obtém porta do ambiente, padrão 3001
  const port = configService.get<string>("PORT");
  if (!port) {
    console.warn("PORT environment variable is not set. Using default port 3333.");
  }
  // Inicia servidor na porta especificada
  await app.listen(port ? Number(port) : 3333);
}
// Chama bootstrap para iniciar a app
void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "Unknown bootstrap error";
  console.error(message);
  process.exit(1);
});
