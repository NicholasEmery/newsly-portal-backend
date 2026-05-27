import { ExecutionContext } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "src/database/prisma.service";
import { AuthGuard } from "../common/guards/auth.guard";

type MockRequest = {
  headers: {
    authorization?: string;
  };
  user?: {
    id: string;
    role: unknown;
  };
};

type GuardWithExtractor = {
  extractTokenFromHeader(request: { headers: { authorization?: string } }): string | undefined;
};

const createMockContext = (request: MockRequest): ExecutionContext =>
  ({
    switchToHttp: () => ({
      getRequest: () => request,
    }),
  }) as ExecutionContext;

const mockJwtService = {
  verifyAsync: jest.fn(),
};

const mockPrismaService = {
  deviceSession: {
    findUnique: jest.fn(),
  },
};

describe("AuthGuard", () => {
  let guard: AuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    guard = module.get<AuthGuard>(AuthGuard);

    jest.clearAllMocks();
  });

  describe("canActivate", () => {
    it("deve permitir acesso com token válido e sessão existente", async () => {
      const mockRequest: MockRequest = {
        headers: { authorization: "Bearer valid-token" },
        user: undefined,
      };
      const mockContext = createMockContext(mockRequest);

      const payload = { sub: "user-123", sessionId: "session-456" };
      const session = {
        id: "session-456",
        userId: "user-123",
        user: { id: "user-123", role: "ADMIN" },
      };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockPrismaService.deviceSession.findUnique.mockResolvedValue(session);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toEqual({
        id: session.user.id,
        role: session.user.role,
      });
    });

    it("deve lançar UnauthorizedException se o token não for fornecido", async () => {
      const mockRequest: MockRequest = {
        headers: {},
      };
      const mockContext = createMockContext(mockRequest);

      await expect(guard.canActivate(mockContext)).rejects.toThrow("Token não fornecido");
    });

    it("deve lançar UnauthorizedException se o header authorization não for Bearer", async () => {
      const mockRequest: MockRequest = {
        headers: { authorization: "Basic token" },
      };
      const mockContext = createMockContext(mockRequest);

      await expect(guard.canActivate(mockContext)).rejects.toThrow("Token não fornecido");
    });

    it("deve lançar UnauthorizedException se o JWT for inválido", async () => {
      const mockRequest: MockRequest = {
        headers: { authorization: "Bearer invalid-token" },
      };
      const mockContext = createMockContext(mockRequest);

      mockJwtService.verifyAsync.mockRejectedValue(new Error("Invalid token"));

      await expect(guard.canActivate(mockContext)).rejects.toThrow("Token inválido ou expirado");
    });

    it("deve lançar UnauthorizedException se a sessão não existir", async () => {
      const mockRequest: MockRequest = {
        headers: { authorization: "Bearer valid-token" },
      };
      const mockContext = createMockContext(mockRequest);

      const payload = { sub: "user-123", sessionId: "session-456" };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockPrismaService.deviceSession.findUnique.mockResolvedValue(null);

      await expect(guard.canActivate(mockContext)).rejects.toThrow("Sessão inválida");
    });

    it("deve lançar UnauthorizedException se o userId da sessão não corresponder", async () => {
      const mockRequest: MockRequest = {
        headers: { authorization: "Bearer valid-token" },
      };
      const mockContext = createMockContext(mockRequest);

      const payload = { sub: "user-123", sessionId: "session-456" };
      const session = {
        id: "session-456",
        userId: "different-user-789",
        user: { id: "different-user-789", role: "ADMIN" },
      };

      mockJwtService.verifyAsync.mockResolvedValue(payload);
      mockPrismaService.deviceSession.findUnique.mockResolvedValue(session);

      await expect(guard.canActivate(mockContext)).rejects.toThrow("Sessão inválida");
    });
  });

  describe("extractTokenFromHeader", () => {
    it("deve extrair o token corretamente do header Bearer", () => {
      const request = { headers: { authorization: "Bearer my-token" } };
      const token = (guard as unknown as GuardWithExtractor).extractTokenFromHeader(request);
      expect(token).toBe("my-token");
    });

    it("deve retornar undefined se o header não for Bearer", () => {
      const request = { headers: { authorization: "Basic my-token" } };
      const token = (guard as unknown as GuardWithExtractor).extractTokenFromHeader(request);
      expect(token).toBeUndefined();
    });

    it("deve retornar undefined se não houver header authorization", () => {
      const request = { headers: {} };
      const token = (guard as unknown as GuardWithExtractor).extractTokenFromHeader(request);
      expect(token).toBeUndefined();
    });
  });
});
