import { Injectable } from "@nestjs/common";
import { EnvironmentListRepository } from "../../repositories/environment-list.repository";
import { scopeClientId, type AccessScope } from "../../../auth/services/access-scope/access-scope.service";
import { comfortPercent } from "../../../../shared/comfort/comfort-percent";
import { deviceStatus, type DeviceStatus } from "../device-status/device-status.service";
import type { ComfortStatus } from "../../../../shared/models/cadastro";
import { parsePeriod, periodRange } from "../../../../shared/time/parse-period";
import type { ComfortFilter, DeviceFilter, EnvironmentPage, EnvironmentSort } from "./list-environments.interface";

export type { ComfortFilter, DeviceFilter, EnvironmentListItem, EnvironmentPage, EnvironmentSort } from "./list-environments.interface";

const COMFORT_FILTERS: ComfortFilter[] = ["IN_RANGE", "ABOVE", "BELOW", "NO_DATA"];
const DEVICE_FILTERS: DeviceFilter[] = ["ONLINE", "OFFLINE", "NO_DATA"];
const SORT_COLUMNS: EnvironmentSort[] = ["store", "environment", "comfort", "device"];

export function parseComfortFilter(value?: string): ComfortFilter | undefined {
  return COMFORT_FILTERS.find((item) => item === value);
}

export function parseDeviceFilter(value?: string): DeviceFilter | undefined {
  return DEVICE_FILTERS.find((item) => item === value);
}

export function parseEnvironmentSort(query: { sort?: string; dir?: string }): {
  sort?: EnvironmentSort;
  dir: "asc" | "desc";
} {
  const sort = SORT_COLUMNS.find((item) => item === query.sort);
  return { sort, dir: query.dir === "desc" ? "desc" : "asc" };
}

export function parseEnvironmentPage(query: { page?: string; pageSize?: string }): {
  page: number;
  pageSize: number;
} {
  const pageNumber = Number(query.page ?? "1");
  const sizeNumber = Number(query.pageSize ?? "10");
  const page = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const pageSize = Number.isInteger(sizeNumber) && sizeNumber > 0
    ? Math.min(sizeNumber, 100)
    : 10;
  return { page, pageSize };
}

export function presentEnvironment(
  row: { lastComfortStatus: ComfortStatus | null; lastSeenAt: Date | null },
  virtualNow: Date,
): { comfortStatus: ComfortStatus | "NO_DATA"; deviceStatus: DeviceStatus } {
  return {
    comfortStatus: row.lastSeenAt === null ? "NO_DATA" : row.lastComfortStatus ?? "NO_DATA",
    deviceStatus: deviceStatus(row.lastSeenAt, virtualNow),
  };
}

@Injectable()
export class ListEnvironmentsService {
  private readonly environments = new EnvironmentListRepository();

  async execute(
    scope: AccessScope,
    query: {
      page?: string;
      pageSize?: string;
      storeId?: string;
      environmentName?: string;
      comfortStatus?: string;
      deviceStatus?: string;
      sort?: string;
      dir?: string;
      period?: string;
    },
    virtualNow = new Date(),
  ): Promise<EnvironmentPage> {
    const { page, pageSize } = parseEnvironmentPage(query);
    const { sort, dir } = parseEnvironmentSort(query);
    const range = periodRange(parsePeriod(query.period), virtualNow);
    const clientId = scopeClientId(scope);
    if (!clientId) {
      return { page, pageSize, total: 0, items: [], code: "CLIENT_FOCUS_REQUIRED" };
    }
    const listed = await this.environments.list({
      clientId,
      storeId: query.storeId || undefined,
      environmentName: query.environmentName || undefined,
      comfortStatus: parseComfortFilter(query.comfortStatus),
      deviceStatus: parseDeviceFilter(query.deviceStatus),
      allowedStoreIds: scope.profile === "store_manager" ? scope.allowedStoreIds : null,
      sort,
      dir,
      virtualNow,
      from: range.from,
      to: range.to,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return {
      page,
      pageSize,
      total: listed.total,
      items: listed.items.map((row) => ({
        id: row.id,
        name: row.name,
        storeId: row.storeId,
        storeName: row.storeName,
        ...presentEnvironment(row, virtualNow),
        comfortPercent: comfortPercent(row.inRangeSeconds, row.operatingSeconds),
        outOfRangeEnvCount: row.outOfRangeEnvCount,
        lastSeenAt: row.lastSeenAt?.toISOString() ?? null,
      })),
    };
  }
}
