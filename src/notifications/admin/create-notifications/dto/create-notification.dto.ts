import { NotificationType } from "@generated/prisma/enums";
import { IsString, IsOptional, IsEnum, IsArray, IsNotEmpty, IsUrl } from "class-validator";

export class CreateNotificationDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  body: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: true, protocols: ["https"] })
  linkUrl?: string;

  @IsNotEmpty()
  @IsEnum(NotificationType, { message: "Tipo de notificação inválido" })
  recipientsType: NotificationType;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  recipients?: string[]; // userIds if type USERS

  @IsOptional()
  @IsString()
  postId?: string; // For POST_ALL and POST_COLLABORATORS types
}
