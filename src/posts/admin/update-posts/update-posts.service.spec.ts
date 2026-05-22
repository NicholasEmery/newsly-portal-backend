import { PostStatus, RequestStatus, Role } from "@generated/prisma/enums";
import { Test, TestingModule } from "@nestjs/testing";
import { PrismaService } from "../../../database/prisma.service";
import { UpdatePostDto } from "./dto/update-post.dto";
import { UpdatePostsService } from "./update-posts.service";

type MockPostRecord = {
  id: string;
  creatorId?: string;
  collaborators?: Array<{
    userId: string;
    permissions: string[];
  }>;
};

type MockEditRequestRecord = {
  id: string;
  postId: string;
  targetRole?: Role;
  proposedChanges?: {
    title?: string;
    image?: string;
    content?: string;
    categories?: unknown;
  };
  requester?: {
    role: Role;
  };
  post?: {
    creatorId: string;
  };
  status?: RequestStatus;
};

type MockCreationRequestRecord = {
  id: string;
  postId: string;
  post?: {
    id: string;
  };
};

describe("UpdatePostsService", () => {
  let service: UpdatePostsService;

  type EditRequestCreateArgs = {
    data: {
      postId: string;
      requesterId: string;
      targetRole: Role;
      proposedChanges: UpdatePostDto;
      status: RequestStatus;
    };
  };

  type PostUpdateArgs = {
    where: { id: string };
    data: {
      status: PostStatus;
      publishedAt: Date;
    };
  };

  type CreationUpdateArgs = {
    where: { id: string };
    data: {
      status: RequestStatus;
      adminReviewerId: string;
      reviewedAt: Date;
    };
  };

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
    const updatedPost: MockPostRecord = { id: "post-1", creatorId: "admin-1" };

    mockPrismaService.post.update.mockResolvedValue(updatedPost);

    const result = await service.updatePost("admin-1", "post-1", body, Role.ADMIN);

    expect(mockPrismaService.post.update).toHaveBeenCalledWith({
      where: { id: "post-1" },
      data: body,
    });
    expect(result).toEqual(updatedPost);
  });

  it("creates an edit request for creators", async () => {
    const body: UpdatePostDto = { title: "Updated title" };
    const existingPost: MockPostRecord = {
      id: "post-1",
      creatorId: "user-1",
      collaborators: [],
    };
    const editRequest: MockEditRequestRecord = { id: "request-1", postId: "post-1" };

    mockPrismaService.post.findUnique.mockResolvedValue(existingPost);
    mockPrismaService.editRequest.create.mockResolvedValue(editRequest);

    const result = await service.updatePost("user-1", "post-1", body, Role.CREATOR);

    const [[editRequestArgs]] = mockPrismaService.editRequest.create.mock.calls as unknown as [[EditRequestCreateArgs]];

    expect(editRequestArgs).toMatchObject({
      data: {
        postId: "post-1",
        requesterId: "user-1",
        targetRole: Role.ADMIN,
        proposedChanges: body,
        status: RequestStatus.PENDING,
      },
    });
    expect(result).toMatchObject({ id: "request-1", postId: "post-1" });
  });

  it("approves edit requests for admins", async () => {
    const pendingRequest: MockEditRequestRecord = {
      id: "request-1",
      postId: "post-1",
      targetRole: Role.ADMIN,
      proposedChanges: { title: "Updated title" },
      requester: { role: Role.CREATOR },
      post: { creatorId: "someone-else" },
      status: RequestStatus.PENDING,
    };
    const updatedPost: MockPostRecord = { id: "post-1" };
    const updatedRequest: MockEditRequestRecord = { id: "request-1", postId: "post-1" };

    mockPrismaService.editRequest.findUnique.mockResolvedValue(pendingRequest);
    mockPrismaService.post.update.mockResolvedValue(updatedPost);
    mockPrismaService.editRequest.update.mockResolvedValue(updatedRequest);

    const result = await service.approveEdit("admin-1", Role.ADMIN, "request-1", "ok");

    expect(mockPrismaService.post.update).toHaveBeenCalled();
    expect(result).toMatchObject({ id: "request-1", postId: "post-1" });
  });

  it("publishes creation requests when approved", async () => {
    const creationRequest: MockCreationRequestRecord = {
      id: "request-1",
      postId: "post-1",
      post: { id: "post-1" },
    };
    const updatedPost: MockPostRecord = { id: "post-1" };
    const updatedRequest: MockCreationRequestRecord = {
      id: "request-1",
      postId: "post-1",
      post: { id: "post-1" },
    };

    mockPrismaService.creationRequest.findUnique.mockResolvedValue(creationRequest);
    mockPrismaService.post.update.mockResolvedValue(updatedPost);
    mockPrismaService.creationRequest.update.mockResolvedValue(updatedRequest);

    const result = await service.updateCreationStatus("admin-1", "request-1", RequestStatus.APPROVED);

    const [[postUpdateArgs]] = mockPrismaService.post.update.mock.calls as unknown as [[PostUpdateArgs]];
    const [[creationUpdateArgs]] = mockPrismaService.creationRequest.update.mock.calls as unknown as [
      [CreationUpdateArgs],
    ];

    expect(postUpdateArgs).toMatchObject({
      where: { id: "post-1" },
      data: {
        status: PostStatus.PUBLISHED,
      },
    });
    expect(postUpdateArgs.data.publishedAt).toBeInstanceOf(Date);
    expect(creationUpdateArgs).toMatchObject({
      where: { id: "request-1" },
      data: {
        status: RequestStatus.APPROVED,
        adminReviewerId: "admin-1",
      },
    });
    expect(creationUpdateArgs.data.reviewedAt).toBeInstanceOf(Date);
    expect(result).toBeUndefined();
  });
});
