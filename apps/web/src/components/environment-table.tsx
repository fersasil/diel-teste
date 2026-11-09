"use client";

import { useLivePatches, type LivePatch } from "./live-refresh";
import { ComfortStatus } from "./comfort-status";
import { DeviceStatus } from "./device-status";
import { formatPercent } from "../shared/format";
import { messages } from "../shared/messages/pt-BR";
import { networkHref, nextNetworkSort, type NetworkQuery, type NetworkSort } from "../network/network-query";
import type { EnvironmentListItem } from "../network/load-environments";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export function EnvironmentTable({
  items,
  query,
  token,
}: {
  items: EnvironmentListItem[];
  query: NetworkQuery;
  token: string;
}) {
  const patches = useLivePatches(token);
  const period = query.period && query.period !== "1d" ? `period=${query.period}` : "";
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <SortHead column="store" label={messages.storesLabel} query={query} />
          <SortHead column="environment" label={messages.environmentsLabel} query={query} />
          <SortHead column="comfort" label={messages.comfortColumn} query={query} />
          <SortHead column="device" label={messages.deviceColumn} query={query} />
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => {
          const patch = newerPatch(patches.get(item.id), item.lastSeenAt);
          const comfort = patch?.lastComfortStatus ?? item.comfortStatus;
          const device = patch?.deviceStatus ?? item.deviceStatus;
          return (
          <TableRow
            key={item.id}
            className={comfort === "ABOVE" || comfort === "BELOW" ? "bg-destructive/[0.04]" : undefined}
          >
            <TableCell className="store-card py-2.5">
              <h2 className="text-sm font-medium">{item.storeName}</h2>
              <p className="text-xs text-muted-foreground">{item.outOfRangeEnvCount} {messages.outOfRangeEnvs}</p>
            </TableCell>
            <TableCell className="py-2.5">
              <a
                className="font-medium hover:text-primary hover:underline"
                href={period ? `/ambientes/${item.id}?${period}` : `/ambientes/${item.id}`}
              >
                {item.name}
              </a>
            </TableCell>
            <TableCell className="py-2.5">
              <ComfortStatus status={comfort} />
              <p className="text-xs text-muted-foreground">{messages.comfortPeriod} {formatPercent(item.comfortPercent)}</p>
            </TableCell>
            <TableCell className="py-2.5">
              <DeviceStatus status={device} />
            </TableCell>
          </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function newerPatch(patch: LivePatch | undefined, seenAt: string | null): LivePatch | undefined {
  if (!patch) {
    return undefined;
  }
  if (seenAt && patch.latestAt < seenAt) {
    return undefined;
  }
  return patch;
}

function SortHead({ column, label, query }: { column: NetworkSort; label: string; query: NetworkQuery }) {
  const active = query.sort === column;
  const dir = active && query.dir === "desc" ? "desc" : "asc";
  return (
    <TableHead aria-sort={active ? (dir === "desc" ? "descending" : "ascending") : "none"}>
      <a className="inline-flex items-center gap-1 hover:text-foreground" href={networkHref({ ...query, page: 1, ...nextNetworkSort(column, query) })}>
        {label}
        <span aria-hidden="true">{active ? (dir === "asc" ? "↑" : "↓") : "↕"}</span>
      </a>
    </TableHead>
  );
}
