import { timingSafeEqual } from "node:crypto";
import { Injectable } from "@nestjs/common";
import jwt from "jsonwebtoken";
import { publicUser, UserRepository } from "../../repositories/user.repository";
import type { LoginResult } from "./login.interface";

export type { LoginResult } from "./login.interface";

export function passwordMatches(password: string, passwordHash: string): boolean {
  const left = Buffer.from(password);
  const right = Buffer.from(passwordHash);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

@Injectable()
export class LoginService {
  private readonly users = new UserRepository();

  async execute(email: string, password: string): Promise<LoginResult> {
    const user = await this.users.findByEmail(email);
    if (!user || !passwordMatches(password, user.passwordHash)) {
      return { code: "INVALID_CREDENTIALS" };
    }
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return { code: "INVALID_CREDENTIALS" };
    }
    const visible = publicUser(user);
    const accessToken = jwt.sign(
      {
        sub: visible.id,
        profile: visible.profile,
        clientId: visible.clientId,
        allowedStoreIds: visible.allowedStoreIds,
      },
      secret,
      { expiresIn: "12h" },
    );
    return { accessToken, profile: visible.profile, clientId: visible.clientId };
  }
}
