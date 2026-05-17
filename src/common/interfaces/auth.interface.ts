import { Request } from "express";
import { Role } from "@generated/prisma/enums";

// Interface para requests autenticados
export interface AuthenticatedRequest extends Request {
  user: { id: string; role: Role };
}
