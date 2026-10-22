import { Body, Controller, Get, HttpException, HttpStatus, Post, Query, Req, UseGuards } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from "@nestjs/swagger";
import { UserGoogleDto } from "./dto/userGoogle.dto";
import { GoogleService } from "./google.service";
import { GoogleOauthGuard } from "./guard/google-oauth.guard";
import { SessionDto } from "../dto/session.dto";
import { GoogleLinkRequestDto } from "./dto/google-link-request.dto";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erro inesperado";
}

@Controller("auth/google")
@ApiTags("Auth")
export class GoogleController {
  constructor(private readonly googleService: GoogleService) {}

  @Get("google")
  @UseGuards(GoogleOauthGuard)
  @ApiOperation({
    summary: "Iniciar login com Google",
    description: "Redireciona o usuário para o fluxo OAuth do Google.",
  })
  async googleAuth() {
    // Inicia o redirect para o Google
  }

  @Get("google/callback")
  @UseGuards(GoogleOauthGuard)
  @ApiOperation({
    summary: "Callback OAuth do Google",
    description: "Recebe o retorno do Google, cria ou vincula a conta e emite tokens para a sessão do dispositivo.",
  })
  @ApiQuery({ name: "deviceId", required: true, example: "device-123" })
  @ApiQuery({ name: "userAgent", required: true, example: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" })
  @ApiQuery({ name: "ip", required: true, example: "203.0.113.10" })
  @ApiOkResponse({
    description: "Login Google concluído ou confirmação de vínculo solicitada.",
    schema: {
      oneOf: [
        {
          example: {
            message: "Usuário autenticado com sucesso via Google.",
            accessToken: "eyJhbGciOi...access-token-example...",
            refreshToken: "xQ5k1r9N4YxQk...refresh-token-example...",
          },
        },
        {
          example: {
            message: "Uma conta com este email já existe. Deseja vincular o Google a esta conta ou criar uma nova?",
            user: {
              name: "Nicholas Emery",
              email: "nicholas@example.com",
              picture: "https://example.com/avatar.png",
            },
          },
        },
      ],
    },
  })
  async googleCallback(
    @Req() req: Request & { user: UserGoogleDto },
    @Query() meta: SessionDto,
  ): Promise<
    | { message: string; accessToken: string; refreshToken: string }
    | { message: string; user: { name: string; email: string; picture: string } }
  > {
    const user = req.user;

    try {
      return await this.googleService.validateLoginOrCreateUserFromGoogle(user, meta);
    } catch (error: unknown) {
      throw new HttpException(getErrorMessage(error), HttpStatus.BAD_REQUEST);
    }
  }

  @Post("link")
  @ApiOperation({
    summary: "Solicitar vínculo do Google",
    description: "Inicia o fluxo de confirmação por email para conectar uma conta Google a um usuário existente.",
  })
  @ApiBody({ type: GoogleLinkRequestDto })
  @ApiOkResponse({
    description: "Email de confirmação enviado.",
    schema: {
      example: {
        message: "Email de confirmação enviado.",
      },
    },
  })
  async linkGoogle(@Body() body: GoogleLinkRequestDto): Promise<{ message: string }> {
    const { email, provider, meta } = body;
    try {
      return await this.googleService.linkGoogleToUser(email, provider, meta);
    } catch (error: unknown) {
      throw new HttpException(getErrorMessage(error), HttpStatus.BAD_REQUEST);
    }
  }

  @Get("confirm-link")
  @ApiOperation({
    summary: "Confirmar vínculo do Google",
    description: "Valida o token enviado por email e finaliza o vínculo entre o Google e a conta local.",
  })
  @ApiQuery({ name: "token", required: true, example: "google-link-token-example" })
  @ApiOkResponse({
    description: "Vínculo confirmado e tokens emitidos.",
    schema: {
      example: {
        message: "Google vinculado com sucesso.",
        accessToken: "eyJhbGciOi...access-token-example...",
        refreshToken: "xQ5k1r9N4YxQk...refresh-token-example...",
      },
    },
  })
  async confirmLink(
    @Query("token") token: string,
  ): Promise<{ message: string; accessToken: string; refreshToken: string }> {
    try {
      return await this.googleService.confirmGoogleLink(token);
    } catch (error: unknown) {
      throw new HttpException(getErrorMessage(error), HttpStatus.BAD_REQUEST);
    }
  }
}
