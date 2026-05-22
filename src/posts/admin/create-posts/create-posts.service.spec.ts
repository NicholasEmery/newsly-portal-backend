import { Category, PostStatus, Role } from "@generated/prisma/enums";
import { Test, TestingModule } from "@nestjs/testing";
import { UploadsService } from "src/common/services/upload/uploads.service";
import { PrismaService } from "../../../database/prisma.service";
import { CreatePostsService } from "./create-posts.service";
import { CreatePostDto } from "./dto/create-post.dto";

type MockPostRecord = {
  id: string;
};

type MockCreationRequestRecord = {
  id: string;
};

type MockAdminRecord = {
  id: string;
};

describe("CreatePostsService", () => {
  let service: CreatePostsService;

  type PostCreateArgs = {
    data: {
      title: string;
      content: string;
      imageUrl: string;
      categories: Category[];
      status: PostStatus;
      creatorId: string;
    };
  };

  const mockPrismaService = {
    post: {
      create: jest.fn(),
      update: jest.fn(),
    },
    creationRequest: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    notification: {
      create: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  };

  const mockUploadsService = {
    saveUploadedFile: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreatePostsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UploadsService,
          useValue: mockUploadsService,
        },
      ],
    }).compile();

    service = module.get<CreatePostsService>(CreatePostsService);
    jest.clearAllMocks();
  });

  it("creates a creation request when the author is a creator", async () => {
    const body: CreatePostDto = {
      title: "Test post",
      content: "Content",
      imageFile: { buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: "image/jpeg" } as Express.Multer.File,
      categories: [Category.SPOTLIGHT],
    };

    const createdPost: MockPostRecord = { id: "post-1" };
    const creationRequest: MockCreationRequestRecord = { id: "request-1" };

    mockUploadsService.saveUploadedFile.mockResolvedValue("uploads/post.jpg");
    mockPrismaService.post.create.mockResolvedValue(createdPost);
    mockPrismaService.creationRequest.create.mockResolvedValue(creationRequest);

    const result = await service.createPost("user-1", body, Role.CREATOR);

    expect(mockUploadsService.saveUploadedFile).toHaveBeenCalledWith(body.imageFile);
    const [[postCreateArgs]] = mockPrismaService.post.create.mock.calls as unknown as [[PostCreateArgs]];

    expect(postCreateArgs).toMatchObject({
      data: {
        title: body.title,
        content: body.content,
        imageUrl: "uploads/post.jpg",
        categories: [Category.SPOTLIGHT],
        status: PostStatus.PENDING,
        creatorId: "user-1",
      },
    });
    expect(mockPrismaService.creationRequest.create).toHaveBeenCalledWith({
      data: { postId: "post-1", requesterId: "user-1" },
    });
    expect(result).toEqual({
      statusCode: 201,
      message: "Requisição de criação de post enviada com sucesso para revisão.",
      requestId: "request-1",
    });
  });

  it("publishes immediately when the author is not a creator", async () => {
    const body: CreatePostDto = {
      title: "Published post",
      content: "Content",
      imageFile: { buffer: Buffer.from([0xff, 0xd8, 0xff]), mimetype: "image/jpeg" } as Express.Multer.File,
    };

    const createdPost: MockPostRecord = { id: "post-2" };
    const admins: MockAdminRecord[] = [{ id: "admin-1" }];

    mockUploadsService.saveUploadedFile.mockResolvedValue("uploads/post.jpg");
    mockPrismaService.post.create.mockResolvedValue(createdPost);
    mockPrismaService.user.findMany.mockResolvedValue(admins);
    mockPrismaService.notification.create.mockResolvedValue({});

    const result = await service.createPost("user-2", body, Role.ADMIN);

    expect(mockPrismaService.notification.create).toHaveBeenCalled();
    expect(result).toEqual({
      statusCode: 201,
      message: "Post criado com sucesso.",
      postId: "post-2",
    });
  });
});
