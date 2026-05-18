import { Module } from "@nestjs/common";
import { PrismaModule } from "src/database/prisma.module";
import { GetPostsController } from "./get-posts.controller";
import { GetPostsService } from "./get-posts.service";

@Module({
  imports: [PrismaModule],
  controllers: [GetPostsController],
  // providers: [GetPostsService],
  exports: [GetPostsService],
})
export class GetPostsModule {}
