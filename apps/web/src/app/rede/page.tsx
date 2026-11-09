import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { serverApiBase } from "../../shared/api-base";
import { NetworkFilters } from "../../components/network-filters";
import { EnvironmentTable } from "../../components/environment-table";
import { PeriodNav } from "../../components/period-nav";
import { StorePager } from "../../components/store-pager";
import { loadEnvironments } from "../../network/load-environments";
import { loadFilterOptions } from "../../network/load-filter-options";
import { messages } from "../../shared/messages/pt-BR";
import { networkHref, parseNetworkPeriod, parseNetworkSort, type NetworkQuery } from "../../network/network-query";
import { loadSession, type SessionBody } from "../../session/session";

export default async function NetworkPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    storeId?: string;
    environmentName?: string;
    comfortStatus?: string;
    deviceStatus?: string;
    sort?: string;
    dir?: string;
    period?: string;
  }>;
}) {
  const token = (await cookies()).get("accessToken")?.value ?? "";
  if (!token) {
    redirect("/entrar?aviso=sessao");
  }
  const session = await loadSession(token);
  if (session === "session") {
    redirect("/entrar?aviso=sessao");
  }
  if (isSession(session) && session.profile === "diel_operator" && !session.clientId) {
    redirect("/entrar/foco");
  }
  const params = await searchParams;
  const requested = Number(params.page ?? "1");
  const query: NetworkQuery = {
    page: Number.isInteger(requested) && requested > 0 ? requested : 1,
    storeId: params.storeId ?? "",
    environmentName: params.environmentName ?? "",
    comfortStatus: params.comfortStatus ?? "",
    deviceStatus: params.deviceStatus ?? "",
    period: parseNetworkPeriod(params.period),
    ...parseNetworkSort(params.sort, params.dir),
  };
  const operator = isSession(session) && session.profile === "diel_operator";
  const [loaded, options, clients] = await Promise.all([
    loadEnvironments(token, query, 10),
    loadFilterOptions(token, query),
    operator ? loadClients(token) : Promise.resolve([]),
  ]);
  if (loaded === "session" || options === "session") {
    redirect("/entrar?aviso=sessao");
  }
  if (loaded === "focus" || options === "focus") {
    redirect("/entrar/foco");
  }
  if (loaded === "failure" || options === "failure") {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{messages.networkTitle}</h1>
        <p><a className="text-sm text-primary" href={networkHref(query)}>{messages.loadFailed}</a></p>
      </main>
    );
  }
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{messages.networkTitle}</h1>
          <p className="text-sm text-muted-foreground">{query.sort ? messages.sortedHint : messages.networkHint}</p>
        </div>
        <PeriodNav current={query.period ?? "1d"} hrefFor={(period) => networkHref({ ...query, page: 1, period })} />
        <NetworkFilters
          stores={options.stores}
          environmentNames={options.environmentNames}
          clients={clients}
          clientId={isSession(session) ? session.clientId ?? "" : ""}
          query={query}
        />
      </div>
      {loaded.items.length === 0 ? <p>{messages.empty}</p> : <EnvironmentTable items={loaded.items} query={query} token={token} />}
      <StorePager page={loaded.page} pageSize={loaded.pageSize} total={loaded.total} query={query} />
    </main>
  );
}

async function loadClients(token: string): Promise<Array<{ id: string; name: string }>> {
  try {
    const response = await fetch(`${serverApiBase()}/api/v1/clients?pageSize=100`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) {
      return [];
    }
    const body = (await response.json()) as { items?: Array<{ id: string; name: string }> };
    return body.items ?? [];
  } catch {
    return [];
  }
}

function isSession(value: SessionBody | string): value is SessionBody {
  return typeof value === "object" && value !== null && "profile" in value;
}
