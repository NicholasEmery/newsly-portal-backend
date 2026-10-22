import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Category } from "@generated/prisma/enums";
import { IsString, IsOptional, IsArray, IsEnum, IsNotEmpty, Length, ArrayMaxSize, IsUUID } from "class-validator";
import { CollaboratorsPostDto } from "../../dto/collaboratorsPost.dto";

export class CreatePostDto {
  @ApiProperty({ example: "Minha primeira publicação", description: "Título do post." })
  @IsNotEmpty({ message: "O título não pode estar vazio" })
  @IsString({ message: "O título deve ser uma string" })
  @Length(1, 100, { message: "O título deve ter entre 1 e 100 caracteres" })
  title: string;

  @ApiProperty({ type: "string", format: "binary", description: "Arquivo principal da imagem do post." })
  @IsNotEmpty({ message: "A imagem não pode estar vazia" })
  imageFile!: Express.Multer.File;

  @ApiProperty({ example: "Conteúdo completo do post...", description: "Corpo editorial do post." })
  @IsNotEmpty({ message: "O conteúdo não pode estar vazio" })
  @IsString({ message: "O conteúdo deve ser uma string" })
  @Length(1, 10000, { message: "O conteúdo deve ter entre 1 e 10.000 caracteres" })
  content!: string;

  @ApiPropertyOptional({ enum: Category, isArray: true, example: [Category.SPOTLIGHT], description: "Categorias atribuídas ao post." })
  @IsOptional()
  @IsArray({ message: "As categorias devem ser um array" })
  @IsEnum(Category, { each: true, message: "Cada categoria deve ser um valor válido do enum Category" })
  @ArrayMaxSize(5, { message: "No máximo 5 categorias" })
  categories?: Category[];

  @ApiPropertyOptional({ type: () => [CollaboratorsPostDto], description: "Lista de colaboradores convidados para o post." })
  @IsOptional()
  @IsArray({ message: "Os colaboradores devem ser um array" })
  @IsUUID("4", { each: true, message: "Cada ID de colaborador deve ser um UUID válido" }) // Assumindo UUID v4 para userIds
  @ArrayMaxSize(20, { message: "No máximo 20 colaboradores" })
  collaborators?: CollaboratorsPostDto[];
}
