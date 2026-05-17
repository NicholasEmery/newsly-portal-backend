import * as bcrypt from "bcrypt";
import * as crypto from "crypto";

export class TokenHelper {

  async generateOpaqueToken(length = 64) {
    return crypto.randomBytes(length).toString("hex");
  }

  async hashToken(token: string): Promise<string> {
    const saltRounds = 10; // custo do bcrypt
    return bcrypt.hash(token, saltRounds);
  }

  async compareToken(token: string, hash: string): Promise<boolean> {
    return bcrypt.compare(token, hash);
  }
}
