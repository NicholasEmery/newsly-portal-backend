import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshTokenDto {
  @ApiProperty({
    example: "xQ5k1r9N4YxQk...refresh-token-example...",
    description: "Refresh token emitido na autenticação anterior.",
  })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}