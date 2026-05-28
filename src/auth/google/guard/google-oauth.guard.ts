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
  handleRequest<TUser = unknown>(
    err: unknown,
    user: TUser | false | null,
    _info?: unknown,
    _context?: ExecutionContext,
    _status?: unknown,
  ): TUser {
    if (err) {
      let message = "Unknown error";
      let stack: string | undefined;
      if (err instanceof Error) {
        message = err.message;
        stack = err.stack;
      } else {
        try {
          message = JSON.stringify(err as unknown);
        } catch {
          message = Object.prototype.toString.call(err as unknown);
        }
      }
      this.logger.error(`Erro na autenticação Google OAuth: ${message}`, stack);
      throw new UnauthorizedException("Falha na autenticação com Google.");
    }
    if (!user) {
      this.logger.warn("Usuário não encontrado ou token inválido na autenticação Google.");
      throw new UnauthorizedException("Usuário não autorizado.");
    }
    // Log genérico: tenta extrair campos conhecidos se presentes
    const maybe = user && typeof user === "object" ? (user as Record<string, unknown>) : {};
    const email = typeof maybe.email === "string" ? maybe.email : undefined;
    const id = typeof maybe.id === "string" ? maybe.id : undefined;
    if (email || id) this.logger.log(`Autenticação Google bem-sucedida para usuário: ${email || id}`);

    return user as TUser;
  }
}
