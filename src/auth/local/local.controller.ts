import { BadRequestException, Body, Controller, Get, HttpException, HttpStatus, Post, Query, Req } from "@nestjs/common";
import { ApiBody, ApiConsumes, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { PasswordResetConfirmDto } from "./dto/password-reset-confirm.dto";
import { PasswordResetRequestDto } from "./dto/password-reset.dto";
import { LocalSignInRequestDto } from "./dto/local-signin-request.dto";
import { LocalSignUpRequestDto } from "./dto/local-signup-request.dto";
import { UserLocalSignInDto } from "./dto/local-signin.dto";
import { UserLocalSignUpDto } from "./dto/local-signup.dto";
import { LocalService } from "./local.service";
import { SessionDto } from "../dto/session.dto";
import type { FastifyRequest } from "fastify";
import { parseMultipartJsonField, readMultipartFormData } from "src/common/utils/multipart-form-data";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erro inesperado";
}

@Controller("auth/local")
@ApiTags("Auth")
export class LocalController {
  constructor(private readonly localService: LocalService) {}

  @Post("signin")
  @ApiOperation({
    summary: "Entrar com email e senha",
    description: "Autentica o usuário local, valida credenciais e cria tokens para a sessão do dispositivo.",
  })
  @ApiBody({ type: LocalSignInRequestDto })
  @ApiOkResponse({
    description: "Autenticação local concluída.",
    schema: {
      example: {
        message: "Login realizado com sucesso.",
        accessToken: "eyJhbGciOi...access-token-example...",
        refreshToken: "xQ5k1r9N4YxQk...refresh-token-example...",
      },
    },
  })
  async signIn(@Body() body: LocalSignInRequestDto): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    const { user, meta } = body;
    try {
      return await this.localService.LoginFromLocal(user, meta);
    } catch (error: unknown) {
      throw new HttpException(getErrorMessage(error), HttpStatus.BAD_REQUEST);
    }
  }

  @Post("signup")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Criar conta local",
    description: "Registra um usuário local usando multipart/form-data, com dados do usuário, meta da sessão e foto de perfil.",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["user", "meta", "photoFile"],
      properties: {
        user: {
          type: "string",
          description: "JSON com os dados do usuário local.",
          example: JSON.stringify({
            firstName: "Nicholas",
            lastName: "Emery",
            email: "nicholas@example.com",
            password: "StrongPass123",
            role: "COLLABORATOR",
          }),
        },
        meta: {
          type: "string",
          description: "JSON com os metadados da sessão.",
          example: JSON.stringify({
            deviceId: "device-123",
            userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
            ip: "203.0.113.10",
          }),
        },
        photoFile: {
          type: "string",
          format: "binary",
          description: "Foto de perfil do usuário.",
        },
      },
    },
  })
  @ApiOkResponse({
    description: "Conta criada ou fluxo de verificação iniciado.",
    schema: {
      example: {
        message: "Cadastro realizado com sucesso.",
      },
    },
  })
  async signUp(
    @Req() request: FastifyRequest,
    @Body() body?: LocalSignUpRequestDto,
  ): Promise<{ message: string }> {
    try {
      if (body?.user?.photoFile && body?.meta) {
        return await this.localService.SignUpFromLocal(body.user, body.meta);
      }

      const { fields, file } = await readMultipartFormData(request);
      const user = parseMultipartJsonField<Omit<UserLocalSignUpDto, "photoFile">>(fields, "user");
      const meta = parseMultipartJsonField<SessionDto>(fields, "meta");

      if (!user) {
        throw new BadRequestException("Campo \"user\" é obrigatório.");
      }

      if (!meta) {
        throw new BadRequestException("Campo \"meta\" é obrigatório.");
      }

      if (!file) {
        throw new BadRequestException("Campo \"photoFile\" é obrigatório.");
      }

      return await this.localService.SignUpFromLocal({ ...user, photoFile: file }, meta);
    } catch (error: unknown) {
      throw new HttpException(getErrorMessage(error), HttpStatus.BAD_REQUEST);
    }
  }

  @Get("verify-email")
  @ApiOperation({
    summary: "Confirmar email local",
    description: "Valida o token enviado por email e conclui o cadastro local.",
  })
  @ApiQuery({ name: "token", required: true, example: "eyJhbGciOi...email-token-example..." })
  @ApiOkResponse({
    description: "Email validado e tokens emitidos.",
    schema: {
      example: {
        message: "Email verificado com sucesso.",
        accessToken: "eyJhbGciOi...access-token-example...",
        refreshToken: "xQ5k1r9N4YxQk...refresh-token-example...",
      },
    },
  })
  async verifyEmail(
    @Query("token") token: string,
  ): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    try {
      return await this.localService.confirmEmailVerification(token);
    } catch (error: unknown) {
      throw new HttpException(getErrorMessage(error), HttpStatus.BAD_REQUEST);
    }
  }

  @Post("password-reset")
  @ApiOperation({
    summary: "Solicitar redefinição de senha",
    description: "Inicia o fluxo de redefinição de senha para o email informado.",
  })
  @ApiBody({ type: PasswordResetRequestDto })
  @ApiOkResponse({
    description: "Email de redefinição enviado.",
    schema: {
      example: {
        message: "Email de redefinição de senha enviado",
      },
    },
  })
  async passwordReset(@Body() body: PasswordResetRequestDto): Promise<{ message: string }> {
    try {
      await this.localService.initiatePasswordReset(body.email);
      return { message: "Email de redefinição de senha enviado" };
    } catch (error: unknown) {
      throw new HttpException(getErrorMessage(error), HttpStatus.BAD_REQUEST);
    }
  }

  @Post("password-reset/confirm")
  @ApiOperation({
    summary: "Confirmar redefinição de senha",
    description: "Valida o token de redefinição e grava a nova senha do usuário.",
  })
  @ApiBody({ type: PasswordResetConfirmDto })
  @ApiOkResponse({
    description: "Senha redefinida com sucesso.",
    schema: {
      example: {
        message: "Senha redefinida com sucesso",
      },
    },
  })
  async confirmPasswordReset(@Body() body: PasswordResetConfirmDto): Promise<{ message: string }> {
    try {
      await this.localService.confirmPasswordReset(body.token, body.newPassword);
      return { message: "Senha redefinida com sucesso" };
    } catch (error: unknown) {
      throw new HttpException(getErrorMessage(error), HttpStatus.BAD_REQUEST);
    }
  }
}
