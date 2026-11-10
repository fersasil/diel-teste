import { Controller, ForbiddenException, Get, Req, UseGuards } from "@nestjs/common";
import { AuthenticateRequestGuard } from "../auth/services/authenticate-request/authenticate-request.service";
import type { AccessScope } from "../auth/services/access-scope/access-scope.service";
import { GetIntakeService } from "./services/get-intake/get-intake.service";

@Controller("intake")
@UseGuards(AuthenticateRequestGuard)
export class IntakeController {
  constructor(private readonly intake: GetIntakeService) {}

  @Get()
  async show(@Req() request: { access: AccessScope }) {
    const view = await this.intake.execute(request.access);

    if (view.code === "FORBIDDEN") {
      throw new ForbiddenException({ code: "FORBIDDEN" });
    }

    return view;
  }
}
