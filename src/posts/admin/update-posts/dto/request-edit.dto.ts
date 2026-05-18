import { Type } from "class-transformer";
import { IsObject, ValidateNested } from "class-validator";
import { ProposedChangeDto } from "./proposed-change.dto";

export class RequestEditDto {
  @IsObject()
  @ValidateNested({ message: "A mudança proposta deve ser um objeto válido" })
  @Type(() => ProposedChangeDto)
  proposedChanges: ProposedChangeDto;
}
