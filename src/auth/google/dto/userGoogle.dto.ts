import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";
import { Role } from "../../../../generated/prisma/enums";

export class UserGoogleDto {
  @ApiProperty({ example: "Nicholas", description: "Nome do usuário vindo do perfil Google." })
  @IsNotEmpty()
  @IsString()
  given_name!: string;

  @ApiProperty({ example: "Emery", description: "Sobrenome do usuário vindo do perfil Google." })
  @IsNotEmpty()
  @IsString()
  family_name!: string;

  @ApiProperty({
    example: "https://example.com/avatar.png",
    description: "URL da foto do perfil Google.",
  })
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  picture!: string;

  @ApiProperty({ example: "nicholas@example.com", description: "Email confirmado pelo Google." })
  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "google", description: "Nome do provider de autenticação." })
  @IsNotEmpty()
  @IsString()
  provider!: string;

  @ApiProperty({ example: "1234567890", description: "Identificador do usuário no provider." })
  @IsNotEmpty()
  @IsString()
  providerId!: string;

  @ApiPropertyOptional({ enum: Role, example: Role.COLLABORATOR, description: "Role opcional atribuída à conta." })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
