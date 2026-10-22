import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, MinLength } from "class-validator";

export class UserLocalSignInDto {
  @ApiProperty({ example: "nicholas@example.com", description: "Email da conta local." })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "StrongPass123", minLength: 6, description: "Senha em texto puro enviada na autenticação." })
  @MinLength(6)
  password!: string;
}
