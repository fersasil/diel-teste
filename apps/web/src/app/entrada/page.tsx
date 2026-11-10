import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { marks } from "../../brand/tokens";
import { intakeHref } from "../../intake/intake-href";
import { loadIntake, type DeviceTraffic, type IntakeView } from "../../intake/load-intake";
import { formatDataVolume, formatReadingAt, formatTemperature, type DataUnit } from "../../shared/format";
import { messages } from "../../shared/messages/pt-BR";
import { loadSession, type SessionBody } from "../../session/session";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const clock = "America/Sao_Paulo";
const pageSize = 10;

export default async function IntakePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; unit?: string }>;
}) {
  const token = (await cookies()).get("accessToken")?.value ?? "";
  if (!token) {
    redirect("/entrar?aviso=sessao");
  }
  const session = await loadSession(token);
  if (session === "session") {
    redirect("/entrar?aviso=sessao");
  }
  if (!isSession(session) || session.profile !== "diel_operator") {
    redirect("/");
  }
  const query = await searchParams;
  const unit: DataUnit = query.unit === "gb" ? "gb" : "mb";
  const loaded = await loadIntake(token);
  if (loaded === "session") {
    redirect("/entrar?aviso=sessao");
  }
  if (!isIntake(loaded)) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-4 md:p-6">
        <h1 className="text-2xl font-semibold tracking-tight">{messages.intakeTitle}</h1>
        <p><a className="text-sm text-primary" href="/entrada">{messages.loadFailed}</a></p>
      </main>
    );
  }
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 md:p-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{messages.intakeTitle}</h1>
        <p className="text-sm text-muted-foreground">{messages.intakeHint}</p>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label={messages.packetsStored} value={loaded.packets} />
        <Metric label={messages.acceptedReadings} value={loaded.acceptedReadings} mark={marks.inRange} />
        <Metric label={messages.unknownDevice} value={loaded.unknownReadings} mark={marks.above} />
        <Metric label={messages.outOfRangeReading} value={loaded.outOfRangeReadings} mark={marks.below} />
      </ul>
      <p className="text-sm text-muted-foreground">{messages.intakeNote}</p>
      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold tracking-tight">{messages.unknownDevices}</h2>
        <UnknownDevices view={loaded} />
      </section>
      <DeviceVolumes devices={loaded.devices} unit={unit} requestedPage={pageNumber(query.page)} />
    </main>
  );
}

function DeviceVolumes({
  devices,
  unit,
  requestedPage,
}: {
  devices: DeviceTraffic[];
  unit: DataUnit;
  requestedPage: number;
}) {
  const pages = Math.max(1, Math.ceil(devices.length / pageSize));
  const page = Math.min(requestedPage, pages);
  const visible = devices.slice((page - 1) * pageSize, page * pageSize);
  const rateLabel = unit === "gb" ? messages.gigabytesPerHour : messages.megabytesPerHour;
  const totalLabel = unit === "gb" ? messages.gigabytesSent : messages.megabytesSent;
  const rateDigits = unit === "gb" ? 9 : 6;
  const totalDigits = unit === "gb" ? 6 : 3;
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{messages.deviceVolumeTitle}</h2>
          <p className="text-sm text-muted-foreground">{messages.volumeNote}</p>
        </div>
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">{messages.volumeUnit}</p>
          <nav className="flex gap-2">
            {(["mb", "gb"] as const).map((value) => (
              <Link
                key={value}
                href={intakeHref({ page, unit: value })}
                scroll={false}
                aria-current={unit === value ? "page" : undefined}
                className={unit === value
                  ? "inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm text-primary-foreground"
                  : "inline-flex h-8 items-center rounded-lg bg-background px-3 text-sm ring-1 ring-foreground/10"}
              >
                {value.toUpperCase()}
              </Link>
            ))}
          </nav>
        </div>
      </div>
      {devices.length === 0 ? <p className="text-sm text-muted-foreground">{messages.devicesEmpty}</p> : (
        <>
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>{messages.deviceId}</TableHead>
                <TableHead>{messages.environmentsLabel}</TableHead>
                <TableHead className="text-right">{rateLabel}</TableHead>
                <TableHead className="text-right">{totalLabel}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((device) => (
                <TableRow key={device.deviceId}>
                  <TableCell className="font-medium">{device.deviceId}</TableCell>
                  <TableCell>
                    {device.environmentName ? (
                      <>
                        <span>{device.environmentName}</span>
                        {device.storeName ? <span className="block text-xs text-muted-foreground">{device.storeName}</span> : null}
                      </>
                    ) : (
                      <span className="text-muted-foreground">{messages.unknownDevice}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{formatDataVolume(device.bytesPerHour, unit, rateDigits)}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatDataVolume(device.totalBytes, unit, totalDigits)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <nav className="flex flex-wrap items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, devices.length)} {messages.of} {devices.length}
            </span>
            {page > 1 ? (
              <Link className={cn(buttonVariants({ variant: "outline" }))} href={intakeHref({ page: page - 1, unit })} scroll={false}>
                {messages.previousPage}
              </Link>
            ) : null}
            {page * pageSize < devices.length ? (
              <Link className={cn(buttonVariants({ variant: "outline" }))} href={intakeHref({ page: page + 1, unit })} scroll={false}>
                {messages.nextPage}
              </Link>
            ) : null}
          </nav>
        </>
      )}
    </section>
  );
}

function UnknownDevices({ view }: { view: IntakeView }) {
  if (view.unknownDevices.length === 0) {
    return <p className="text-sm text-muted-foreground">{messages.unknownEmpty}</p>;
  }
  return (
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <TableHead>{messages.deviceId}</TableHead>
          <TableHead>{messages.readingsColumn}</TableHead>
          <TableHead>{messages.lastValue}</TableHead>
          <TableHead>{messages.lastTime}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {view.unknownDevices.map((device) => (
          <TableRow key={device.deviceId}>
            <TableCell className="font-medium">{device.deviceId}</TableCell>
            <TableCell className="tabular-nums">{formatCount(device.readings)}</TableCell>
            <TableCell className="tabular-nums">{formatTemperature(device.lastValue) ?? "—"}</TableCell>
            <TableCell>{formatReadingAt(device.lastAt, clock)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
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
          <p className="text-2xl font-semibold tabular-nums">{formatCount(value)}</p>
        </CardContent>
      </Card>
    </li>
  );
}

function pageNumber(value?: string): number {
  const parsed = Number(value ?? "1");
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function isSession(value: SessionBody | string): value is SessionBody {
  return typeof value === "object" && value !== null && "profile" in value;
}

function isIntake(value: IntakeView | string): value is IntakeView {
  return typeof value === "object" && value !== null;
}
