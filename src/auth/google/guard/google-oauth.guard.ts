import { ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class GoogleOauthGuard extends AuthGuard("google") {
  private readonly logger = new Logger(GoogleOauthGuard.name);

  override canActivate(context: ExecutionContext): boolean | Promise<boolean> {
    this.logger.log("Tentativa de autenticação via Google OAuth iniciada.");
    return super.canActivate(context) as boolean | Promise<boolean>;
  }

  // Sobrescreve para tratamento personalizado de erros e sucesso
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err) {
      this.logger.error(`Erro na autenticação Google OAuth: ${err.message}`, err.stack);
      throw new UnauthorizedException("Falha na autenticação com Google.");
    }
    if (!user) {
      this.logger.warn("Usuário não encontrado ou token inválido na autenticação Google.");
      throw new UnauthorizedException("Usuário não autorizado.");
    }
    this.logger.log(`Autenticação Google bem-sucedida para usuário: ${user.email || user.id}`);

    return user;
  }
}
