import { IsOptional, IsString } from 'class-validator';

export class ReadUserDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsOptional()
  @IsString()
  email?: string;
}