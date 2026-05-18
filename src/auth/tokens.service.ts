import { Injectable, InternalServerErrorException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/database/prisma.service";
import { TokenHelper } from "./util/generateTokens";

@Injectable()
export class TokensService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private tokenHelper: TokenHelper,
  ) {}

  signAccessToken(userId: string, sessionId: string) {
    const payload = { sub: userId, sid: sessionId };
    if (!process.env.ACCESS_EXPIRES_IN) {
      throw new InternalServerErrorException("ACCESS_EXPIRES_IN não está definido nas variáveis de ambiente");
    }

    // Usa a variável de ambiente diretamente (pode ser string como '15d' ou número em segundos)
    const expiresIn = process.env.ACCESS_EXPIRES_IN;
    const accessToken = this.jwtService.sign(payload, { expiresIn: expiresIn as any });
    return accessToken;
  }

  async issueRefreshToken(sessionId: string) {
    const token = await this.tokenHelper.generateOpaqueToken(48);
    const expires = new Date();

    if (!process.env.REFRESH_EXPIRES_DAYS) {
      throw new InternalServerErrorException("REFRESH_EXPIRES_DAYS não está definido nas variáveis de ambiente");
    }

    expires.setDate(expires.getDate() + Number(process.env.REFRESH_EXPIRES_DAYS));

    const hash = await this.tokenHelper.hashToken(token);
    await this.prisma.deviceSession.update({
      where: { id: sessionId },
      data: { refreshTokenHash: hash, refreshExpiresAt: expires },
    });

    return token;
  }

  async refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    // Encontrar sessão com refresh token válido
    const sessions = await this.prisma.deviceSession.findMany({
      where: {
        refreshExpiresAt: { gt: new Date() },
      },
    });

    let validSession = null;
    for (const session of sessions) {
      if (session.refreshTokenHash && (await this.tokenHelper.compareToken(refreshToken, session.refreshTokenHash))) {
        validSession = session;
        break;
      }
    }

    if (!validSession) {
      throw new UnauthorizedException("Refresh token inválido ou expirado");
    }

    // Gerar novos tokens
    const newAccessToken = await this.signAccessToken(validSession.userId, validSession.id);
    const newRefreshToken = await this.issueRefreshToken(validSession.id);

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }
}
