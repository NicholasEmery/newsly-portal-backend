import { Module } from "@nestjs/common";
import { PrismaModule } from "../database/prisma.module";
// import { AdminGetPostsModule } from "./posts/admin/get-posts/admin-get-posts.module";
import { CreatePostsModule } from "./admin/create-posts/create-posts.module";
import { UpdatePostsModule } from "./admin/update-posts/update-posts.module";
import { GetPostsModule } from "./get-posts/get-posts.module";

@Module({
  imports: [
    PrismaModule,
    GetPostsModule,
    /*AdminGetPostsModule,*/ CreatePostsModule,
    UpdatePostsModule /*DeletePostsModule*/,
  ],
})
export class PostsModule {}
