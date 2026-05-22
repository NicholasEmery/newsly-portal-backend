import { Test, TestingModule } from "@nestjs/testing";
import axios from "axios";
import * as fs from "fs";
import * as path from "path";
import { UploadsService } from "../uploads.service";

// Mock do axios
jest.mock("axios");
const mockAxios = axios as jest.Mocked<typeof axios>;

// Mock do fs
jest.mock("fs", () => ({
  promises: {
    access: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
  },
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  writeFileSync: jest.fn(),
}));
type MockFsPromises = {
  access: jest.Mock;
  writeFile: jest.Mock;
  mkdir: jest.Mock;
};
type MockFs = {
  existsSync: jest.Mock;
  mkdirSync: jest.Mock;
  writeFileSync: jest.Mock;
};

const mockFsPromises = fs.promises as unknown as MockFsPromises;
const mockFs = fs as unknown as MockFs;

// Mock do path
jest.mock("path");
const mockPath = path as jest.Mocked<typeof path>;

describe("UploadsService", () => {
  let service: UploadsService;
  type AxiosGetCall = [string, { responseType: "arraybuffer"; timeout: number }];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UploadsService],
    }).compile();

    service = module.get<UploadsService>(UploadsService);

    jest.clearAllMocks();

    // Configurar mocks padrão
    mockPath.join.mockImplementation((...args: string[]) => args.join("/"));
    mockFsPromises.access.mockResolvedValue(undefined);
    mockFsPromises.writeFile.mockResolvedValue(undefined);
    mockFsPromises.mkdir.mockResolvedValue(undefined);
    process.env.UPLOAD_DIR_DEV = "uploads";
    process.env.UPLOAD_DIR_PROD = "/app/uploads";
  });

  describe("downloadAndSaveFile", () => {
    const url = "http://example.com/image.jpg";
    const responseData = Buffer.from("image-data");

    it("deve baixar e salvar arquivo da URL com sucesso", async () => {
      const mockResponse = {
        data: responseData,
        headers: { "content-type": "image/jpeg" },
      };

      mockAxios.get.mockResolvedValue(mockResponse);
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockReturnValue(undefined);
      mockFs.writeFileSync.mockReturnValue(undefined);

      const result = await service.downloadAndSaveFile(url);

      const axiosCall = mockAxios.get.mock.calls[0];
      expect(axiosCall?.[0]).toBe(url);
      expect(axiosCall?.[1]).toEqual({ responseType: "arraybuffer", timeout: 10000 });
      expect(mockFsPromises.writeFile.mock.calls[0]).toEqual([expect.stringContaining("uploads/"), responseData]);
      expect(result).toMatch(/^\/uploads\//);
    });

    it("deve detectar tipo de arquivo da extensão se content-type não for imagem", async () => {
      const mockResponse = {
        data: responseData,
        headers: { "content-type": "application/octet-stream" },
      };

      mockAxios.get.mockResolvedValue(mockResponse);
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockReturnValue(undefined);
      mockFs.writeFileSync.mockReturnValue(undefined);

      await service.downloadAndSaveFile("http://example.com/file.jpg");

      expect(mockFsPromises.writeFile.mock.calls[0]).toEqual([expect.stringContaining("uploads/"), responseData]);
    });

    it("deve lançar InternalServerErrorException se o download falhar", async () => {
      const error = new Error("Network error");
      mockAxios.get.mockRejectedValue(error);

      await expect(service.downloadAndSaveFile(url)).rejects.toThrow(
        "Falha ao baixar e salvar arquivo da URL: Network error",
      );
    });

    it("deve criar diretório se não existir", async () => {
      const mockResponse = {
        data: responseData,
        headers: { "content-type": "image/png" },
      };

      mockAxios.get.mockResolvedValue(mockResponse);
      mockFsPromises.access.mockRejectedValue(new Error("Not found"));
      mockFsPromises.mkdir.mockResolvedValue(undefined);
      mockFsPromises.writeFile.mockResolvedValue(undefined);
      process.env.UPLOAD_DIR_DEV = ""; // Força usar defaultDir

      await service.downloadAndSaveFile(url);

      expect(mockFsPromises.mkdir).toHaveBeenCalledWith(expect.stringContaining("uploadsFile"), { recursive: true });
    });
  });

  describe("saveUploadedFile", () => {
    const mockFile = {
      buffer: Buffer.from([0xff, 0xd8, 0xff, ...Buffer.from("file-content")]),
      originalname: "test.jpg",
      mimetype: "image/jpeg",
    } as unknown as Express.Multer.File;

    it("deve salvar arquivo enviado com sucesso", async () => {
      mockFs.existsSync.mockReturnValue(false);
      mockFs.mkdirSync.mockReturnValue(undefined);
      mockFs.writeFileSync.mockReturnValue(undefined);

      const result = await service.saveUploadedFile(mockFile);

      expect(mockFsPromises.writeFile).toHaveBeenCalledWith(expect.stringContaining("uploads/"), mockFile.buffer);
      expect(result).toMatch(/^\/uploads\//);
    });

    it("deve lançar InternalServerErrorException se writeFile falhar", async () => {
      const error = new Error("Write error");
      mockFsPromises.writeFile.mockRejectedValue(error);

      await expect(service.saveUploadedFile(mockFile)).rejects.toThrow("Falha ao salvar arquivo enviado: Write error");
    });
  });

  describe("validateImageFile", () => {
    it("deve validar arquivo de imagem JPEG com sucesso", () => {
      const buffer = Buffer.from("fake-jpeg-data");
      const mimetype = "image/jpeg";

      expect(() => service.validateImageFile(buffer, mimetype)).not.toThrow();
    });

    it("deve validar arquivo de imagem PNG com sucesso", () => {
      const buffer = Buffer.from("fake-png-data");
      const mimetype = "image/png";

      expect(() => service.validateImageFile(buffer, mimetype)).not.toThrow();
    });

    it("deve lançar BadRequestException para tipo MIME não detectado", () => {
      const buffer = Buffer.from("data");
      const mimetype = "";

      expect(() => service.validateImageFile(buffer, mimetype)).toThrow(
        "Tipo de arquivo não detectado. Apenas imagens válidas são aceitas.",
      );
    });

    it("deve lançar BadRequestException para tipo MIME não permitido", () => {
      const buffer = Buffer.from("data");
      const mimetype = "image/gif";

      expect(() => service.validateImageFile(buffer, mimetype)).toThrow(
        "Tipo de arquivo não permitido. Apenas imagens PNG e JPEG são aceitas.",
      );
    });

    it("deve detectar tipo de arquivo por buffer se mimetype estiver vazio", () => {
      // Simular detecção de JPEG
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff]); // JPEG header

      expect(() => service.validateImageFile(jpegBuffer, "")).not.toThrow();
    });
  });

  describe("getFileExtension", () => {
    it("deve retornar extensão correta para tipos MIME", () => {
      expect(service.getFileExtension("image/jpeg")).toBe("jpg");
      expect(service.getFileExtension("image/png")).toBe("png");
      expect(service.getFileExtension("unknown")).toBe("bin");
    });
  });

  describe("healthCheck", () => {
    it("deve retornar true se o diretório existir", async () => {
      const result = await service.healthCheck();

      expect(result).toBe(true);
    });

    it("deve retornar false se o diretório não existir", async () => {
      mockFsPromises.access.mockRejectedValue(new Error("Not found"));

      const result = await service.healthCheck();

      expect(result).toBe(false);
    });
  });
});
