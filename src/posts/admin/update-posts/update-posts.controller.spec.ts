import { RequestStatus, Role } from "@generated/prisma/enums";
import { AuthenticatedRequest } from "src/common/interfaces/auth.interface";
import { UpdatePostsController } from "./update-posts.controller";
import { UpdatePostsService } from "./update-posts.service";
import { UpdatePostDto } from "./dto/update-post.dto";

describe("UpdatePostsController", () => {
  let controller: UpdatePostsController;
  const updatePostMock = jest.fn();
  const approveEditMock = jest.fn();
  const rejectEditMock = jest.fn();
  const updateCreationStatusMock = jest.fn();

  beforeEach(() => {
    const service = {
      updatePost: updatePostMock,
      approveEdit: approveEditMock,
      rejectEdit: rejectEditMock,
      updateCreationStatus: updateCreationStatusMock,
    } as unknown as UpdatePostsService;
    controller = new UpdatePostsController(service);
    jest.clearAllMocks();
  });

  it("passes edit requests through to the service", async () => {
    const req = { user: { id: "user-1", role: Role.CREATOR } } as AuthenticatedRequest;
    const body: UpdatePostDto = { title: "Updated title" };
    const result = { id: "request-1" };

    updatePostMock.mockResolvedValue(result);

    await expect(controller.editPost(req, "post-1", body)).resolves.toEqual(result);
    expect(updatePostMock).toHaveBeenCalledWith("user-1", "post-1", body, Role.CREATOR);
  });

  it("passes approve edit requests through to the service", async () => {
    const req = { user: { id: "admin-1", role: Role.ADMIN } } as AuthenticatedRequest;
    const result = { id: "request-1" };

    approveEditMock.mockResolvedValue(result);

    await expect(controller.approveEdit(req, "request-1", { reason: "ok" })).resolves.toEqual(result);
    expect(approveEditMock).toHaveBeenCalledWith("admin-1", Role.ADMIN, "request-1", "ok");
  });

  it("passes reject edit requests through to the service", async () => {
    const req = { user: { id: "admin-1", role: Role.ADMIN } } as AuthenticatedRequest;
    const result = { id: "request-1" };

    rejectEditMock.mockResolvedValue(result);

    await expect(controller.rejectEdit(req, "request-1", { reason: "nope" })).resolves.toEqual(result);
    expect(rejectEditMock).toHaveBeenCalledWith("admin-1", "request-1", "nope");
  });

  it("passes creation status updates through to the service", async () => {
    const req = { user: { id: "admin-1", role: Role.ADMIN } } as AuthenticatedRequest;

    updateCreationStatusMock.mockResolvedValue(undefined);

    await expect(controller.updateCreationStatus(req, "request-1", RequestStatus.APPROVED)).resolves.toEqual({
      status: 200,
      message: "Requisição de criação de post aprovada com sucesso.",
      postId: undefined,
    });
    expect(updateCreationStatusMock).toHaveBeenCalledWith("admin-1", "request-1", RequestStatus.APPROVED);
  });
});
