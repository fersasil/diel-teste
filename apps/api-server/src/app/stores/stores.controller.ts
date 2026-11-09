import { Controller, Get, Query, Req, UseGuards } from "@nestjs/common";
import { AuthenticateRequestGuard } from "../auth/services/authenticate-request/authenticate-request.service";
import type { AccessScope } from "../auth/services/access-scope/access-scope.service";
import { GetDashboardSummaryService } from "./services/get-dashboard-summary/get-dashboard-summary.service";
import { ListStoresService } from "./services/list-stores/list-stores.service";
import { readVirtualNow } from "../../infra/redis/read-virtual-clock";

@Controller("stores")
@UseGuards(AuthenticateRequestGuard)
export class StoresController {
  constructor(
    private readonly listStores: ListStoresService,
    private readonly dashboard: GetDashboardSummaryService,
  ) {}

  @Get("summary")
  async summary(@Req() request: { access: AccessScope }, @Query("alertLimit") alertLimit?: string) {
    return this.dashboard.execute(request.access, { alertLimit }, await readVirtualNow());
  }

  @Get()
  async list(
    @Req() request: { access: AccessScope },
    @Query("page") page?: string,
    @Query("pageSize") pageSize?: string,
    @Query("q") q?: string,
    @Query("storeId") storeId?: string,
    @Query("environmentName") environmentName?: string,
    @Query("comfortStatus") comfortStatus?: string,
    @Query("sort") sort?: string,
    @Query("dir") dir?: string,
    @Query("period") period?: string,
  ) {
    return this.listStores.execute(
      request.access,
      { page, pageSize, q, storeId, environmentName, comfortStatus, sort, dir, period },
      await readVirtualNow(),
    );
  }
}
