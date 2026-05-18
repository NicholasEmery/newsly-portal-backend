import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, MinLength } from "class-validator";

export class UserLocalSignInDto {
  @ApiProperty({ example: "user@email.com", description: "Email do usuário" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "senha123", minLength: 6, description: "Senha do usuário" })
  @MinLength(6)
  password!: string;
}
