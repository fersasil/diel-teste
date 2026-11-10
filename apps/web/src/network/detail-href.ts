export function detailHref(
  id: string,
  period: string,
  bucket: string,
  extra?: { date?: string; from?: string; to?: string; operating?: boolean },
): string {
  const params = new URLSearchParams({ bucket });
  if (extra?.operating) {
    params.set("hours", "expediente");
  }
  if (extra?.from && extra.to) {
    params.set("from", extra.from);
    params.set("to", extra.to);
    return `/ambientes/${id}?${params}`;
  }
  if (period !== "1d") {
    params.set("period", period);
  }
  if (extra?.date) {
    params.set("date", extra.date);
  }
  return `/ambientes/${id}?${params}`;
}
