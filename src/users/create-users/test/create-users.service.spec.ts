import { Test, TestingModule } from "@nestjs/testing";
import { CreateUsersService } from "../create-users.service";
import { PrismaService } from "src/database/prisma.service";
import { UploadsService } from "src/common/services/upload/uploads.service";
import { TokensService } from "../../../auth/tokens.service";
import { UserGoogleDto } from "../../../auth/google/dto/userGoogle.dto";
import { UserLocalSignUpDto } from "../../../auth/local/dto/local-signup.dto";
import { SessionDto } from "../../../auth/dto/session.dto";

// Mocks
const mockPrismaService = {
  user: {
    create: jest.fn(),
  },
  deviceSession: {
    create: jest.fn(),
  },
  localAuth: {
    create: jest.fn(),
  },
};

const mockUploadsService = {
  downloadAndSaveFile: jest.fn(),
  saveUploadedFile: jest.fn(),
};

const mockTokensService = {
  signAccessToken: jest.fn(),
  issueRefreshToken: jest.fn(),
};

describe("CreateUsersService", () => {
  let service: CreateUsersService;
  let prismaService: PrismaService;
  let uploadsService: UploadsService;
  let tokensService: TokensService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UploadsService,
          useValue: mockUploadsService,
        },
        {
          provide: TokensService,
          useValue: mockTokensService,
        },
      ],
    }).compile();

    service = module.get<CreateUsersService>(CreateUsersService);
    prismaService = module.get<PrismaService>(PrismaService);
    uploadsService = module.get<UploadsService>(UploadsService);
    tokensService = module.get<TokensService>(TokensService);

    jest.clearAllMocks();
  });

  describe("createUser", () => {
    const meta: SessionDto = {
      deviceId: "device-123",
      userAgent: "Mozilla/5.0",
      ip: "127.0.0.1",
    };

    describe("com provider (Google)", () => {
      const provider: UserGoogleDto = {
        email: "google@example.com",
        given_name: "John",
        family_name: "Doe",
        picture: "http://example.com/photo.jpg",
        provider: "google",
        providerId: "google-id-123",
      };

      it("deve criar usuário do Google com sucesso", async () => {
        const photoUrl = "uploads/photo.jpg";
        const newUser = { id: "user-123", email: provider.email, name: "John Doe", photo: photoUrl };
        const accessToken = "access-token";
        const refreshToken = "refresh-token";

        mockUploadsService.downloadAndSaveFile.mockResolvedValue(photoUrl);
        mockPrismaService.user.create.mockResolvedValue(newUser);
        mockPrismaService.deviceSession.create.mockResolvedValue({ id: "session-456" });
        mockTokensService.signAccessToken.mockResolvedValue(accessToken);
        mockTokensService.issueRefreshToken.mockResolvedValue(refreshToken);

        const result = await service.createUser(provider, undefined, meta);

        expect(mockUploadsService.downloadAndSaveFile).toHaveBeenCalledWith(provider.picture);
        expect(mockPrismaService.user.create).toHaveBeenCalledWith({
          data: {
            email: provider.email,
            name: "John Doe", // given_name + family_name capitalizados
            photo: photoUrl,
            role: null,
          },
        });
        expect(mockTokensService.signAccessToken).toHaveBeenCalledWith(newUser.id, expect.any(String)); // sessionId
        expect(result).toEqual({
          accessTokenUser: accessToken,
          refreshTokenUser: refreshToken,
        });
      });

      it("deve capitalizar o nome corretamente", async () => {
        const providerLower: UserGoogleDto = {
          ...provider,
          given_name: "john",
          family_name: "doe",
        };
        const photoUrl = "uploads/photo.jpg";
        const newUser = { id: "user-123", email: provider.email, name: "John Doe", photo: photoUrl };

        mockUploadsService.downloadAndSaveFile.mockResolvedValue(photoUrl);
        mockPrismaService.user.create.mockResolvedValue(newUser);
        mockPrismaService.deviceSession.create.mockResolvedValue({ id: "session-456" });
        mockTokensService.signAccessToken.mockResolvedValue("access");
        mockTokensService.issueRefreshToken.mockResolvedValue("refresh");

        await service.createUser(providerLower, undefined, meta);

        expect(mockPrismaService.user.create).toHaveBeenCalledWith({
          data: {
            email: provider.email,
            name: "John Doe",
            photo: photoUrl,
            role: null,
          },
        });
      });
    });

    describe("com localUser", () => {
      const localUser: UserLocalSignUpDto = {
        email: "local@example.com",
        firstName: "Jane",
        lastName: "Smith",
        password: "password123",
        photoFile: { buffer: Buffer.from("image"), mimetype: "image/jpeg" } as any,
      };

      it("deve criar usuário local com sucesso", async () => {
        const photoUrl = "uploads/local-photo.jpg";
        const newUser = { id: "user-456", email: localUser.email, name: "Jane Smith", photo: photoUrl };
        const accessToken = "access-token";
        const refreshToken = "refresh-token";

        mockUploadsService.saveUploadedFile.mockResolvedValue(photoUrl);
        mockPrismaService.user.create.mockResolvedValue(newUser);
        mockPrismaService.localAuth.create.mockResolvedValue({});
        mockPrismaService.deviceSession.create.mockResolvedValue({ id: "session-789" });
        mockTokensService.signAccessToken.mockResolvedValue(accessToken);
        mockTokensService.issueRefreshToken.mockResolvedValue(refreshToken);

        const result = await service.createUser(undefined, localUser, meta);

        expect(mockUploadsService.saveUploadedFile).toHaveBeenCalledWith(localUser.photoFile);
        expect(mockPrismaService.user.create).toHaveBeenCalledWith({
          data: {
            email: localUser.email,
            name: "Jane Smith",
            photo: photoUrl,
            role: null,
          },
        });
        expect(result).toEqual({
          accessTokenUser: accessToken,
          refreshTokenUser: refreshToken,
        });
      });
    });

    it("deve lançar erro se nem provider nem localUser forem fornecidos", async () => {
      await expect(service.createUser(undefined, undefined, meta)).rejects.toThrow();
    });
  });
});
