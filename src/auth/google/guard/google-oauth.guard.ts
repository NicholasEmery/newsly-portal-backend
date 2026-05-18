import { ExecutionContext, Injectable, Logger, UnauthorizedException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class GoogleOauthGuard extends AuthGuard("google") {
  private readonly logger = new Logger(GoogleOauthGuard.name);

  override async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.log("Tentativa de autenticação via Google OAuth iniciada.");
    const isActive = await super.canActivate(context);
    return Boolean(isActive);
  }

  // Sobrescreve para tratamento personalizado de erros e sucesso
  handleRequest(
    err: Error | null,
    user: { email?: string; id?: string } | false | null,
    _info: unknown,
    _context: ExecutionContext,
  ): { email?: string; id?: string } {
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
