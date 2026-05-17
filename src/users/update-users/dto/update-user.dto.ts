import { IsEmail, IsOptional, IsString, IsIn } from "class-validator";
import { Role } from "../../../../generated/prisma/enums";

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  photo?: string;

  @IsOptional()
  @IsString()
  passwordHash?: string;

  @IsOptional()
  @IsIn(["READER", "PUBLISHER", "COLLABORATOR"])
  role?: Role;
}
