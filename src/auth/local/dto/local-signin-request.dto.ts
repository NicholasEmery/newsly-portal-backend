import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { SessionDto } from "../../dto/session.dto";
import { UserLocalSignInDto } from "./local-signin.dto";

export class LocalSignInRequestDto {
  @ApiProperty({ type: () => UserLocalSignInDto })
  @ValidateNested()
  @Type(() => UserLocalSignInDto)
  user!: UserLocalSignInDto;

  @ApiProperty({ type: () => SessionDto })
  @ValidateNested()
  @Type(() => SessionDto)
  meta!: SessionDto;
}