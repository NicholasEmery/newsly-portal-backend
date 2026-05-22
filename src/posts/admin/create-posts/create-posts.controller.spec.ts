import { Role } from "@generated/prisma/enums";
import { AuthenticatedRequest } from "src/common/interfaces/auth.interface";
import { CreatePostsController } from "./create-posts.controller";
import { CreatePostsService } from "./create-posts.service";
import { CreatePostDto } from "./dto/create-post.dto";

describe("CreatePostsController", () => {
  let controller: CreatePostsController;
  const createPostMock = jest.fn();

  beforeEach(() => {
    const service = { createPost: createPostMock } as unknown as CreatePostsService;
    controller = new CreatePostsController(service);

    jest.clearAllMocks();
  });

  it("passes the authenticated user and body to the service", async () => {
    const req = { user: { id: "user-1", role: Role.CREATOR } } as AuthenticatedRequest;
    const body: CreatePostDto = {
      title: "Test post",
      content: "Content",
      imageFile: {} as Express.Multer.File,
    };
    const result = { statusCode: 201, message: "Created", requestId: "request-1" };

    createPostMock.mockResolvedValue(result);

    await expect(controller.createPost(req, body)).resolves.toEqual(result);
    expect(createPostMock).toHaveBeenCalledWith("user-1", body, Role.CREATOR);
  });
});
