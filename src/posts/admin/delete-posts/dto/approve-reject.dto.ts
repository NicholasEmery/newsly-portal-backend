import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ApproveRejectDto {
  @ApiPropertyOptional({ example: "Conteúdo fora do escopo editorial", description: "Motivo opcional da aprovação ou rejeição." })
  @IsOptional()
  @IsString()
  reason?: string;
}
