import { Role } from "@generated/prisma/enums";
import { Request } from "express";

// Interface para requests autenticados
export interface AuthenticatedRequest extends Request {
  user: { id: string; role: Role };
}
