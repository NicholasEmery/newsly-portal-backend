import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Profile, Strategy } from "passport-google-oauth20";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  constructor() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_CALLBACK_URL;
    if (!clientID || !clientSecret || !callbackURL) {
      throw new InternalServerErrorException("Google OAuth environment variables are not set");
    }
    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ["email", "profile"],
      passReqToCallback: true,
    });
  }

  validate(_req: unknown, _accessToken: string, _refreshToken: string, profile: Profile) {
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
