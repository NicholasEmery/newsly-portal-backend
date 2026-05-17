import { Injectable, BadRequestException, InternalServerErrorException } from "@nestjs/common";
import { join, extname } from "path";
import { promises as fs } from "fs";
import axios from "axios";
import { randomUUID } from "crypto";
import * as mime from "mime-types";
// import { fileTypeFromBuffer } from "file-type"; // Removido para facilitar testes

@Injectable()
export class UploadsService {
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_MIME_TYPES = ["image/png", "image/jpeg"];

  // Método para detectar tipo de arquivo - pode ser mockado
  private async detectFileType(buffer: Buffer) {
    // Simulação simples baseada em headers
    if (buffer.length > 2 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      return { ext: "jpg", mime: "image/jpeg" };
    } else if (buffer.length > 8 && buffer[0] === 0x89 && buffer[1] === 0x50) {
      return { ext: "png", mime: "image/png" };
    }
    return null;
  }

  private async ensureUploadDir(): Promise<string> {
    // Define o diretório padrão como 'uploadsFile' na raiz do projeto
    const defaultDir = join(process.cwd(), "uploadsFile");
    let uploadDir = process.env.NODE_ENV === "production" ? process.env.UPLOAD_DIR_PROD : process.env.UPLOAD_DIR_DEV;

    // Se não houver variável de ambiente, procura o diretório 'uploadsFile' no codebase
    if (!uploadDir) {
      try {
        // Tenta acessar o diretório 'uploadsFile'
        await fs.access(defaultDir);
        uploadDir = defaultDir;
      } catch {
        // Se não existir, cria o diretório 'uploadsFile'
        await fs.mkdir(defaultDir, { recursive: true });
        uploadDir = defaultDir;
      }
    }

    // Retorna caminho relativo ao cwd para consistência
    return uploadDir.startsWith(process.cwd())
      ? uploadDir.replace(process.cwd() + "\\", "").replace(process.cwd() + "/", "")
      : uploadDir;
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

      // Baixar o arquivo da URL
      const response = await axios.get(url, { responseType: "arraybuffer", timeout: 10000 });
      const buffer = Buffer.from(response.data);

      // Detectar extensão baseada no conteúdo do arquivo
      const fileType = await this.detectFileType(buffer);
      let ext = "";
      if (fileType) {
        ext = "." + fileType.ext;
      } else {
        // Fallback: tentar da URL ou Content-Type
        const urlPath = new URL(url).pathname;
        ext = extname(urlPath);
        if (!ext) {
          const contentType = response.headers["content-type"];
          const mimeExt = mime.extension(contentType);
          if (mimeExt) {
            ext = "." + mimeExt;
          }
        }
      }

      // Gerar filename seguro com UUID
      const filename = randomUUID() + ext;

      const filePath = join(process.cwd(), uploadDir, filename);
      await fs.writeFile(filePath, buffer);

      // Retorna apenas o caminho relativo para salvar no banco
      return `/${uploadDir}/${filename}`;
    } catch (error) {
      throw new InternalServerErrorException(`Falha ao baixar e salvar arquivo da URL: ${error.message}`);
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
      // Validar tamanho do arquivo
      if (file.buffer.length > this.MAX_FILE_SIZE) {
        throw new BadRequestException(
          `Arquivo muito grande. Tamanho máximo permitido: ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`,
        );
      }

      // Determinar extensão: baseada no conteúdo, fallback para originalname
      const fileType = await this.detectFileType(file.buffer);
      if (!fileType) {
        throw new BadRequestException("Tipo de arquivo não detectado. Apenas imagens válidas são aceitas.");
      }
      const ext = "." + fileType.ext;

      // Validar tipo
      if (!this.ALLOWED_MIME_TYPES.includes(fileType.mime)) {
        throw new BadRequestException(`Tipo de arquivo não permitido. Apenas imagens PNG e JPEG são aceitas.`);
      }

      const uploadDir = await this.ensureUploadDir();

      // Gerar filename seguro com UUID
      const filename = randomUUID() + ext;

      const filePath = join(process.cwd(), uploadDir, filename);
      await fs.writeFile(filePath, file.buffer);

      // Retorna apenas o caminho relativo para salvar no banco
      return `/${uploadDir}/${filename}`;
    } catch (error) {
      throw new InternalServerErrorException(`Falha ao salvar arquivo enviado: ${error.message}`);
    }
  }

  /**
   * Valida se o buffer representa um arquivo de imagem válido (PNG/JPEG).
   * @param buffer - O buffer do arquivo.
   * @param mimetype - O tipo MIME fornecido (opcional).
   */
  validateImageFile(buffer: Buffer, mimetype: string): void {
    // Se mimetype não fornecido, tentar detectar pelo buffer
    let detectedMime = mimetype;
    if (!detectedMime) {
      // Simular detecção simples baseada em headers
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
