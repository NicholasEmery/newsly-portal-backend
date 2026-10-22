import { BadRequestException } from "@nestjs/common";
import type { FastifyRequest } from "fastify";

export type MultipartFields = Record<string, string>;

export interface MultipartFormDataResult {
  fields: MultipartFields;
  file?: Express.Multer.File;
}

type MultipartPart =
  | {
      type: "file";
      fieldname: string;
      filename: string;
      mimetype: string;
      encoding: string;
      toBuffer: () => Promise<Buffer>;
    }
  | {
      type: "field";
      fieldname: string;
      value: string;
    };

export async function readMultipartFormData(request: FastifyRequest): Promise<MultipartFormDataResult> {
  const fields: MultipartFields = {};
  let file: Express.Multer.File | undefined;

  for await (const part of request.parts() as AsyncIterable<MultipartPart>) {
    if (part.type === "file") {
      const buffer = await part.toBuffer();
      file = {
        fieldname: part.fieldname,
        originalname: part.filename,
        encoding: part.encoding,
        mimetype: part.mimetype,
        size: buffer.length,
        buffer,
        destination: "",
        filename: part.filename,
        path: "",
      } as Express.Multer.File;
      continue;
    }

    fields[part.fieldname] = part.value;
  }

  return { fields, file };
}

export function parseMultipartJsonField<T>(fields: MultipartFields, fieldName: string, required = true): T | undefined {
  const rawValue = fields[fieldName];

  if (!rawValue) {
    if (required) {
      throw new BadRequestException(`Campo "${fieldName}" é obrigatório.`);
    }

    return undefined;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    throw new BadRequestException(`Campo "${fieldName}" contém JSON inválido.`);
  }
}