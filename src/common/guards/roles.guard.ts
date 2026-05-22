import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthenticatedRequest } from "../interfaces/auth.interface";
import { ROLES_KEY } from "../decorators/roles.decorator";

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const user = request.user;

    if (!user || !user.role) {
      throw new UnauthorizedException("Usuário não autenticado ou role ausente");
    }

    const hasRequiredRole = requiredRoles.some((role) => user.role === role);

    if (!hasRequiredRole) {
      throw new ForbiddenException("Usuário não possui o nível de acesso necessário");
    }

    return true;
  }
}
