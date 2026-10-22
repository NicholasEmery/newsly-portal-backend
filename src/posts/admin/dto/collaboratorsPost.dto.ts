import { ApiProperty } from "@nestjs/swagger";
import { CollaboratorPermission } from "@generated/prisma/enums";
import { IsEmail, IsEnum, IsNotEmpty, IsObject, IsString } from "class-validator";

export class CollaboratorsPostDto {
  @ApiProperty({ example: "collab@example.com", description: "Email do colaborador convidado." })
  @IsNotEmpty({ message: "O email não pode estar vazio" })
  @IsString({ message: "Precisa ser uma string válida" })
  @IsEmail({}, { message: "Precisa ser um email válido" })
  email: string;

  @ApiProperty({
    enum: CollaboratorPermission,
    isArray: true,
    example: [CollaboratorPermission.NO_REQUEST_EDITOR],
    description: "Permissões concedidas ao colaborador.",
  })
  @IsNotEmpty({ message: "A permissão não pode estar vazia" })
  @IsString({ message: "Precisa ser uma string válida" })
  @IsObject({ each: true, message: "Precisa ser um objeto de string de permissões" })
  @IsEnum(CollaboratorPermission, { each: true, message: "O valor deve ser uma permissão válida" })
  permission: CollaboratorPermission[];
}
