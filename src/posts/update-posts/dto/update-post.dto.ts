import { PostStatus, Category, Tag } from "@generated/prisma/enums";

export class UpdatePostDto {
  title?: string;
  image?: string;
  imageUrl?: string;
  content?: string;
  categories?: Category[];
  tags?: Tag[];
  status?: PostStatus;
}
