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
    jest.spyOn(prisma.user, "delete").mockResolvedValue({} as any);
    await expect(service.deleteUser("1")).resolves.toBeUndefined();
  });
});
