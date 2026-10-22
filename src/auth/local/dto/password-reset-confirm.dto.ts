import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class PasswordResetConfirmDto {
  @ApiProperty({ example: "reset-token-example", description: "Token recebido por email." })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ example: "NewStrongPass123", minLength: 6, description: "Nova senha do usuário." })
  @IsString()
  @MinLength(6)
  @IsNotEmpty()
  newPassword!: string;
}