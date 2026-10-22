import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { Role } from "../../../../generated/prisma/enums";

export class UserLocalSignUpDto {
  @ApiProperty({ example: "Nicholas", description: "Nome do usuário." })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: "Emery", description: "Sobrenome do usuário." })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: "nicholas@example.com", description: "Email da nova conta." })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: "StrongPass123", minLength: 6, description: "Senha inicial da conta." })
  @MinLength(6)
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ type: "string", format: "binary", description: "Foto de perfil enviada como arquivo." })
  @IsNotEmpty()
  photoFile!: Express.Multer.File;

  @ApiPropertyOptional({ enum: Role, example: Role.COLLABORATOR, description: "Role opcional na criação." })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
