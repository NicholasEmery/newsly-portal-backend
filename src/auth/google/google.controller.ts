import { Controller, Get, Post, Req, Body, Query, UseGuards, HttpException, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { GoogleOauthGuard } from "./guard/google-oauth.guard";
import { UserGoogleDto } from "./dto/userGoogle.dto";
import { GoogleService } from "./google.service";
import { SessionDto } from "../dto/session.dto";

@ApiTags("Authentication Google")
@Controller("auth/google")
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @ApiOperation({ summary: "Redireciona para autenticação Google OAuth" })
  @ApiResponse({ status: 302, description: "Redirecionamento para Google" })
  @Get("google")
  @UseGuards(GoogleOauthGuard)
  async googleAuth() {
    // Inicia o redirect para o Google
  }

  @ApiOperation({ summary: "Callback do Google OAuth" })
  @ApiResponse({ status: 200, description: "Autenticação Google concluída" })
  @Get("google/callback")
  @UseGuards(GoogleOauthGuard)
  async googleCallback(
    @Req() req: Request & { user: UserGoogleDto },
    meta: SessionDto,
  ): Promise<
    | { message: string; accessToken: string; refreshToken: string }
    | { message: string; user: { name: string; email: string; picture: string } }
  > {
    const user = req.user;

    try {
      return await this.googleService.validateLoginOrCreateUserFromGoogle(user, meta);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @ApiOperation({ summary: "Iniciar vinculação do Google a conta existente" })
  @ApiResponse({ status: 200, description: "Email de confirmação enviado" })
  @Post("link")
  async linkGoogle(
    @Body() body: { email: string; provider: UserGoogleDto; meta: SessionDto },
  ): Promise<{ message: string }> {
    const { email, provider, meta } = body;
    try {
      return this.googleService.linkGoogleToUser(email, provider, meta);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @ApiOperation({ summary: "Confirmar vinculação via token do email" })
  @ApiResponse({ status: 200, description: "Google vinculado com sucesso" })
  @Get("confirm-link")
  async confirmLink(
    @Query("token") token: string,
  ): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    try {
      return this.googleService.confirmGoogleLink(token);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}
