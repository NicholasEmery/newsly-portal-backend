import { ApiPropertyOptional } from "@nestjs/swagger";
import { PostStatus, Category, Tag } from "@generated/prisma/enums";

export class UpdatePostDto {
  @ApiPropertyOptional({ example: "Título atualizado" })
  title?: string;
  @ApiPropertyOptional({ example: "https://cdn.example.com/posts/new-image.png" })
  image?: string;
  @ApiPropertyOptional({ example: "https://cdn.example.com/posts/new-image.png" })
  imageUrl?: string;
  @ApiPropertyOptional({ example: "Novo conteúdo do post" })
  content?: string;
  @ApiPropertyOptional({ enum: Category, isArray: true, example: [Category.SPOTLIGHT] })
  categories?: Category[];
  @ApiPropertyOptional({ enum: Tag, isArray: true, example: [Tag.TRENDING] })
  tags?: Tag[];
  @ApiPropertyOptional({ enum: PostStatus, example: PostStatus.PUBLISHED })
  status?: PostStatus;
}
