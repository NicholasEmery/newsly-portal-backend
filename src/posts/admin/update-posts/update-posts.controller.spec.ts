import { RequestStatus, Role } from "@generated/prisma/enums";
import { UpdatePostsController } from "./update-posts.controller";
import { UpdatePostsService } from "./update-posts.service";

describe("UpdatePostsController", () => {
  let controller: UpdatePostsController;
  let service: jest.Mocked<UpdatePostsService>;

  beforeEach(async () => {
    service = {
      updatePost: jest.fn(),
      approveEdit: jest.fn(),
      rejectEdit: jest.fn(),
      updateCreationStatus: jest.fn(),
    } as any;
    controller = new UpdatePostsController(service);
    jest.clearAllMocks();
  });

  it("passes edit requests through to the service", async () => {
    const req = { user: { id: "user-1", role: Role.CREATOR } };
    const body = { title: "Updated title" };
    const result = { id: "request-1" };

    service.updatePost.mockResolvedValue(result as any);

    await expect(controller.editPost(req as any, "post-1", body as any)).resolves.toEqual(result);
    expect(service.updatePost).toHaveBeenCalledWith("user-1", "post-1", body, Role.CREATOR);
  });

  it("passes approve edit requests through to the service", async () => {
    const req = { user: { id: "admin-1", role: Role.ADMIN } };
    const result = { id: "request-1" };

    service.approveEdit.mockResolvedValue(result as any);

    await expect(controller.approveEdit(req as any, "request-1", { reason: "ok" })).resolves.toEqual(result);
    expect(service.approveEdit).toHaveBeenCalledWith("admin-1", Role.ADMIN, "request-1", "ok");
  });

  it("passes reject edit requests through to the service", async () => {
    const req = { user: { id: "admin-1", role: Role.ADMIN } };
    const result = { id: "request-1" };

    service.rejectEdit.mockResolvedValue(result as any);

    await expect(controller.rejectEdit(req as any, "request-1", { reason: "nope" })).resolves.toEqual(result);
    expect(service.rejectEdit).toHaveBeenCalledWith("admin-1", "request-1", "nope");
  });

  it("passes creation status updates through to the service", async () => {
    const req = { user: { id: "admin-1", role: Role.ADMIN } };

    service.updateCreationStatus.mockResolvedValue(undefined);

    await expect(controller.updateCreationStatus(req as any, "request-1", RequestStatus.APPROVED)).resolves.toEqual({
      status: 200,
      message: "Requisição de criação de post aprovada com sucesso.",
      postId: undefined,
    });
    expect(service.updateCreationStatus).toHaveBeenCalledWith("admin-1", "request-1", RequestStatus.APPROVED);
  });
});
