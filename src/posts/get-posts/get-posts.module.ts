import { Module } from "@nestjs/common";
import { GetPostsController } from "./get-posts.controller";
import { GetPostsService } from "./get-posts.service";
import { PrismaModule } from "src/database/prisma.module";

@Module({
  imports: [PrismaModule],
  controllers: [GetPostsController],
  // providers: [GetPostsService],
  exports: [GetPostsService],
})
export class GetPostsModule {}
