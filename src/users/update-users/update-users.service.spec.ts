import { Test, TestingModule } from "@nestjs/testing";
import { UpdateUsersService } from "./update-users.service";
import { PrismaService } from "../../database/prisma.service";
import { TokenHelper } from "../../auth/util/generateTokens";

const mockPrismaService = {
  user: {
    update: jest.fn(),
  },
  localAuth: {
    update: jest.fn(),
  },
};

const mockTokenHelper = {
  hashToken: jest.fn(),
};

describe("UpdateUsersService", () => {
  let service: UpdateUsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUsersService,
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
    service = module.get<UpdateUsersService>(UpdateUsersService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  it("should update a user", async () => {
    const mockUser = { id: "1", email: "updated@example.com", name: "Updated", role: "publisher" };
    mockPrismaService.user.update.mockResolvedValue(mockUser as any);

    const result = await service.updateUser({ id: "1", email: "updated@example.com" });

    expect(mockPrismaService.user.update).toHaveBeenCalledWith({
      where: { id: "1" },
      data: {
        email: "updated@example.com",
        name: undefined,
        photo: undefined,
        role: undefined,
      },
    });
    expect(result).toEqual(mockUser);
  });
});
