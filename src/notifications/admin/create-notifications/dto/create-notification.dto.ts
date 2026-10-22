import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { NotificationType } from "@generated/prisma/enums";
import { IsString, IsOptional, IsEnum, IsArray, IsNotEmpty, IsUrl } from "class-validator";

export class CreateNotificationDto {
  @ApiProperty({ example: "Nova atualização disponível", description: "Título curto da notificação." })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({ example: "Há novidades na plataforma.", description: "Corpo principal da notificação." })
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiPropertyOptional({ example: "https://cdn.example.com/notifications/banner.png", description: "Imagem ilustrativa da notificação." })
  @IsOptional()
  @IsString()
  imageUrl?: string;

  @ApiPropertyOptional({ example: "https://newsly.example.com/updates", description: "Link de destino associado à notificação." })
  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: true, protocols: ["https"] })
  linkUrl?: string;

  @ApiProperty({ enum: NotificationType, example: NotificationType.USERS, description: "Tipo de público-alvo da notificação." })
  @IsNotEmpty()
  @IsEnum(NotificationType, { message: "Tipo de notificação inválido" })
  recipientsType: NotificationType;

  @ApiPropertyOptional({ type: [String], example: ["user-uuid-1", "user-uuid-2"], description: "Ids dos destinatários quando o tipo exigir públicos específicos." })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipients?: string[]; // userIds if type USERS

  @ApiPropertyOptional({ example: "post-uuid-1", description: "Id do post relacionado à notificação, quando aplicável." })
  @IsOptional()
  @IsString()
  postId?: string; // For POST_ALL and POST_COLLABORATORS types
}
