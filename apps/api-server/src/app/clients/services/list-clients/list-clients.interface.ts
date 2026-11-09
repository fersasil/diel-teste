import type { ClientListRow } from "../../repositories/client.repository";

export interface ClientPage {
  page: number;
  pageSize: number;
  total: number;
  items: ClientListRow[];
  code?: "FORBIDDEN";
}
