import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "src/database/prisma.service";
import { TokensService } from "./tokens.service";
import { TokenHelper } from "./util/generateTokens";

const mockJwtService = {
  sign: jest.fn(),
};

const mockPrismaService = {
  deviceSession: {
    update: jest.fn(),
    findMany: jest.fn(),
  },
};

const mockTokenHelper = {
  generateOpaqueToken: jest.fn(),
  hashToken: jest.fn(),
  compareToken: jest.fn(),
};

describe("TokensService", () => {
  let service: TokensService;

  type DeviceSessionUpdateArgs = {
    where: { id: string };
    data: {
      refreshTokenHash: string;
      refreshExpiresAt: Date;
    };
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: TokenHelper,
          useValue: mockTokenHelper,
        },
      ],
    }).compile();

    service = module.get<TokensService>(TokensService);

    jest.clearAllMocks();

    process.env.ACCESS_EXPIRES_IN = "15d";
    process.env.REFRESH_EXPIRES_DAYS = "30";
  });

  describe("signAccessToken", () => {
    it("deve gerar um token de acesso com sucesso", () => {
      process.env.ACCESS_EXPIRES_IN = "15d";

      const userId = "user-123";
      const sessionId = "session-456";
      const expectedToken = "access-token-jwt";

      mockJwtService.sign.mockReturnValue(expectedToken);

      const result = service.signAccessToken(userId, sessionId);

      expect(mockJwtService.sign).toHaveBeenCalledWith({ sub: userId, sid: sessionId }, { expiresIn: "15d" });
      expect(result).toBe(expectedToken);
    });

    it("deve lançar InternalServerErrorException se ACCESS_EXPIRES_IN não estiver definido", () => {
      delete process.env.ACCESS_EXPIRES_IN;

      expect(() => service.signAccessToken("user-123", "session-456")).toThrow(
        "ACCESS_EXPIRES_IN não está definido nas variáveis de ambiente",
      );
    });
  });

  describe("issueRefreshToken", () => {
    it("deve emitir um token de refresh com sucesso", async () => {
      process.env.REFRESH_EXPIRES_DAYS = "30";

      const sessionId = "session-456";
      const token = "refresh-token-opaque";
      const hashedToken = "hashed-token";
      const expectedToken = token;

      mockTokenHelper.generateOpaqueToken.mockReturnValue(token);
      mockTokenHelper.hashToken.mockResolvedValue(hashedToken);
      mockPrismaService.deviceSession.update.mockResolvedValue({
        refreshTokenHash: hashedToken,
        refreshExpiresAt: new Date(),
      });

      await expect(service.issueRefreshToken(sessionId)).resolves.toBe(expectedToken);

      expect(mockTokenHelper.generateOpaqueToken).toHaveBeenCalledWith(48);
      expect(mockTokenHelper.hashToken).toHaveBeenCalledWith(token);
      const [[updateArgs]] = mockPrismaService.deviceSession.update.mock.calls as unknown as [
        [DeviceSessionUpdateArgs],
      ];

      expect(updateArgs).toMatchObject({
        where: { id: sessionId },
        data: {
          refreshTokenHash: hashedToken,
        },
      });
      expect(updateArgs.data.refreshExpiresAt).toBeInstanceOf(Date);
    });

    it("deve lançar InternalServerErrorException se REFRESH_EXPIRES_DAYS não estiver definido", async () => {
      delete process.env.REFRESH_EXPIRES_DAYS;

      await expect(service.issueRefreshToken("session-456")).rejects.toThrow(
        "REFRESH_EXPIRES_DAYS não está definido nas variáveis de ambiente",
      );
    });
  });

  describe("refreshTokens", () => {
    it("deve renovar tokens com sucesso quando o refresh token é válido", async () => {
      const refreshToken = "valid-refresh-token";
      const hashedToken = "hashed-valid-token";
      const session = {
        id: "session-456",
        userId: "user-123",
        refreshTokenHash: hashedToken,
      };
      const newAccessToken = "new-access-token";
      const newRefreshToken = "new-refresh-token";

      mockPrismaService.deviceSession.findMany.mockResolvedValue([session]);
      mockTokenHelper.compareToken.mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue(newAccessToken);
      mockTokenHelper.generateOpaqueToken.mockResolvedValue(newRefreshToken);
      mockTokenHelper.hashToken.mockResolvedValue("new-hashed-token");
      mockPrismaService.deviceSession.update.mockResolvedValue({});

      const result = await service.refreshTokens(refreshToken);

      expect(result).toEqual({
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    });

    it("deve lançar UnauthorizedException se o refresh token for inválido", async () => {
      const refreshToken = "invalid-refresh-token";

      mockPrismaService.deviceSession.findMany.mockResolvedValue([]);

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow("Refresh token inválido ou expirado");
    });

    it("deve lançar UnauthorizedException se o hash do token não corresponder", async () => {
      const refreshToken = "refresh-token";
      const session = {
        id: "session-456",
        userId: "user-123",
        refreshTokenHash: "different-hash",
      };

      mockPrismaService.deviceSession.findMany.mockResolvedValue([session]);
      mockTokenHelper.compareToken.mockResolvedValue(false);

      await expect(service.refreshTokens(refreshToken)).rejects.toThrow("Refresh token inválido ou expirado");
    });
  });
});
