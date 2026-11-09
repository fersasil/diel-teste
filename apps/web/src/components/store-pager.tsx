import { networkHref, type NetworkQuery } from "../network/network-query";
import { TablePager } from "./table-pager";

export function StorePager({
  page,
  pageSize,
  total,
  query,
}: {
  page: number;
  pageSize: number;
  total: number;
  query: NetworkQuery;
}) {
  return (
    <TablePager
      page={page}
      pageSize={pageSize}
      total={total}
      hrefForPage={(next) => networkHref({ ...query, page: next })}
    />
  );
}
