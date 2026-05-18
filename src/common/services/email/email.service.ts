import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as handlebars from "handlebars";
import * as nodemailer from "nodemailer";
import * as path from "path";

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private configService: ConfigService) {
    // Configura transporte SMTP a partir das variáveis de ambiente
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>("SMTP_HOST"),
      port: this.configService.get<number>("SMTP_PORT") || 587,
      secure: false,
      auth: {
        user: this.configService.get<string>("SMTP_USER"),
        pass: this.configService.get<string>("SMTP_PASS"),
      },
    });
  }

  async sendEmail(to: string, subject: string, templateName: string, data: Record<string, any>): Promise<void> {
    const templatePath = path.join(__dirname, "templates", `${templateName}.hbs`);

    let templateSource: string;
    try {
      templateSource = fs.readFileSync(templatePath, "utf-8");
    } catch (error) {
      throw new NotFoundException(`Template "${templateName}" not found at path: ${templatePath}`);
    }

    if (!templateSource) {
      throw new NotFoundException(`Template "${templateName}" not found at path: ${templatePath}`);
    }

    const template = handlebars.compile(templateSource);
    const html = template(data);

    const mailOptions = {
      from: this.configService.get<string>("EMAIL_FROM"),
      to,
      subject,
      html,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
