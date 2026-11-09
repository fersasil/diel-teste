import { Injectable } from "@nestjs/common";
import { scopeClientId, type AccessScope } from "../../../auth/services/access-scope/access-scope.service";
import { RawBatchRepository } from "../../repositories/raw-batch.repository";
import type { RawBatchList } from "./list-raw-batches.interface";
import { decideRawBatchAccess } from "./list-raw-batches.rules";

@Injectable()
export class ListRawBatchesService {
  private readonly batches = new RawBatchRepository();

  async execute(scope: AccessScope, date: string): Promise<RawBatchList> {
    const decision = decideRawBatchAccess(scope);
    if (decision !== "OK") {
      return { code: decision, items: [] };
    }
    const clientId = scopeClientId(scope);
    if (!clientId) {
      return { code: "CLIENT_FOCUS_REQUIRED", items: [] };
    }
    return { items: await this.batches.listByDay(clientId, date) };
  }
}
