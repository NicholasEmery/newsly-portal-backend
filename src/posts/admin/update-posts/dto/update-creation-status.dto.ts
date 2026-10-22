import { ApiProperty } from "@nestjs/swagger";
// Importações para DTO de atualização de status de criação
import { RequestStatus } from "@generated/prisma/enums";
import { IsNotEmpty, IsString, IsEnum, IsUUID } from "class-validator";

// Classe UpdateCreationStatusDto: DTO para atualizar status de criação
export class UpdateCreationStatusDto {
  @ApiProperty({ example: "creation-request-uuid-1", description: "Identificador da requisição de criação." })
  @IsNotEmpty()
  @IsString()
  @IsUUID("4", { each: true })
  id: string;

  // Campo status: Status da criação
  @ApiProperty({ enum: RequestStatus, example: RequestStatus.APPROVED, description: "Novo status da requisição." })
  @IsNotEmpty()
  @IsString()
  @IsEnum(RequestStatus)
  status: RequestStatus;
}
