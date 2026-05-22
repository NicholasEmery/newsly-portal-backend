import { Controller, Post, Body, HttpException, HttpStatus } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { TokensService } from "./tokens.service";

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "Erro inesperado";
}

@ApiTags("Authentication")
@Controller("auth")
export class AuthController {
  constructor(private readonly tokensService: TokensService) {}

  @ApiOperation({ summary: "Renovar tokens usando refresh token" })
  @ApiResponse({ status: 200, description: "Tokens renovados" })
  @Post("refresh")
  async refreshToken(@Body() body: { refreshToken: string }): Promise<{ accessToken: string; refreshToken: string }> {
    const { refreshToken } = body;
    try {
      const newTokens = await this.tokensService.refreshTokens(refreshToken);
      return newTokens;
    } catch (error: unknown) {
      throw new HttpException(getErrorMessage(error), HttpStatus.UNAUTHORIZED);
    }
  }
}
