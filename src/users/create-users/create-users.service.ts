// Importações necessárias para o serviço
// Injectable: Decorator do NestJS para marcar a classe como injetável, permitindo injeção de dependências
import { BadRequestException, Injectable } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { SessionDto } from "src/auth/dto/session.dto";
import { UserGoogleDto } from "src/auth/google/dto/userGoogle.dto";
import { UserLocalSignUpDto } from "src/auth/local/dto/local-signup.dto";
import { UploadsService } from "src/common/services/upload/uploads.service";
import { PrismaService } from "src/database/prisma.service";
import { TokensService } from "../../auth/tokens.service";

// Classe CreateUsersService: Serviço responsável por criar usuários no sistema
// Agora delega para UserOperationsService para evitar redundância
// Casos de uso: Registro de novos usuários, integração com OAuth
@Injectable()
export class CreateUsersService {
  // Construtor: Injeta o UserOperationsService central
  constructor(
    private readonly uploadService: UploadsService,
    private readonly tokensService: TokensService,
    private readonly prisma: PrismaService,
  ) {}

  async createUser(
    provider?: UserGoogleDto /*| UserFacebookDto*/,
    localUser?: UserLocalSignUpDto,
    meta?: SessionDto, // meta agora é obrigatório
  ): Promise<{ accessTokenUser: string; refreshTokenUser: string }> {
    let newUser;

    if (provider) {
      const name = `${provider.given_name} ${provider.family_name}`;
      const AdjustName = name.replace(/\b\w/g, (c) => c.toUpperCase());

      const photoUrl = await this.uploadService.downloadAndSaveFile(provider.picture);

      newUser = await this.prisma.user.create({
        data: {
          email: provider.email,
          name: AdjustName,
          photo: photoUrl,
          role: provider.role ? provider.role : null,
        },
      });
    }

    if (localUser) {
      const name = `${localUser.firstName} ${localUser.lastName}`;
      const AdjustName = name.replace(/\b\w/g, (c) => c.toUpperCase());

      const photoUrl = await this.uploadService.saveUploadedFile(localUser.photoFile);

      const passwordHashed = bcrypt.hashSync(localUser.password, 10);

      newUser = await this.prisma.user.create({
        data: {
          email: localUser.email,
          name: AdjustName,
          photo: photoUrl,
          role: localUser.role ? localUser.role : null,
        },
      });

      await this.prisma.localAuth.create({
        data: {
          user: { connect: { id: newUser.id } },
          passwordHash: passwordHashed,
        },
      });
    }

    if (!newUser) {
      throw new BadRequestException("Houve um problema ao criar o usuário.");
    }

    if (!meta) {
      throw new BadRequestException("Dados de sessão (meta) são obrigatórios para criar tokens.");
    }

    // Criar sessão do dispositivo
    const session = await this.prisma.deviceSession.create({
      data: {
        user: { connect: { id: newUser.id } },
        deviceId: meta.deviceId,
        userAgent: meta.userAgent,
        ip: meta.ip,
      },
    });

    // Gerar tokens
    const accessTokenUser = await this.tokensService.signAccessToken(newUser.id, session.id);
    const refreshTokenUser = await this.tokensService.issueRefreshToken(session.id);

    return { accessTokenUser, refreshTokenUser };
  }
}
