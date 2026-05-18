import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Request } from "express";
import { PrismaService } from "src/database/prisma.service";

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request & { user?: { id: string; role: unknown } }>();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException("Token não fornecido");
    }

    try {
      const payload = await this.jwtService.verifyAsync<{ sub: string; sid?: string; sessionId?: string }>(token);
      const userId = payload.sub;
      const sessionId = payload.sid ?? payload.sessionId;

      if (!sessionId) {
        throw new UnauthorizedException("Sessão inválida");
      }

      // Verificar se a sessão existe
      const session = await this.prisma.deviceSession.findUnique({
        where: { id: sessionId },
        include: { user: true },
      });

      if (!session || session.userId !== userId) {
        throw new UnauthorizedException("Sessão inválida");
      }

      request.user = {
        id: session.user.id,
        role: session.user.role,
        // Adicione outros campos não sensíveis se necessário (ex.: name)
      };

      return true;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException("Token inválido ou expirado");
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(" ") ?? [];
    return type === "Bearer" && typeof token === "string" ? token : undefined;
  }
}
