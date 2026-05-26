import { Injectable, InternalServerErrorException, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-google-oauth20";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  public readonly enabled: boolean;
  private logger?: Logger;
  constructor() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;
    const localLogger = new Logger(GoogleStrategy.name);
    const isEnabled = Boolean(clientID && clientSecret && callbackURL);
    if (!isEnabled) {
      localLogger.warn("Google OAuth environment variables are not set — Google auth disabled");
      // Inicializa a strategy com valores placeholder para evitar falha na criação do provider
      super({
        clientID: "",
        clientSecret: "",
        callbackURL: "http://localhost",
        scope: ["email", "profile"],
        passReqToCallback: true,
      });
      this.logger = localLogger;
      this.enabled = false;
      return;
    }

    super({
      clientID: clientID!,
      clientSecret: clientSecret!,
      callbackURL: callbackURL!,
      scope: ["email", "profile"],
      passReqToCallback: true,
    });
    this.logger = localLogger;
    this.enabled = true;
  }

  validate(_req: unknown, _accessToken: string, _refreshToken: string, profile: Profile) {
    if (!this.enabled) {
      // Se a estratégia está desabilitada, não processar validação
      this.logger?.warn("Google strategy validate called but strategy is disabled");
      return null as any;
    }
    const email = profile.emails?.[0]?.value;

    return {
      email,
      given_name: profile.name?.givenName,
      family_name: profile.name?.familyName,
      picture: profile.photos?.[0]?.value,
      provider: "google",
      providerId: profile.id,
    };
  }
}
