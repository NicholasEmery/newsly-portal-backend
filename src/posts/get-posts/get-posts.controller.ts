import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from "@nestjs/swagger";
import { GetPostsService } from "./get-posts.service";

@Controller("posts")
@ApiTags("Posts")
export class GetPostsController {
  constructor(private getPostsService: GetPostsService) {}

  @Get("")
  @Get("latest")
  @ApiOperation({
    summary: "Listar posts mais recentes",
    description: "Retorna a listagem paginada de posts publicados, ordenados por data de publicação.",
  })
  @ApiQuery({ name: "page", required: false, example: 1, description: "Página da listagem." })
  @ApiQuery({ name: "limit", required: false, example: 20, description: "Quantidade de itens por página." })
  @ApiOkResponse({
    description: "Lista de posts recentes.",
    schema: {
      example: [
        {
          id: "post-uuid-1",
          title: "Newsly lança nova edição",
          imageUrl: "https://cdn.example.com/posts/post-1.png",
          status: "PUBLISHED",
        },
      ],
    },
  })
  async getLatest(@Query("page") page = 1, @Query("limit") limit = 20) {
    return this.getPostsService.getLatestPosts(+page, +limit);
  }

  @Get("trending")
  @ApiOperation({
    summary: "Listar posts em alta",
    description: "Busca posts com melhor desempenho dentro de um período específico.",
  })
  @ApiQuery({ name: "period", required: false, enum: ["24h", "7d"], example: "24h" })
  @ApiQuery({ name: "limit", required: false, example: 10, description: "Quantidade máxima de posts." })
  @ApiOkResponse({
    description: "Lista de posts em alta.",
    schema: {
      example: [
        {
          id: "post-uuid-1",
          title: "Tendência da semana",
          score: 98,
        },
      ],
    },
  })
  async getTrending(@Query("period") period: "24h" | "7d" = "24h", @Query("limit") limit = 10) {
    return this.getPostsService.getTrendingPosts(period, +limit);
  }

  @Get("spotlight")
  @ApiOperation({
    summary: "Listar posts em destaque",
    description: "Retorna os posts destacados da home ou do contexto editorial.",
  })
  @ApiQuery({ name: "limit", required: false, example: 5, description: "Quantidade de itens destacados." })
  @ApiOkResponse({
    description: "Lista de posts em destaque.",
    schema: {
      example: [
        {
          id: "post-uuid-2",
          title: "Editorial da semana",
          spotlight: true,
        },
      ],
    },
  })
  async getSpotlight(@Query("limit") limit = 5) {
    return this.getPostsService.getSpotlightPosts(+limit);
  }

  @Get("top-notice")
  @ApiOperation({
    summary: "Listar aviso principal",
    description: "Retorna os posts usados como aviso/top notice na interface.",
  })
  @ApiQuery({ name: "limit", required: false, example: 5, description: "Quantidade máxima de avisos." })
  @ApiOkResponse({
    description: "Lista de posts top notice.",
    schema: {
      example: [
        {
          id: "post-uuid-3",
          title: "Aviso importante",
          topNotice: true,
        },
      ],
    },
  })
  async getTopNotice(@Query("limit") limit = 5) {
    return this.getPostsService.getTopNoticePosts(+limit);
  }

  @Get(":id")
  @ApiOperation({
    summary: "Buscar post por ID",
    description: "Retorna um post com seus relacionamentos principais e informações de exibição.",
  })
  @ApiParam({ name: "id", example: "post-uuid-1" })
  @ApiOkResponse({
    description: "Post encontrado.",
    schema: {
      example: {
        id: "post-uuid-1",
        title: "Newsly lança nova edição",
        content: "Conteúdo completo do post...",
        imageUrl: "https://cdn.example.com/posts/post-1.png",
        status: "PUBLISHED",
      },
    },
  })
  async getById(@Param("id") id: string) {
    return this.getPostsService.getPostById(id);
  }
}
