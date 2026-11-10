import type { DataUnit } from "../shared/format";

export function intakeHref(input: { page?: number; unit?: DataUnit }): string {
  const params = new URLSearchParams();
  if (input.unit === "gb") {
    params.set("unit", "gb");
  }
  if (input.page && input.page > 1) {
    params.set("page", String(input.page));
  }
  const query = params.toString();
  return query ? `/entrada?${query}` : "/entrada";
}
