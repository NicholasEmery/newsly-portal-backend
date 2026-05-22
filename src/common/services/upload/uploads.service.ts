import { Injectable, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import axios from "axios";
import { randomUUID } from "crypto";
import { promises as fs } from "fs";
import * as mime from "mime-types";
import { join, extname } from "path";

@Injectable()
export class UploadsService {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_MIME_TYPES = ["image/png", "image/jpeg"];

  private detectFileType(buffer: Buffer): { ext: string; mime: string } | null {
    if (buffer.length > 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      return { ext: "jpg", mime: "image/jpeg" };
    }

    if (buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50) {
      return { ext: "png", mime: "image/png" };
    }

    return null;
  }

  private normalizeUploadDir(uploadDir: string): string {
    return uploadDir.replace(process.cwd() + "\\", "").replace(process.cwd() + "/", "");
  }

  private async ensureUploadDir(): Promise<string> {
    const defaultDir = join(process.cwd(), "uploadsFile");
    let uploadDir = process.env.NODE_ENV === "production" ? process.env.UPLOAD_DIR_PROD : process.env.UPLOAD_DIR_DEV;

    if (!uploadDir) {
      try {
        await fs.access(defaultDir);
        uploadDir = defaultDir;
      } catch {
        await fs.mkdir(defaultDir, { recursive: true });
        uploadDir = defaultDir;
      }
    }

    return uploadDir.startsWith(process.cwd()) ? this.normalizeUploadDir(uploadDir) : uploadDir;
  }

  /**
   * Baixa um arquivo de uma URL e o salva no diretório de uploadsFile.
   * Detecta a extensão baseada no conteúdo do arquivo para segurança.
   * @param url - A URL do arquivo a ser baixado.
   * @returns O caminho relativo do arquivo salvo (ex.: /uploadsFile/filename.ext).
   */
  async downloadAndSaveFile(url: string): Promise<string> {
    try {
      const uploadDir = await this.ensureUploadDir();

      const response = await axios.get<ArrayBuffer, { data: ArrayBuffer; headers: Record<string, string> }>(url, {
        responseType: "arraybuffer",
        timeout: 10000,
      });
      const buffer = Buffer.from(response.data);

      const fileType = this.detectFileType(buffer);
      let ext = "";
      if (fileType) {
        ext = "." + fileType.ext;
      } else {
        const urlPath = new URL(url).pathname;
        ext = extname(urlPath);
        if (!ext) {
          const contentType = response.headers["content-type"];
          const mimeExt = typeof contentType === "string" ? mime.extension(contentType) : undefined;
          if (mimeExt) {
            ext = "." + mimeExt;
          }
        }
      }

      const filename = randomUUID() + ext;

      const filePath = join(process.cwd(), uploadDir, filename);
      await fs.writeFile(filePath, buffer);

      return `/${uploadDir}/${filename}`;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      throw new InternalServerErrorException(`Falha ao baixar e salvar arquivo da URL: ${message}`);
    }
  }

  /**
   * Salva um arquivo enviado via upload (ex.: do client) no diretório de uploads.
   * Valida tamanho (máx. 5MB) e tipo (apenas PNG/JPEG) baseado no conteúdo.
   * @param file - O arquivo do Multer (Express.Multer.File).
   * @returns O caminho relativo do arquivo salvo (ex.: /uploads/filename.ext).
   */
  async saveUploadedFile(file: Express.Multer.File): Promise<string> {
    try {
      if (file.buffer.length > this.MAX_FILE_SIZE) {
        throw new BadRequestException(
          `Arquivo muito grande. Tamanho máximo permitido: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
        );
      }

      const fileType = this.detectFileType(file.buffer);
      if (!fileType) {
        throw new BadRequestException("Tipo de arquivo não detectado. Apenas imagens válidas são aceitas.");
      }
      const ext = "." + fileType.ext;

      if (!this.ALLOWED_MIME_TYPES.includes(fileType.mime)) {
        throw new BadRequestException(`Tipo de arquivo não permitido. Apenas imagens PNG e JPEG são aceitas.`);
      }

      const uploadDir = await this.ensureUploadDir();

      const filename = randomUUID() + ext;

      const filePath = join(process.cwd(), uploadDir, filename);
      await fs.writeFile(filePath, file.buffer);

      return `/${uploadDir}/${filename}`;
    } catch (error: unknown) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      const message = error instanceof Error ? error.message : "Unknown error";
      throw new InternalServerErrorException(`Falha ao salvar arquivo enviado: ${message}`);
    }
  }

  /**
   * Valida se o buffer representa um arquivo de imagem válido (PNG/JPEG).
   * @param buffer - O buffer do arquivo.
   * @param mimetype - O tipo MIME fornecido (opcional).
   */
  validateImageFile(buffer: Buffer, mimetype: string): void {
    let detectedMime = mimetype;
    if (!detectedMime) {
      if (buffer.length > 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
        detectedMime = "image/jpeg";
      } else if (buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50) {
        detectedMime = "image/png";
      }
    }

    if (!detectedMime) {
      throw new BadRequestException("Tipo de arquivo não detectado. Apenas imagens válidas são aceitas.");
    }

    if (!this.ALLOWED_MIME_TYPES.includes(detectedMime)) {
      throw new BadRequestException("Tipo de arquivo não permitido. Apenas imagens PNG e JPEG são aceitas.");
    }
  }

  /**
   * Retorna a extensão de arquivo baseada no tipo MIME.
   * @param mimetype - O tipo MIME.
   * @returns A extensão do arquivo.
   */
  getFileExtension(mimetype: string): string {
    switch (mimetype) {
      case "image/jpeg":
        return "jpg";
      case "image/png":
        return "png";
      default:
        return "bin";
    }
  }

  /**
   * Verifica se o diretório de uploads está acessível.
   * @returns true se o diretório existir, false caso contrário.
   */
  async healthCheck(): Promise<boolean> {
    try {
      const uploadDir = await this.ensureUploadDir();
      const fullPath = join(process.cwd(), uploadDir);
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }
}
