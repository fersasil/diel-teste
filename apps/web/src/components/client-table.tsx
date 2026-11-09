import { ChooseClientButton } from "./choose-client-button";
import { messages } from "../shared/messages/pt-BR";
import { clientHref, nextClientSort, type ClientQuery, type ClientSort } from "../clients/client-query";
import type { ClientListItem } from "../clients/load-clients";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function ClientTable({ items, query }: { items: ClientListItem[]; query: ClientQuery }) {
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <SortHead column="name" label={messages.clientLabel} query={query} />
          <SortHead column="segment" label={messages.segmentLabel} query={query} />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="py-2.5">
              <ChooseClientButton clientId={item.id} name={item.name} />
            </TableCell>
            <TableCell className="py-2.5 text-muted-foreground">{item.segment}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SortHead({ column, label, query }: { column: ClientSort; label: string; query: ClientQuery }) {
  const active = query.sort === column;
  const dir = active && query.dir === "desc" ? "desc" : "asc";
  return (
    <TableHead aria-sort={active ? (dir === "desc" ? "descending" : "ascending") : "none"}>
      <a className="inline-flex items-center gap-1 hover:text-foreground" href={clientHref({ ...query, page: 1, ...nextClientSort(column, query) })}>
        {label}
        <span aria-hidden="true">{active ? (dir === "asc" ? "↑" : "↓") : "↕"}</span>
      </a>
    </TableHead>
  );
}
