import { Injectable, Inject, BadRequestException, NotFoundException } from "@nestjs/common";
import { UserGoogleDto } from "./dto/userGoogle.dto";
import { PrismaService } from "src/database/prisma.service";
import { CreateUsersService } from "src/users/create-users/create-users.service";
import { SessionDto } from "../dto/session.dto";
import { TokensService } from "../tokens.service";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { EmailService } from "src/common/services/email/email.service";
import { TokenHelper } from "../util/generateTokens";

@Injectable()
export class GoogleService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: CreateUsersService,
    private readonly tokensService: TokensService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly emailService: EmailService,
    private readonly tokenHelper: TokenHelper,
  ) {}

  async validateLoginOrCreateUserFromGoogle(
    provider: UserGoogleDto,
    meta: SessionDto,
  ): Promise<
    | { message: string; accessToken: string; refreshToken: string }
    | { message: string; user: { name: string; email: string; picture: string } }
  > {
    // Buscar autenticação social existente
    const socialAuth = await this.prisma.socialAuth.findUnique({
      where: {
        provider_providerId: {
          provider: provider.provider,
          providerId: provider.providerId,
        },
      },
      include: { user: true },
    });

    if (socialAuth?.user) {
      // SocialAuth existe, logar diretamente
      const userId = socialAuth.user.id;

      // Verificar ou criar sessão para o dispositivo
      let session = await this.prisma.deviceSession.findFirst({
        where: {
          userId,
          deviceId: meta.deviceId,
        },
      });

      if (!session) {
        session = await this.prisma.deviceSession.create({
          data: {
            user: { connect: { id: userId } },
            deviceId: meta.deviceId,
            userAgent: meta.userAgent,
            ip: meta.ip,
          },
        });
      }

      // Gerar tokens usando TokensService
      const accessToken = await this.tokensService.signAccessToken(userId, session.id);
      const refreshToken = await this.tokensService.issueRefreshToken(session.id);
      const message = "Usuário autenticado com sucesso via Google.";

      return { message, accessToken, refreshToken };
    } else {
      // Verificar se usuário existe por email
      const existingUser = await this.prisma.user.findUnique({
        where: { email: provider.email },
        select: { name: true, email: true, photo: true },
      });

      if (existingUser) {
        // Usuário existe mas não tem socialAuth do Google, pedir confirmação
        const message = "Uma conta com este email já existe. Deseja vincular o Google a esta conta ou criar uma nova?";
        const user = {
          name: existingUser.name,
          email: existingUser.email,
          picture: existingUser.photo,
        };

        return { message, user };
      } else {
        // Usuário não existe, criar novo
        const { accessTokenUser, refreshTokenUser } = await this.userService.createUser(provider, undefined, meta);

        await this.prisma.user.update({
          where: { email: provider.email },
          data: { emailVerified: true },
        });

        const accessToken = accessTokenUser;
        const refreshToken = refreshTokenUser;

        await this.prisma.socialAuth.create({
          data: {
            provider: provider.provider,
            providerId: provider.providerId,
            user: {
              connect: {
                email: provider.email,
              },
            },
          },
        });

        const message = "Usuário criado e autenticado com sucesso via Google.";

        return { message, accessToken, refreshToken };
      }
    }
  }

  // Método para iniciar link do Google a usuário existente (envia email)
  async linkGoogleToUser(email: string, provider: UserGoogleDto, meta: SessionDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException("Usuário não encontrado.");

    // Gerar token único
    const token = await this.tokenHelper.generateOpaqueToken(32);

    // Armazenar no Redis com TTL (10 min)
    const data = JSON.stringify({ userId: user.id, provider, meta });
    await this.cacheManager.set(`google-link:${token}`, data, 600000); // 10 min em ms

    // Enviar email
    await this.emailService.sendEmail(user.email, "Confirme vinculação do Google", "google-link", {
      token,
      userName: user.name,
      frontendUrl: process.env.FRONTEND_URL,
    });

    return { message: "Email de confirmação enviado." };
  }

  // Método para confirmar link via token
  async confirmGoogleLink(token: string): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    const cached = await this.cacheManager.get(`google-link:${token}`);
    if (!cached) throw new BadRequestException("Token inválido ou expirado.");

    const { userId, provider, meta } = JSON.parse(cached as string);

    // Criar socialAuth
    await this.prisma.socialAuth.create({
      data: {
        user: { connect: { id: userId } },
        provider: provider.provider,
        providerId: provider.providerId,
      },
    });

    // Remover do cache
    await this.cacheManager.del(`google-link:${token}`);

    // Verificar ou criar sessão para o dispositivo
    let session = await this.prisma.deviceSession.findFirst({
      where: {
        userId,
        deviceId: meta.deviceId,
      },
    });

    if (!session) {
      session = await this.prisma.deviceSession.create({
        data: {
          user: { connect: { id: userId } },
          deviceId: meta.deviceId,
          userAgent: meta.userAgent,
          ip: meta.ip,
        },
      });
    }

    const accessToken = await this.tokensService.signAccessToken(userId, session.id);
    const refreshToken = await this.tokensService.issueRefreshToken(session.id);
    const message = "Google vinculado com sucesso.";

    return { message, accessToken, refreshToken };
  }
}
