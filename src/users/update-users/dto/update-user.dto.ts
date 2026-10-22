import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, IsIn } from "class-validator";
import { Role } from "../../../../generated/prisma/enums";

export class UpdateUserDto {
  @ApiPropertyOptional({ example: "nicholas@example.com", description: "Novo email do usuário." })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ example: "Nicholas Emery", description: "Nome exibido do usuário." })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: "https://example.com/avatar.png", description: "URL da foto do usuário." })
  @IsOptional()
  @IsString()
  photo?: string;

  @ApiPropertyOptional({ example: "hashed-password-value", description: "Senha já criptografada, caso a atualização exija troca direta." })
  @IsOptional()
  @IsString()
  passwordHash?: string;

  @ApiPropertyOptional({ example: "READER", enum: ["READER", "PUBLISHER", "COLLABORATOR"], description: "Role do usuário." })
  @IsOptional()
  @IsIn(["READER", "PUBLISHER", "COLLABORATOR"])
  role?: Role;
}
