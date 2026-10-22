import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";
import { SessionDto } from "../../dto/session.dto";
import { UserGoogleDto } from "./userGoogle.dto";

export class GoogleLinkRequestDto {
  @ApiProperty({ example: "nicholas@example.com", description: "Email da conta local que será vinculada." })
  email!: string;

  @ApiProperty({ type: () => UserGoogleDto })
  @ValidateNested()
  @Type(() => UserGoogleDto)
  provider!: UserGoogleDto;

  @ApiProperty({ type: () => SessionDto })
  @ValidateNested()
  @Type(() => SessionDto)
  meta!: SessionDto;
}