import { ApiProperty } from "@nestjs/swagger";
import { IsIP, IsNotEmpty, IsString } from "class-validator";

export class SessionDto {
  @ApiProperty({ example: "device-123", description: "Identificador estável do dispositivo ou navegador." })
  @IsNotEmpty()
  @IsString()
  deviceId!: string;

  @ApiProperty({
    example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    description: "User-Agent completo da sessão no navegador.",
  })
  @IsNotEmpty()
  @IsString()
  userAgent!: string;

  @ApiProperty({ example: "203.0.113.10", description: "Endereço IP observado na sessão." })
  @IsNotEmpty()
  @IsString()
  @IsIP()
  ip!: string;
}
