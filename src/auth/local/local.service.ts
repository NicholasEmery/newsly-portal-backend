import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Injectable, Inject, BadRequestException, NotFoundException } from "@nestjs/common";
import { Cache } from "cache-manager";
import { EmailService } from "src/common/services/email/email.service";
import { PrismaService } from "src/database/prisma.service";
import { CreateUsersService } from "src/users/create-users/create-users.service";
import { TokensService } from "../tokens.service";
import { UserLocalSignInDto } from "./dto/local-signin.dto";
import { UserLocalSignUpDto } from "./dto/local-signup.dto";
import { SessionDto } from "../dto/session.dto";
import { TokenHelper } from "../util/generateTokens";
import { resolveFrontendUrl } from "src/common/config/environment";

type LocalSignupCachePayload = {
  localUser: UserLocalSignUpDto;
  meta: SessionDto;
};

type PasswordResetCachePayload = {
  userId: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isLocalSignupCachePayload(value: unknown): value is LocalSignupCachePayload {
  return (
    isRecord(value) &&
    isRecord(value.localUser) &&
    typeof value.localUser.email === "string" &&
    typeof value.localUser.firstName === "string" &&
    typeof value.localUser.lastName === "string" &&
    typeof value.localUser.password === "string" &&
    isRecord(value.meta) &&
    typeof value.meta.deviceId === "string" &&
    typeof value.meta.userAgent === "string" &&
    typeof value.meta.ip === "string"
  );
}

function isPasswordResetCachePayload(value: unknown): value is PasswordResetCachePayload {
  return isRecord(value) && typeof value.userId === "string";
}

@Injectable()
export class LocalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokensService: TokensService,
    private readonly userService: CreateUsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly emailService: EmailService,
    private readonly tokenHelper: TokenHelper,
  ) {}

  async LoginFromLocal(
    localUser: UserLocalSignInDto,
    meta: SessionDto,
  ): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    // Implementar lógica de login local aqui
    const user = await this.prisma.user.findUnique({
      where: { email: localUser.email },
    });

    if (!user) {
      throw new NotFoundException("Usuário não encontrado");
    }

    const localAuth = await this.prisma.localAuth.findUnique({
      where: { userId: user.id },
      select: { passwordHash: true },
    });

    if (!localAuth) {
      throw new BadRequestException("Houve um problema com a autenticação local");
    }

    // Supondo que a senha está armazenada como hash
    const passwordValid = await this.tokenHelper.compareToken(localUser.password, localAuth.passwordHash);

    if (!passwordValid) {
      throw new BadRequestException("Senha incorreta");
    }

    // Verificar ou criar sessão para o dispositivo
    let session = await this.prisma.deviceSession.findFirst({
      where: {
        userId: user.id,
        deviceId: meta.deviceId,
      },
    });

    if (!session) {
      session = await this.prisma.deviceSession.create({
        data: {
          user: { connect: { id: user.id } },
          deviceId: meta.deviceId,
          userAgent: meta.userAgent,
          ip: meta.ip,
        },
      });
    }

    // Aqui você geraria os tokens JWT de acesso e refresh
    // Exemplo fictício:
    // Gerar tokens usando TokensService
    const accessToken = this.tokensService.signAccessToken(user.id, session.id);
    const refreshToken = await this.tokensService.issueRefreshToken(session.id);

    return { message: "Login local bem-sucedido", accessToken, refreshToken };
  }

  async SignUpFromLocal(localUser: UserLocalSignUpDto, meta: SessionDto): Promise<{ message: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: localUser.email },
    });

    if (existingUser) {
      throw new BadRequestException("Um usuário com este email já existe.");
    }

    // Gerar token único
    const token = this.tokenHelper.generateOpaqueToken(32);

    // Armazenar no Redis com TTL (24 horas)
    const data = JSON.stringify({ localUser, meta });
    await this.cacheManager.set(`local-signup:${token}`, data, 86400000); // 24 horas em ms

    // Enviar email
    await this.emailService.sendEmail(localUser.email, "Verifique seu email", "verify-email", {
      token,
      userName: `${localUser.firstName} ${localUser.lastName}`,
      frontendUrl: resolveFrontendUrl(),
    });

    return { message: "Email de verificação enviado." };
  }

  // Método para confirmar verificação de email
  async confirmEmailVerification(
    token: string,
  ): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    const cached = await Promise.resolve(this.cacheManager.get<string>(`local-signup:${token}`));
    if (!cached) throw new BadRequestException("Token inválido ou expirado.");

    const parsed: unknown = JSON.parse(cached);
    if (!isLocalSignupCachePayload(parsed)) {
      throw new BadRequestException("Token inválido ou expirado.");
    }
    const { localUser, meta } = parsed;

    // Criar usuário
    const { accessTokenUser, refreshTokenUser } = await this.userService.createUser(undefined, localUser, meta);

    await this.prisma.user.update({
      where: { email: localUser.email },
      data: { emailVerified: true },
    });

    // Remover do cache
    await this.cacheManager.del(`local-signup:${token}`);

    const message = "Email verificado e conta criada com sucesso.";
    const accessToken = accessTokenUser;
    const refreshToken = refreshTokenUser;

    return { message, accessToken, refreshToken };
  }

  async initiatePasswordReset(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new NotFoundException("Usuário com este email não encontrado.");
    }

    // Gerar token único
    const token = this.tokenHelper.generateOpaqueToken(32);

    // Armazenar no Redis com TTL (1 hora)
    const data = JSON.stringify({ userId: user.id });
    await this.cacheManager.set(`password-reset:${token}`, data, 3600000); // 1 hora em ms

    // Enviar email
    await this.emailService.sendEmail(email, "Redefinição de senha", "reset-password", {
      token,
      userName: user.name,
      frontendUrl: resolveFrontendUrl(),
    });

    return true;
  }

  async confirmPasswordReset(token: string, newPassword: string): Promise<boolean> {
    const cached = await Promise.resolve(this.cacheManager.get<string>(`password-reset:${token}`));
    if (!cached) throw new BadRequestException("Token inválido ou expirado.");
    const parsed: unknown = JSON.parse(cached);
    if (!isPasswordResetCachePayload(parsed)) {
      throw new BadRequestException("Token inválido ou expirado.");
    }
    const { userId } = parsed;

    const passwordHash = await this.tokenHelper.hashToken(newPassword);

    await this.prisma.localAuth.update({
      where: { userId },
      data: { passwordHash },
    });

    await this.prisma.deviceSession.deleteMany({
      where: { userId },
    });

    await this.cacheManager.del(`password-reset:${token}`);

    return true;
  }
}
