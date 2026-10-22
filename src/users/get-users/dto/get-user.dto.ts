import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ReadUserDto {
  @ApiPropertyOptional({ example: "550e8400-e29b-41d4-a716-446655440000", description: "Identificador do usuário." })
  @IsOptional()
  @IsString()
  id?: string;

  @ApiPropertyOptional({ example: "nicholas@example.com", description: "Email do usuário." })
  @IsOptional()
  @IsString()
  email?: string;
}
