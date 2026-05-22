import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl } from "class-validator";
import { Role } from "../../../../generated/prisma/enums";

export class UserGoogleDto {
  @IsNotEmpty()
  @IsString()
  given_name!: string;

  @IsNotEmpty()
  @IsString()
  family_name!: string;

  @IsNotEmpty()
  @IsString()
  @IsUrl()
  picture!: string;

  @IsNotEmpty()
  @IsString()
  @IsEmail()
  email!: string;

  @IsNotEmpty()
  @IsString()
  provider!: string;

  @IsNotEmpty()
  @IsString()
  providerId!: string;

  @IsOptional()
  @IsEnum(Role)
  role?: Role;
}
