import { marks } from "../brand/tokens";
import { LiveRefresh } from "./live-refresh";
import { DeviceStatus } from "./device-status";
import { environmentCountOf, type DashboardSummary } from "../dashboard/dashboard-summary";
import { messages } from "../shared/messages/pt-BR";
import { networkHref } from "../network/network-query";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function HomeDashboard({
  token,
  clientName,
  summary,
}: {
  token: string;
  clientName: string | null;
  summary: DashboardSummary;
}) {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
      <LiveRefresh token={token} />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{messages.dashboardTitle}</h1>
          <p className="text-sm text-muted-foreground">
            {clientName ? `${clientName} · ${messages.dashboardHint}` : messages.dashboardHint}
          </p>
        </div>
        <a className="text-sm text-primary" href="/rede">{messages.seeNetwork}</a>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label={messages.storesLabel} value={summary.storeCount} />
        <Metric label={messages.environmentsLabel} value={summary.environmentCount} />
        <Metric label={messages.inRange} value={summary.inRange} mark={marks.inRange} />
        <Metric label={messages.above} value={summary.above} mark={marks.above} />
        <Metric label={messages.below} value={summary.below} mark={marks.below} />
        <Metric label={messages.noData} value={summary.noData} mark={marks.noData} />
        <Metric label={messages.online} value={summary.online} mark={marks.inRange} />
        <Metric label={messages.offline} value={summary.offline} mark={marks.noData} />
      </ul>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <h2 className="text-lg font-semibold tracking-tight">{messages.attention}</h2>
          {summary.alertCount > 0 ? (
            <Badge variant="destructive">{summary.alertCount}</Badge>
          ) : null}
        </CardHeader>
        <CardContent>
          {summary.alertStores.length === 0 ? <p className="text-sm text-muted-foreground">{messages.noAlerts}</p> : null}
          <ul className="flex flex-col gap-3">
            {summary.alertStores.map((store) => (
              <li key={store.id} className="rounded-lg bg-muted/80 px-3 py-2">
                <p className="font-medium">{store.name}</p>
                <p className="mt-1 flex flex-wrap gap-3 text-sm text-muted-foreground">
                  <span>{messages.above} {store.aboveCount}</span>
                  <span>{messages.below} {store.belowCount}</span>
                  <span><DeviceStatus status="ONLINE" /> {store.onlineCount}</span>
                </p>
                <a className="mt-2 inline-block text-sm text-primary" href={networkHref({ storeId: store.id })}>
                  {environmentCountOf(store)} {messages.environmentsLabel.toLowerCase()}
                </a>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </main>
  );
}

function Metric({ label, value, mark }: { label: string; value: number; mark?: string }) {
  return (
    <li>
      <Card>
        <CardContent className="pt-0">
          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            {mark ? <span className="size-2 rounded-full" style={{ backgroundColor: mark }} aria-hidden="true" /> : null}
            {label}
          </p>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
        </CardContent>
      </Card>
    </li>
  );
}
