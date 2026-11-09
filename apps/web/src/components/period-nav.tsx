import { messages } from "../shared/messages/pt-BR";
import type { NetworkPeriod } from "../network/network-query";

const periods: Array<[NetworkPeriod, string]> = [
  ["1d", messages.periodDay],
  ["7d", messages.periodWeek],
  ["30d", messages.periodMonth],
];

export function PeriodNav({
  current,
  hrefFor,
}: {
  current: NetworkPeriod | null;
  hrefFor: (period: NetworkPeriod) => string;
}) {
  return (
    <nav className="periods flex flex-wrap gap-2">
      {periods.map(([value, label]) => (
        <a
          key={value}
          href={hrefFor(value)}
          aria-current={current === value ? "page" : undefined}
          className={current === value
            ? "inline-flex h-8 items-center rounded-lg bg-primary px-3 text-sm text-primary-foreground"
            : "inline-flex h-8 items-center rounded-lg bg-background px-3 text-sm ring-1 ring-foreground/10"}
        >
          {label}
        </a>
      ))}
    </nav>
  );
}
