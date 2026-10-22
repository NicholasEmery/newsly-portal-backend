import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty } from "class-validator";

export class PasswordResetRequestDto {
  @ApiProperty({ example: "nicholas@example.com", description: "Email que receberá o link de redefinição." })
  @IsEmail()
  @IsNotEmpty()
  email!: string;
}