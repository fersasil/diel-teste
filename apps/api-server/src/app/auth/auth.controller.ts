import { Body, Controller, ForbiddenException, Get, NotFoundException, Post, Req, UnauthorizedException, UseGuards } from "@nestjs/common";
import { AuthenticateRequestGuard } from "./services/authenticate-request/authenticate-request.service";
import type { AccessScope } from "./services/access-scope/access-scope.service";
import { FocusClientService } from "./services/focus-client/focus-client.service";
import { LoginService } from "./services/login/login.service";
import { ReadSessionService } from "./services/read-session/read-session.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly loginService: LoginService,
    private readonly focusService: FocusClientService,
    private readonly sessions: ReadSessionService,
  ) {}

  @Get("session")
  @UseGuards(AuthenticateRequestGuard)
  session(@Req() request: { access: AccessScope }) {
    return this.sessions.execute(request.access);
  }

  @Post("login")
  async login(@Body() body: { email?: string; password?: string }) {
    const result = await this.loginService.execute(body.email ?? "", body.password ?? "");
    if ("code" in result) {
      throw new UnauthorizedException({ code: result.code });
    }
    return result;
  }

  @Post("focus-client")
  @UseGuards(AuthenticateRequestGuard)
  async focus(
    @Req() request: { access: AccessScope & { userId?: string } },
    @Body() body: { clientId?: string },
  ) {
    if (request.access.profile !== "diel_operator") {
      throw new ForbiddenException({ code: "FORBIDDEN" });
    }
    const focused = await this.focusService.execute(request.access.userId ?? "operator", body.clientId ?? "");
    if ("code" in focused) {
      throw new NotFoundException({ code: focused.code });
    }
    return focused;
  }
}
