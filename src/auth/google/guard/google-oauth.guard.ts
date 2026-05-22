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
  // Assinatura genérica para compatibilidade com IAuthGuard
  handleRequest<TUser = any>(
    err: any,
    user: TUser | false | null,
    _info?: any,
    _context?: ExecutionContext,
    _status?: any,
  ): TUser {
    if (err) {
      this.logger.error(`Erro na autenticação Google OAuth: ${err?.message ?? String(err)}`, err?.stack);
      throw new UnauthorizedException("Falha na autenticação com Google.");
    }
    if (!user) {
      this.logger.warn("Usuário não encontrado ou token inválido na autenticação Google.");
      throw new UnauthorizedException("Usuário não autorizado.");
    }
    // Log genérico: tenta extrair campos conhecidos se presentes
    try {
      const maybe = user as unknown as { email?: string; id?: string };
      this.logger.log(`Autenticação Google bem-sucedida para usuário: ${maybe.email || maybe.id}`);
    } catch {}

    return user as TUser;
  }
}
