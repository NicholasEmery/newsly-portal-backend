import { Test, TestingModule } from "@nestjs/testing";
import { DeleteUsersService } from "./delete-users.service";
import { PrismaService } from "../../database/prisma.service";

describe("DeleteUsersService", () => {
  let service: DeleteUsersService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeleteUsersService, PrismaService],
    }).compile();
    service = module.get<DeleteUsersService>(DeleteUsersService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it("should delete a user", async () => {
    jest.spyOn(prisma.user, "delete").mockResolvedValue({
      id: "1",
      name: "Test",
      email: "test@example.com",
      role: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      photo: "",
      emailVerified: false,
      createQuota: null,
      createQuotaExpiresAt: null,
      readNotifications: [],
    } as unknown);
    await expect(service.deleteUser("1")).resolves.toBeUndefined();
  });
});
