import { IsIP, IsNotEmpty, IsString } from "class-validator";

export class SessionDto {
  @IsNotEmpty()
  @IsString()
  deviceId!: string;

  @IsNotEmpty()
  @IsString()
  userAgent!: string;

  @IsNotEmpty()
  @IsString()
  @IsIP()
  ip!: string;
}
