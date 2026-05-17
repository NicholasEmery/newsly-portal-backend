import { IsOptional, IsString } from 'class-validator';

export class ApproveRejectDto {
  @IsOptional()
  @IsString()
  reason?: string;
}