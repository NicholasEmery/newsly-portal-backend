import { Controller, Delete, Param, UseGuards, Request } from "@nestjs/common";
import { Roles } from "../../../common/decorators/roles.decorator";
import { AuthGuard } from "../../../common/guards/auth.guard";
import { RolesGuard } from "../../../common/guards/roles.guard";
import { AuthenticatedRequest } from "../../../common/interfaces/auth.interface";

@Controller("admin/posts")
@UseGuards(AuthGuard, RolesGuard)
@Roles("ADMIN")
export class DeletePostsController {
  constructor() {}

  @Delete(":id")
  delete(@Request() req: AuthenticatedRequest, @Param("id") id: string) {
    return { message: "Post deleted", id };
  }
}
