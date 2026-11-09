import jwt from "jsonwebtoken";
import type { AccessScope } from "../../src/app/auth/services/access-scope/access-scope.service";

export function signToken(scope: AccessScope, secret = process.env.JWT_SECRET): string {
  if (!secret) {
    throw new Error("JWT_SECRET is required");
  }
  return jwt.sign(scope, secret, { expiresIn: "1h" });
}
