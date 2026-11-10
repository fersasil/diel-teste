"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { browserApiBase } from "../shared/api-base";
import { FilterSearch } from "./filter-search";
import { messages } from "../shared/messages/pt-BR";
import { networkHref, type NetworkQuery } from "../network/network-query";
import { Select, SelectContent, SelectItem, SelectTrigger } from "@/components/ui/select";

export function NetworkFilters({
  stores,
  environmentNames,
  clients,
  clientId,
  query,
}: {
  stores: Array<{ id: string; name: string }>;
  environmentNames: string[];
  clients: Array<{ id: string; name: string }>;
  clientId: string;
  query: NetworkQuery;
}) {
  const router = useRouter();
  const storeId = query.storeId ?? "";
  const storeLabel = stores.find((store) => store.id === storeId)?.name ?? messages.allStores;
  const environmentLabel = query.environmentName || messages.allEnvironments;
  const comfortLabel = {
    IN_RANGE: messages.inRange,
    ABOVE: messages.above,
    BELOW: messages.below,
    NO_DATA: messages.noData,
  }[query.comfortStatus ?? ""] ?? messages.allComfort;
  const deviceLabel = {
    ONLINE: messages.online,
    OFFLINE: messages.offline,
    NO_DATA: messages.noData,
  }[query.deviceStatus ?? ""] ?? messages.allDevices;

  function apply(next: Partial<NetworkQuery>) {
    router.push(networkHref({ ...query, page: 1, ...next }), { scroll: false });
  }

  const searchStores = useCallback(async (typed: string) => {
    const loaded = await fetchOptions({ storeQ: typed, storeId: query.storeId, selectedName: query.environmentName });
    return loaded.stores.map((store) => ({ value: store.id, label: store.name }));
  }, [query.storeId, query.environmentName]);

  const searchEnvironments = useCallback(async (typed: string) => {
    const loaded = await fetchOptions({ q: typed, storeId: query.storeId, selectedName: query.environmentName });
    return loaded.environmentNames.map((name) => ({ value: name, label: name }));
  }, [query.storeId, query.environmentName]);

  return (
    <div className="flex flex-wrap items-end gap-3">
      <p className="sr-only">{storeLabel} {environmentLabel} {comfortLabel} {deviceLabel}</p>
      {clients.length > 0 ? (
        <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
          {messages.clientLabel}
          <select
            className="h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground"
            value={clientId}
            onChange={(event) => void focusClient(event.currentTarget.value)}
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </label>
      ) : null}
      <FilterSearch
        label={messages.storesLabel}
        selectedLabel={storeLabel}
        allLabel={messages.allStores}
        options={stores.map((store) => ({ value: store.id, label: store.name }))}
        onSearch={searchStores}
        onSelect={(value) => apply({ storeId: value, environmentName: query.environmentName })}
      />
      <FilterSearch
        label={messages.environmentsLabel}
        selectedLabel={environmentLabel}
        allLabel={messages.allEnvironments}
        options={environmentNames.map((name) => ({ value: name, label: name }))}
        onSearch={searchEnvironments}
        onSelect={(value) => apply({ environmentName: value })}
      />
      <div className="flex flex-col gap-1">
        <span className="text-xs font-medium text-muted-foreground">{messages.comfortBand}</span>
        <Select value={query.comfortStatus || "all"} onValueChange={(value) => apply({ comfortStatus: value === "all" || !value ? "" : value })}>
          <SelectTrigger className="w-56 bg-background">
            <span className="flex flex-1 truncate text-left">{comfortLabel}</span>
          </SelectTrigger>
          <SelectContent align="start" alignItemWithTrigger={false}>
            <SelectItem value="all">{messages.allComfort}</SelectItem>
            <SelectItem value="IN_RANGE">{messages.inRange}</SelectItem>
            <SelectItem value="ABOVE">{messages.above}</SelectItem>
            <SelectItem value="BELOW">{messages.below}</SelectItem>
            <SelectItem value="NO_DATA">{messages.noData}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
        {messages.deviceColumn}
        <select
          className="h-8 rounded-lg border border-input bg-background px-2 text-sm text-foreground"
          value={query.deviceStatus || ""}
          onChange={(event) => apply({ deviceStatus: event.currentTarget.value })}
        >
          <option value="">{messages.allDevices}</option>
          <option value="ONLINE">{messages.online}</option>
          <option value="OFFLINE">{messages.offline}</option>
          <option value="NO_DATA">{messages.noData}</option>
        </select>
      </label>
    </div>
  );
}

async function focusClient(clientId: string): Promise<void> {
  const token = document.cookie.split("; ").find((item) => item.startsWith("accessToken="))?.slice("accessToken=".length) ?? "";
  const response = await fetch(`${browserApiBase()}/api/v1/auth/focus-client`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify({ clientId }),
  });
  if (response.ok) {
    window.location.href = "/rede";
  }
}

async function fetchOptions(input: { q?: string; storeQ?: string; storeId?: string; selectedName?: string }): Promise<{
  stores: Array<{ id: string; name: string }>;
  environmentNames: string[];
}> {
  const token = document.cookie.split("; ").find((item) => item.startsWith("accessToken="))?.slice("accessToken=".length) ?? "";
  const params = new URLSearchParams({ limit: "20" });
  if (input.storeId) {
    params.set("storeId", input.storeId);
  }
  if (input.q) {
    params.set("q", input.q);
  }
  if (input.storeQ) {
    params.set("storeQ", input.storeQ);
  }
  if (input.selectedName) {
    params.set("selectedName", input.selectedName);
  }
  const response = await fetch(`${browserApiBase()}/api/v1/environments/options?${params}`, {
    headers: { authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    return { stores: [], environmentNames: [] };
  }
  return response.json() as Promise<{
    stores: Array<{ id: string; name: string }>;
    environmentNames: string[];
  }>;
}
