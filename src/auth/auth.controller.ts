import { Body, Controller, HttpException, HttpStatus, Post } from "@nestjs/common";
import { ApiBody, ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { TokensService } from "./tokens.service";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erro inesperado";
}

@Controller("auth")
@ApiTags("Auth")
export class AuthController {
  constructor(private readonly tokensService: TokensService) {}

  @Post("refresh")
  @ApiOperation({
    summary: "Renovar access token",
    description: "Troca um refresh token válido por um novo par de tokens JWT.",
  })
  @ApiBody({
    type: RefreshTokenDto,
    examples: {
      default: {
        summary: "Refresh token válido",
        value: {
          refreshToken: "eyJhbGciOi...refresh-token-example...",
        },
      },
    },
  })
  @ApiOkResponse({
    description: "Tokens renovados com sucesso.",
    schema: {
      example: {
        accessToken: "eyJhbGciOi...access-token-example...",
        refreshToken: "xQ5k1r9N4YxQk...new-refresh-token...",
      },
    },
  })
  async refreshToken(@Body() body: RefreshTokenDto): Promise<{ accessToken: string; refreshToken: string }> {
    const { refreshToken } = body;
    try {
      const newTokens = await this.tokensService.refreshTokens(refreshToken);
      return newTokens;
    } catch (error: unknown) {
      throw new HttpException(getErrorMessage(error), HttpStatus.UNAUTHORIZED);
    }
  }
}
