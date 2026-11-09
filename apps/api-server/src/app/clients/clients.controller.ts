import { Controller, ForbiddenException, Get, Query, Req, UseGuards } from "@nestjs/common";
import { AuthenticateRequestGuard } from "../auth/services/authenticate-request/authenticate-request.service";
import type { AccessScope } from "../auth/services/access-scope/access-scope.service";
import { ListClientsService } from "./services/list-clients/list-clients.service";

@Controller("clients")
@UseGuards(AuthenticateRequestGuard)
export class ClientsController {
  constructor(private readonly listClients: ListClientsService) {}

  @Get()
  async list(
    @Req() request: { access: AccessScope },
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("q") q?: string,
    @Query("sort") sort?: string,
    @Query("dir") dir?: string,
  ) {
    const listed = await this.listClients.execute(request.access, { page, pageSize, q, sort, dir });
    if (listed.code === "FORBIDDEN") {
      throw new ForbiddenException({ code: "FORBIDDEN" });
    }
    return listed;
  }
}
