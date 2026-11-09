import type { StoreListRow } from "../../repositories/store-list.repository";

export interface StorePage {
  page: number;
  pageSize: number;
  total: number;
  items: Array<StoreListRow & { comfortPercent: number | null }>;
  code?: "CLIENT_FOCUS_REQUIRED";
}
