import { Controller, ForbiddenException, Get, Query, Req, UseGuards } from "@nestjs/common";
import { AuthenticateRequestGuard } from "../auth/services/authenticate-request/authenticate-request.service";
import type { AccessScope } from "../auth/services/access-scope/access-scope.service";
import { ListRawBatchesService } from "./services/list-raw-batches/list-raw-batches.service";

@Controller("storage/raw-batches")
@UseGuards(AuthenticateRequestGuard)
export class RawBatchesController {
  constructor(private readonly batches: ListRawBatchesService) {}

  @Get()
  async list(@Req() request: { access: AccessScope }, @Query("date") date?: string) {
    const day = date ?? new Date().toISOString().slice(0, 10);
    const result = await this.batches.execute(request.access, day);
    if ("code" in result && result.code === "FORBIDDEN") {
      throw new ForbiddenException({ code: "FORBIDDEN" });
    }
    return result;
  }
}
