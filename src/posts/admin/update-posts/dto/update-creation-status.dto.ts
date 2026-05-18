// Importações para DTO de atualização de status de criação
import { RequestStatus } from "@generated/prisma/enums";
import { IsNotEmpty, IsString, IsEnum, IsUUID } from "class-validator";

// Classe UpdateCreationStatusDto: DTO para atualizar status de criação
export class UpdateCreationStatusDto {
  @IsNotEmpty()
  @IsString()
  @IsUUID("4", { each: true })
  id: string;

  // Campo status: Status da criação
  @IsNotEmpty()
  @IsString()
  @IsEnum(RequestStatus)
  status: RequestStatus;
}
