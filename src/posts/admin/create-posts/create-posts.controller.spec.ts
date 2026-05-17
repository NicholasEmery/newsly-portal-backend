import { CreatePostsController } from "./create-posts.controller";
import { CreatePostsService } from "./create-posts.service";
import { Role } from "@generated/prisma/enums";

describe("CreatePostsController", () => {
  let controller: CreatePostsController;
  let service: jest.Mocked<CreatePostsService>;

  beforeEach(async () => {
    service = {
      createPost: jest.fn(),
    } as any;
    controller = new CreatePostsController(service);

    jest.clearAllMocks();
  });

  it("passes the authenticated user and body to the service", async () => {
    const req = { user: { id: "user-1", role: Role.CREATOR } };
    const body = {
      title: "Test post",
      content: "Content",
      imageFile: {} as any,
    };
    const result = { statusCode: 201, message: "Created", requestId: "request-1" };

    service.createPost.mockResolvedValue(result as any);

    await expect(controller.createPost(req as any, body as any)).resolves.toEqual(result);
    expect(service.createPost).toHaveBeenCalledWith("user-1", body, Role.CREATOR);
  });
});
