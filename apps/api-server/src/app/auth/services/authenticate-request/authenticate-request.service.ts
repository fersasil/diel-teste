import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import jwt from "jsonwebtoken";
import type { AccessScope } from "../access-scope/access-scope.service";
import { getFocus } from "../focus-client/focus-client.service";

@Injectable()
export class AuthenticateRequestGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      access?: AccessScope;
    }>();
    const header = request.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new UnauthorizedException({ code: "UNAUTHENTICATED" });
    }

    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new UnauthorizedException({ code: "UNAUTHENTICATED" });
    }

    try {
      const payload = jwt.verify(header.slice("Bearer ".length), secret);

      if (!payload || typeof payload === "string") {
        throw new UnauthorizedException({ code: "UNAUTHENTICATED" });
      }

      const userId = typeof payload.sub === "string" ? payload.sub : undefined;
      request.access = {
        profile: payload.profile,
        clientId: payload.clientId ?? null,
        allowedStoreIds: payload.allowedStoreIds ?? [],
        focusedClientId: userId ? await getFocus(userId) : null,
        userId,
      };
      return true;
    } catch (error) {

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException({ code: "UNAUTHENTICATED" });
    }
  }
}
