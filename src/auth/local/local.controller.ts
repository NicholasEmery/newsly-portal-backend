import { Controller, Post, Body, Get, Query, HttpException, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { UserLocalSignInDto } from "./dto/local-signin.dto";
import { UserLocalSignUpDto } from "./dto/local-signup.dto";
import { LocalService } from "./local.service";
import { SessionDto } from "../dto/session.dto";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erro inesperado";
}

@ApiTags("Authentication Local")
@Controller("auth/local")
export class LocalController {
  constructor(private readonly localService: LocalService) {}

  @ApiOperation({ summary: "Login com credenciais locais" })
  @ApiResponse({ status: 200, description: "Login bem-sucedido" })
  @Post("signin")
  async signIn(
    @Body() body: { user: UserLocalSignInDto; meta: SessionDto },
  ): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    const { user, meta } = body;
    try {
      return await this.localService.LoginFromLocal(user, meta);
    } catch (error: unknown) {
      throw new HttpException(getErrorMessage(error), HttpStatus.BAD_REQUEST);
    }
  }

  @ApiOperation({ summary: "Iniciar cadastro com credenciais locais (envia email de verificação)" })
  @ApiResponse({ status: 200, description: "Email de verificação enviado" })
  @Post("signup")
  async signUp(@Body() body: { user: UserLocalSignUpDto; meta: SessionDto }): Promise<{ message: string }> {
    const { user, meta } = body;
    try {
      return await this.localService.SignUpFromLocal(user, meta);
    } catch (error: unknown) {
      throw new HttpException(getErrorMessage(error), HttpStatus.BAD_REQUEST);
    }
  }

  @ApiOperation({ summary: "Confirmar verificação de email via token" })
  @ApiResponse({ status: 200, description: "Conta criada com sucesso" })
  @Get("verify-email")
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
  async passwordReset(@Body() body: { email: string }): Promise<{ message: string }> {
    try {
      await this.localService.initiatePasswordReset(body.email);
      return { message: "Email de redefinição de senha enviado" };
    } catch (error: unknown) {
      throw new HttpException(getErrorMessage(error), HttpStatus.BAD_REQUEST);
    }
  }

  @Post("password-reset/confirm")
  async confirmPasswordReset(@Body() body: { token: string; newPassword: string }): Promise<{ message: string }> {
    try {
      await this.localService.confirmPasswordReset(body.token, body.newPassword);
      return { message: "Senha redefinida com sucesso" };
    } catch (error: unknown) {
      throw new HttpException(getErrorMessage(error), HttpStatus.BAD_REQUEST);
    }
  }
}
