import { OmitType } from "@nestjs/mapped-types";
import { CreatePostDto } from "../../create-posts/dto/create-post.dto";

export class ProposedChangeDto extends OmitType(CreatePostDto, ["categories", "collaborators"] as const) {}
