import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { Role } from "../../../../generated/prisma/enums";

export class UserLocalSignUpDto {
  @ApiProperty({ example: "John", description: "Primeiro nome do usuário" })
  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @ApiProperty({ example: "Doe", description: "Sobrenome do usuário" })
  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @ApiProperty({ example: "user@email.com", description: "Email do usuário" })
  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: "senha123", minLength: 6, description: "Senha do usuário" })
  @MinLength(6)
  @IsNotEmpty()
  password!: string;

  @ApiProperty({ type: "string", format: "binary", description: "Foto de perfil do usuário" })
  @IsNotEmpty()
  photoFile!: Express.Multer.File;

  @ApiProperty({ example: "USER", description: "Papel do usuário" })
  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
