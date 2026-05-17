import { Test, TestingModule } from "@nestjs/testing";
import { LocalService } from "../local.service";
import { PrismaService } from "src/database/prisma.service";
import { TokensService } from "../../tokens.service";
import { CreateUsersService } from "src/users/create-users/create-users.service";
import { EmailService } from "src/common/services/email/email.service";
import { TokenHelper } from "../../util/generateTokens";
import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Cache } from "cache-manager";
import { UserLocalSignInDto } from "./dto/local-signin.dto";
import { UserLocalSignUpDto } from "./dto/local-signup.dto";
import { SessionDto } from "../dto/session.dto";

// Mocks
const mockPrismaService = {
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  localAuth: {
    findUnique: jest.fn(),
  },
  deviceSession: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

const mockTokensService = {
  signAccessToken: jest.fn(),
  issueRefreshToken: jest.fn(),
};

const mockCreateUsersService = {
  createUser: jest.fn(),
};

const mockEmailService = {
  sendEmail: jest.fn(),
};

const mockTokenHelper = {
  compareToken: jest.fn(),
  generateOpaqueToken: jest.fn(),
  hashToken: jest.fn(),
};

const mockCacheManager = {
  set: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
};

describe("LocalService", () => {
  let service: LocalService;
  let prismaService: PrismaService;
  let tokensService: TokensService;
  let createUsersService: CreateUsersService;
  let emailService: EmailService;
  let tokenHelper: TokenHelper;
  let cacheManager: Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocalService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TokensService,
          useValue: mockTokensService,
        },
        {
          provide: CreateUsersService,
          useValue: mockCreateUsersService,
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

    service = module.get<LocalService>(LocalService);
    prismaService = module.get<PrismaService>(PrismaService);
    tokensService = module.get<TokensService>(TokensService);
    createUsersService = module.get<CreateUsersService>(CreateUsersService);
    emailService = module.get<EmailService>(EmailService);
    tokenHelper = module.get<TokenHelper>(TokenHelper);
    cacheManager = module.get<Cache>(CACHE_MANAGER);

    jest.clearAllMocks();
  });

  describe("LoginFromLocal", () => {
    const localUser: UserLocalSignInDto = {
      email: "test@example.com",
      password: "password123",
    };
    const meta: SessionDto = {
      deviceId: "device-123",
      userAgent: "Mozilla/5.0",
      ip: "127.0.0.1",
    };

    it("deve logar usuário com credenciais válidas", async () => {
      const user = { id: "user-123" };
      const localAuth = { passwordHash: "hashed-password" };
      const session = { id: "session-456" };
      const accessToken = "access-token";
      const refreshToken = "refresh-token";

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.localAuth.findUnique.mockResolvedValue(localAuth);
      mockTokenHelper.compareToken.mockResolvedValue(true);
      mockPrismaService.deviceSession.findFirst.mockResolvedValue(session);
      mockTokensService.signAccessToken.mockResolvedValue(accessToken);
      mockTokensService.issueRefreshToken.mockResolvedValue(refreshToken);

      const result = await service.LoginFromLocal(localUser, meta);

      expect(result).toEqual({
        message: "Login local bem-sucedido",
        accessToken,
        refreshToken,
      });
    });

    it("deve lançar NotFoundException se usuário não existir", async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.LoginFromLocal(localUser, meta)).rejects.toThrow("Usuário não encontrado");
    });

    it("deve lançar BadRequestException se localAuth não existir", async () => {
      const user = { id: "user-123" };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.localAuth.findUnique.mockResolvedValue(null);

      await expect(service.LoginFromLocal(localUser, meta)).rejects.toThrow(
        "Houve um problema com a autenticação local",
      );
    });

    it("deve lançar BadRequestException se senha for incorreta", async () => {
      const user = { id: "user-123" };
      const localAuth = { passwordHash: "hashed-password" };

      mockPrismaService.user.findUnique.mockResolvedValue(user);
      mockPrismaService.localAuth.findUnique.mockResolvedValue(localAuth);
      mockTokenHelper.compareToken.mockResolvedValue(false);

      await expect(service.LoginFromLocal(localUser, meta)).rejects.toThrow("Senha incorreta");
    });
  });

  describe("SignUpFromLocal", () => {
    const localUser: UserLocalSignUpDto = {
      email: "newuser@example.com",
      firstName: "John",
      lastName: "Doe",
      password: "password123",
      photoFile: {} as any, // Mock file
    };
    const meta: SessionDto = {
      deviceId: "device-123",
      userAgent: "Mozilla/5.0",
      ip: "127.0.0.1",
    };

    it("deve registrar novo usuário e enviar email de verificação", async () => {
      const existingUser = null;
      const token = "verify-token";

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);
      mockTokenHelper.generateOpaqueToken.mockResolvedValue(token);
      mockCacheManager.set.mockResolvedValue(undefined);
      mockEmailService.sendEmail.mockResolvedValue(undefined);

      const result = await service.SignUpFromLocal(localUser, meta);

      expect(mockTokenHelper.generateOpaqueToken).toHaveBeenCalledWith(32);
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        `local-signup:${token}`,
        JSON.stringify({ localUser, meta }),
        86400000,
      );
      expect(mockEmailService.sendEmail).toHaveBeenCalledWith(localUser.email, "Verifique seu email", "verify-email", {
        token,
        userName: `${localUser.firstName} ${localUser.lastName}`,
        frontendUrl: process.env.FRONTEND_URL,
      });
      expect(result).toEqual({ message: "Email de verificação enviado." });
    });

    it("deve lançar BadRequestException se email já existir", async () => {
      const existingUser = { id: "user-123", email: "newuser@example.com" };

      mockPrismaService.user.findUnique.mockResolvedValue(existingUser);

      await expect(service.SignUpFromLocal(localUser, meta)).rejects.toThrow("Um usuário com este email já existe.");
    });
  });

  describe("confirmEmailVerification", () => {
    it("deve confirmar email e criar usuário", async () => {
      const token = "verify-token";
      const cachedData = {
        localUser: {
          email: "newuser@example.com",
          firstName: "John",
          lastName: "Doe",
          password: "password123",
          photoFile: {} as any,
        },
        meta: {
          deviceId: "device-123",
          userAgent: "Mozilla/5.0",
          ip: "127.0.0.1",
        },
      };
      const tokens = { accessTokenUser: "access-token", refreshTokenUser: "refresh-token" };

      mockCacheManager.get.mockResolvedValue(JSON.stringify(cachedData));
      mockCreateUsersService.createUser.mockResolvedValue(tokens);
      mockCacheManager.del.mockResolvedValue(undefined);

      const result = await service.confirmEmailVerification(token);

      expect(mockCreateUsersService.createUser).toHaveBeenCalledWith(undefined, cachedData.localUser, cachedData.meta);
      expect(mockCacheManager.del).toHaveBeenCalledWith(`local-signup:${token}`);
      expect(result).toEqual({
        message: "Email verificado e conta criada com sucesso.",
        accessToken: tokens.accessTokenUser,
        refreshToken: tokens.refreshTokenUser,
      });
    });

    it("deve lançar BadRequestException se token for inválido", async () => {
      const token = "invalid-token";

      mockCacheManager.get.mockResolvedValue(null);

      await expect(service.confirmEmailVerification(token)).rejects.toThrow("Token inválido ou expirado.");
    });
  });
});
