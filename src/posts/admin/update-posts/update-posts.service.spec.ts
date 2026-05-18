import { PostStatus, RequestStatus, Role } from "@generated/prisma/enums";
import { Test, TestingModule } from "@nestjs/testing";
import { UpdatePostDto } from "./dto/update-post.dto";
import { UpdatePostsService } from "./update-posts.service";
import { PrismaService } from "../../../database/prisma.service";

describe("UpdatePostsService", () => {
  let service: UpdatePostsService;

  const mockPrismaService = {
    post: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    editRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    creationRequest: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdatePostsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UpdatePostsService>(UpdatePostsService);
    jest.clearAllMocks();
  });

  it("updates a post directly for admins", async () => {
    const body: UpdatePostDto = { title: "Updated title" };
    const updatedPost = { id: "post-1", title: "Updated title" };

    mockPrismaService.post.update.mockResolvedValue(updatedPost as any);

    const result = await service.updatePost("admin-1", "post-1", body, Role.ADMIN);

    expect(mockPrismaService.post.update).toHaveBeenCalledWith({
      where: { id: "post-1" },
      data: body,
    });
    expect(result).toEqual(updatedPost);
  });

  it("creates an edit request for creators", async () => {
    const body: UpdatePostDto = { title: "Updated title" };

    mockPrismaService.post.findUnique.mockResolvedValue({
      id: "post-1",
      creatorId: "user-1",
      collaborators: [],
    } as any);
    mockPrismaService.editRequest.create.mockResolvedValue({ id: "request-1" } as any);

    const result = await service.updatePost("user-1", "post-1", body, Role.CREATOR);

    expect(mockPrismaService.editRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          postId: "post-1",
          requesterId: "user-1",
          targetRole: Role.ADMIN,
          proposedChanges: body,
          status: RequestStatus.PENDING,
        }),
      }),
    );
    expect(result).toEqual({ id: "request-1" });
  });

  it("approves edit requests for admins", async () => {
    mockPrismaService.editRequest.findUnique.mockResolvedValue({
      id: "request-1",
      postId: "post-1",
      targetRole: Role.ADMIN,
      proposedChanges: { title: "Updated title" },
      requester: { role: Role.CREATOR },
      post: { creatorId: "someone-else" },
      status: RequestStatus.PENDING,
    } as any);
    mockPrismaService.post.update.mockResolvedValue({ id: "post-1" } as any);
    mockPrismaService.editRequest.update.mockResolvedValue({ id: "request-1" } as any);

    const result = await service.approveEdit("admin-1", Role.ADMIN, "request-1", "ok");

    expect(mockPrismaService.post.update).toHaveBeenCalled();
    expect(result).toEqual({ id: "request-1" });
  });

  it("publishes creation requests when approved", async () => {
    mockPrismaService.creationRequest.findUnique.mockResolvedValue({
      id: "request-1",
      postId: "post-1",
      post: { id: "post-1" },
    } as any);
    mockPrismaService.post.update.mockResolvedValue({ id: "post-1" } as any);
    mockPrismaService.creationRequest.update.mockResolvedValue({ id: "request-1" } as any);

    const result = await service.updateCreationStatus("admin-1", "request-1", RequestStatus.APPROVED);

    expect(mockPrismaService.post.update).toHaveBeenCalledWith({
      where: { id: "post-1" },
      data: {
        status: PostStatus.PUBLISHED,
        publishedAt: expect.any(Date),
      },
    });
    expect(mockPrismaService.creationRequest.update).toHaveBeenCalledWith({
      where: { id: "request-1" },
      data: {
        status: RequestStatus.APPROVED,
        adminReviewerId: "admin-1",
        reviewedAt: expect.any(Date),
      },
    });
    expect(result).toBeUndefined();
  });
});
