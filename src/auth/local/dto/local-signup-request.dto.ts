import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { SessionDto } from "../../dto/session.dto";
import { UserLocalSignUpDto } from "./local-signup.dto";

export class LocalSignUpRequestDto {
  @ApiProperty({
    type: "string",
    description: "JSON com os dados do usuário local (sem o arquivo photoFile).",
  })
  @ValidateNested()
  @Type(() => UserLocalSignUpDto)
  user!: UserLocalSignUpDto;

  @ApiProperty({
    type: "string",
    description: "JSON com os metadados da sessão.",
  })
  @ValidateNested()
  @Type(() => SessionDto)
  meta!: SessionDto;
}