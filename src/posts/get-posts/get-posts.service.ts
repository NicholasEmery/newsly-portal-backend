import { Category, PostStatus, Tag } from "@generated/prisma/enums";
import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "src/database/prisma.service";

@Injectable()
export class GetPostsService {
  constructor(private prisma: PrismaService) {}

  // Métodos públicos
  async getLatestPosts(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return this.prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      include: {
        creator: { select: { id: true, name: true } },
        collaborators: { include: { user: { select: { id: true, name: true } } } },
      },
    });
  }

  async getTrendingPosts(period: "24h" | "7d", limit = 10) {
    const now = new Date();
    const since =
      period === "24h"
        ? new Date(now.getTime() - 24 * 60 * 60 * 1000)
        : new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    return this.prisma.post.findMany({
      where: { status: PostStatus.PUBLISHED, createdAt: { gte: since } },
      orderBy: { likeCount: "desc" },
      take: limit,
      include: { creator: { select: { id: true, name: true } } },
    });
  }

  async getSpotlightPosts(limit = 5) {
    return this.prisma.post.findMany({
      where: { categories: { has: Category.SPOTLIGHT }, status: PostStatus.PUBLISHED },
      take: limit,
      include: { creator: { select: { id: true, name: true } } },
    });
  }

  async getTopNoticePosts(limit = 5) {
    return this.prisma.post.findMany({
      where: { tags: { has: Tag.TOP_NOTICE }, status: PostStatus.PUBLISHED },
      take: limit,
      include: { creator: { select: { id: true, name: true } } },
    });
  }

  async getPostById(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true } },
        collaborators: { include: { user: { select: { id: true, name: true } } } },
        comments: { include: { user: { select: { id: true, name: true } } }, orderBy: { createdAt: "desc" } },
        likes: { select: { userId: true } },
        favorites: { select: { userId: true } },
      },
    });
    if (!post) throw new NotFoundException("Post not found");
    return post;
  }
}
