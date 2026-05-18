import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Test, TestingModule } from "@nestjs/testing";
import { Cache } from "cache-manager";
import { EmailService } from "src/common/services/email/email.service";
import { PrismaService } from "src/database/prisma.service";
import { CreateUsersService } from "src/users/create-users/create-users.service";
import { SessionDto } from "../../dto/session.dto";
import { TokensService } from "../../tokens.service";
import { TokenHelper } from "../../util/generateTokens";
import { UserGoogleDto } from "../dto/userGoogle.dto";
import { GoogleService } from "../google.service";

// Mocks
const mockPrismaService = {
  socialAuth: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  deviceSession: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
};

const mockCreateUsersService = {
  createUser: jest.fn(),
};

const mockTokensService = {
  signAccessToken: jest.fn(),
  issueRefreshToken: jest.fn(),
};

const mockEmailService = {
  sendEmail: jest.fn(),
};

const mockTokenHelper = {
  generateOpaqueToken: jest.fn(),
};

const mockCacheManager = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};

describe("GoogleService", () => {
  let service: GoogleService;
  let prismaService: PrismaService;
  let createUsersService: CreateUsersService;
  let tokensService: TokensService;
  let emailService: EmailService;
  let tokenHelper: TokenHelper;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GoogleService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: CreateUsersService,
          useValue: mockCreateUsersService,
        },
        {
          provide: TokensService,
          useValue: mockTokensService,
        },
        {
          provide: EmailService,
          useValue: mockEmailService,
        },
        {
          provide: TokenHelper,
          useValue: mockTokenHelper,
        },
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
      ],
    }).compile();

    service = module.get<GoogleService>(GoogleService);
    prismaService = module.get<PrismaService>(PrismaService);
    createUsersService = module.get<CreateUsersService>(CreateUsersService);
    tokensService = module.get<TokensService>(TokensService);
    emailService = module.get<EmailService>(EmailService);
    tokenHelper = module.get<TokenHelper>(TokenHelper);
    cacheManager = module.get<Cache>(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  describe("validateLoginOrCreateUserFromGoogle", () => {
    const provider: UserGoogleDto = {
      email: "test@example.com",
      given_name: "John",
      family_name: "Doe",
      picture: "http://example.com/photo.jpg",
      provider: "google",
      providerId: "google-id-123",
    };
    const meta: SessionDto = {
      deviceId: "device-123",
      userAgent: "Mozilla/5.0",
      ip: "127.0.0.1",
    };

    it("deve logar usuário existente com socialAuth", async () => {
      const socialAuth = {
        user: { id: "user-123" },
      };
      const session = { id: "session-456" };
      const accessToken = "access-token";
      const refreshToken = "refresh-token";

      mockPrismaService.socialAuth.findUnique.mockResolvedValue(socialAuth);
      mockPrismaService.deviceSession.findFirst.mockResolvedValue(session);
      mockTokensService.signAccessToken.mockResolvedValue(accessToken);
      mockTokensService.issueRefreshToken.mockResolvedValue(refreshToken);

      const result = await service.validateLoginOrCreateUserFromGoogle(provider, meta);

      expect(result).toEqual({
        message: "Usuário autenticado com sucesso via Google.",
        accessToken,
        refreshToken,
      });
    });

    it("deve criar nova sessão se não existir", async () => {
      const socialAuth = {
        user: { id: "user-123" },
      };
      const newSession = { id: "new-session-456" };
      const accessToken = "access-token";
      const refreshToken = "refresh-token";

      mockPrismaService.socialAuth.findUnique.mockResolvedValue(socialAuth);
      mockPrismaService.deviceSession.findFirst.mockResolvedValue(null);
      mockPrismaService.deviceSession.create.mockResolvedValue(newSession);
      mockTokensService.signAccessToken.mockResolvedValue(accessToken);
      mockTokensService.issueRefreshToken.mockResolvedValue(refreshToken);

      await service.validateLoginOrCreateUserFromGoogle(provider, meta);

      expect(mockPrismaService.deviceSession.create).toHaveBeenCalledWith({
        data: {
          user: { connect: { id: "user-123" } },
          deviceId: meta.deviceId,
          userAgent: meta.userAgent,
          ip: meta.ip,
        },
      });
    });

    it("deve retornar prompt para vincular se usuário existir por email mas sem socialAuth", async () => {
      const existingUser = {
        name: "Existing User",
        email: "test@example.com",
        photo: "http://example.com/existing.jpg",
      };

      mockPrismaService.socialAuth.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      const result = await service.validateLoginOrCreateUserFromGoogle(provider, meta);

      expect(result).toEqual({
        message: "Uma conta com este email já existe. Deseja vincular o Google a esta conta ou criar uma nova?",
        user: {
          name: existingUser.name,
          email: existingUser.email,
          picture: existingUser.photo,
        },
      });
    });

    it("deve criar novo usuário se não existir", async () => {
      const tokens = { accessTokenUser: "access-token", refreshTokenUser: "refresh-token" };

      mockPrismaService.socialAuth.findUnique.mockResolvedValue(null);
      mockPrismaService.user.findUnique.mockResolvedValue(null);
      mockCreateUsersService.createUser.mockResolvedValue(tokens);
      mockPrismaService.socialAuth.create.mockResolvedValue({});

      const result = await service.validateLoginOrCreateUserFromGoogle(provider, meta);

      expect(mockCreateUsersService.createUser).toHaveBeenCalledWith(provider, undefined, meta);
      expect(mockPrismaService.socialAuth.create).toHaveBeenCalledWith({
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
      expect(result).toEqual({
        message: "Usuário criado e autenticado com sucesso via Google.",
        accessToken: tokens.accessTokenUser,
        refreshToken: tokens.refreshTokenUser,
      });
    });
  });

  describe("linkGoogleToUser", () => {
    it("deve enviar email de confirmação para vinculação", async () => {
      const email = "user@example.com";
      const provider: UserGoogleDto = {
        email: "google@example.com",
        given_name: "John",
        family_name: "Doe",
        picture: "http://example.com/photo.jpg",
        provider: "google",
        providerId: "google-id-123",
      };
      const meta: SessionDto = {
        deviceId: "device-123",
        userAgent: "Mozilla/5.0",
        ip: "127.0.0.1",
      };
      const user = { id: "user-123", email, name: "Test User" };
      const token = "link-token";

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockTokenHelper.generateOpaqueToken.mockResolvedValue(token);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockEmailService.sendEmail.mockResolvedValue(undefined);

      const result = await service.linkGoogleToUser(email, provider, meta);

      expect(mockTokenHelper.generateOpaqueToken).toHaveBeenCalledWith(32);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `google-link:${token}`,
        JSON.stringify({ userId: user.id, provider, meta }),
        600000,
      );
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(
        user.email,
        "Confirme vinculação do Google",
        "google-link",
        {
          token,
          userName: user.name,
          frontendUrl: process.env.FRONTEND_URL,
        },
      );
      expect(result).toEqual({ message: "Email de confirmação enviado." });
    });

    it("deve lançar NotFoundException se usuário não existir", async () => {
      const email = "nonexistent@example.com";
      const provider: UserGoogleDto = {
        email: "google@example.com",
        given_name: "John",
        family_name: "Doe",
        picture: "http://example.com/photo.jpg",
        provider: "google",
        providerId: "google-id-123",
      };
      const meta: SessionDto = {
        deviceId: "device-123",
        userAgent: "Mozilla/5.0",
        ip: "127.0.0.1",
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.linkGoogleToUser(email, provider, meta)).rejects.toThrow("Usuário não encontrado.");
    });
  });

  describe("confirmGoogleLink", () => {
    it("deve confirmar vinculação e gerar tokens", async () => {
      const token = "link-token";
      const cachedData = {
        userId: "user-123",
        provider: {
          email: "google@example.com",
          given_name: "John",
          family_name: "Doe",
          picture: "http://example.com/photo.jpg",
          provider: "google",
          providerId: "google-id-123",
        },
        meta: {
          deviceId: "device-123",
          userAgent: "Mozilla/5.0",
          ip: "127.0.0.1",
        },
      };
      const session = { id: "session-456" };
      const accessToken = "access-token";
      const refreshToken = "refresh-token";

      mockCacheManager.get.mockResolvedValue(JSON.stringify(cachedData));
      mockPrismaService.deviceSession.findFirst.mockResolvedValue(session);
      mockTokensService.signAccessToken.mockResolvedValue(accessToken);
      mockTokensService.issueRefreshToken.mockResolvedValue(refreshToken);
      mockPrismaService.socialAuth.create.mockResolvedValue({});
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await service.confirmGoogleLink(token);

      expect(mockCacheManager.get).toHaveBeenCalledWith(`google-link:${token}`);
      expect(mockPrismaService.socialAuth.create).toHaveBeenCalledWith({
        data: {
          provider: cachedData.provider.provider,
          providerId: cachedData.provider.providerId,
          user: {
            connect: {
              id: cachedData.userId,
            },
          },
        },
      });
      expect(mockCacheManager.del).toHaveBeenCalledWith(`google-link:${token}`);
      expect(result).toEqual({
        message: "Google vinculado com sucesso.",
        accessToken,
        refreshToken,
      });
    });

    it("deve lançar BadRequestException se token for inválido", async () => {
      const token = "invalid-token";

      mockCacheManager.get.mockResolvedValue(null);

      await expect(service.confirmGoogleLink(token)).rejects.toThrow("Token inválido ou expirado.");
    });
  });
});
