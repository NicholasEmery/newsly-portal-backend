import { Test, TestingModule } from "@nestjs/testing";
import { EmailService } from "../email.service";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import * as nodemailer from "nodemailer";

// Mock do fs
jest.mock("fs");
const mockFs = fs as jest.Mocked<typeof fs>;

// Mock do path
jest.mock("path");
const mockPath = path as jest.Mocked<typeof path>;

// Mock do nodemailer
jest.mock("nodemailer");
const mockNodemailer = nodemailer as jest.Mocked<typeof nodemailer>;

// Mock do ConfigService
const mockConfigService = {
  get: jest.fn(),
};

describe("EmailService", () => {
  let service: EmailService;
  let configService: ConfigService;
  let mockTransporter: any;

  beforeEach(async () => {
    mockTransporter = {
      sendMail: jest.fn(),
    };
    mockNodemailer.createTransport.mockReturnValue(mockTransporter);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
    configService = module.get<ConfigService>(ConfigService);

    jest.clearAllMocks();

    mockConfigService.get.mockImplementation((key: string) => {
      const config = {
        SMTP_HOST: "smtp.example.com",
        SMTP_PORT: 587,
        SMTP_USER: "user@example.com",
        SMTP_PASS: "password",
        EMAIL_FROM: "noreply@example.com",
      };
      return config[key];
    });
  });

  describe("sendEmail", () => {
    const to = "recipient@example.com";
    const subject = "Test Subject";
    const templateName = "test-template";
    const data = { name: "John Doe", token: "abc123" };

    it("deve enviar email com sucesso usando template válido", async () => {
      const templatePath = "/path/to/templates/test-template.hbs";
      const templateSource = "<h1>Hello {{name}}</h1><p>Token: {{token}}</p>";
      const compiledHtml = "<h1>Hello John Doe</h1><p>Token: abc123</p>";

      mockPath.join.mockReturnValue(templatePath);
      mockFs.readFileSync.mockReturnValue(templateSource);
      mockTransporter.sendMail.mockResolvedValue({});

      await service.sendEmail(to, subject, templateName, data);

      expect(mockPath.join).toHaveBeenCalledWith(
        expect.stringContaining("src\\common\\services\\email"),
        "templates",
        `${templateName}.hbs`,
      );
      expect(mockFs.readFileSync).toHaveBeenCalledWith(templatePath, "utf-8");
      expect(mockTransporter.sendMail).toHaveBeenCalledWith({
        from: "noreply@example.com",
        to,
        subject,
        html: compiledHtml,
      });
    });

    it("deve lançar NotFoundException se o template não for encontrado", async () => {
      const templatePath = "/path/to/templates/test-template.hbs";

      mockPath.join.mockReturnValue(templatePath);
      mockFs.readFileSync.mockReturnValue("");

      await expect(service.sendEmail(to, subject, templateName, data)).rejects.toThrow(
        `Template "${templateName}" not found at path: ${templatePath}`,
      );
    });

    it("deve lançar NotFoundException se readFileSync lançar erro", async () => {
      const templatePath = "/path/to/templates/test-template.hbs";
      const error = new Error("File not found");

      mockPath.join.mockReturnValue(templatePath);
      mockFs.readFileSync.mockImplementation(() => {
        throw error;
      });

      await expect(service.sendEmail(to, subject, templateName, data)).rejects.toThrow(
        `Template "${templateName}" not found at path: ${templatePath}`,
      );
    });

    it("deve compilar o template corretamente com dados", async () => {
      const templatePath = "/path/to/templates/test-template.hbs";
      const templateSource = "<p>Welcome {{name}}! Your code is {{token}}.</p>";

      mockPath.join.mockReturnValue(templatePath);
      mockFs.readFileSync.mockReturnValue(templateSource);
      mockTransporter.sendMail.mockResolvedValue({});

      await service.sendEmail(to, subject, templateName, data);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          html: "<p>Welcome John Doe! Your code is abc123.</p>",
        }),
      );
    });

    it("deve usar o EMAIL_FROM do config para o campo from", async () => {
      const templatePath = "/path/to/templates/test-template.hbs";
      const templateSource = "<p>Test</p>";

      mockPath.join.mockReturnValue(templatePath);
      mockFs.readFileSync.mockReturnValue(templateSource);
      mockTransporter.sendMail.mockResolvedValue({});

      await service.sendEmail(to, subject, templateName, data);

      expect(mockTransporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: "noreply@example.com",
        }),
      );
    });
  });
});
