import { Controller, Get, Param, Query } from "@nestjs/common";
import { GetPostsService } from "./get-posts.service";

@Controller("posts")
export class GetPostsController {
  constructor(private getPostsService: GetPostsService) {}

  @Get("")

  @Get("latest")
  async getLatest(@Query("page") page = 1, @Query("limit") limit = 20) {
    return this.getPostsService.getLatestPosts(+page, +limit);
  }

  @Get("trending")
  async getTrending(@Query("period") period: "24h" | "7d" = "24h", @Query("limit") limit = 10) {
    return this.getPostsService.getTrendingPosts(period, +limit);
  }

  @Get("spotlight")
  async getSpotlight(@Query("limit") limit = 5) {
    return this.getPostsService.getSpotlightPosts(+limit);
  }

  @Get("top-notice")
  async getTopNotice(@Query("limit") limit = 5) {
    return this.getPostsService.getTopNoticePosts(+limit);
  }

  @Get(":id")
  async getById(@Param("id") id: string) {
    return this.getPostsService.getPostById(id);
  }
}
