"use client";

import { useState } from "react";
import { Popover } from "@base-ui/react/popover";
import { Calendar } from "lucide-react";
import { DayPicker, type DateRange } from "react-day-picker";
import { ptBR } from "react-day-picker/locale";
import "react-day-picker/style.css";
import { messages } from "../shared/messages/pt-BR";

export function ChartDate({
  from,
  to,
  max,
  onChange,
}: {
  from: string;
  to: string;
  max: string;
  onChange: (from: string, to: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>();
  const [month, setMonth] = useState(() => parseDay(from) ?? parseDay(to) ?? new Date());
  const latest = parseDay(max);

  function pick(range: DateRange | undefined) {
    setDraft(range);
    if (!range?.from || !range.to) {
      return;
    }
    onChange(formatDay(range.from), formatDay(range.to));
    setDraft(undefined);
    setOpen(false);
  }

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">{messages.chartDate}</p>
      <Popover.Root
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) {
            return;
          }
          setDraft(undefined);
          const focus = parseDay(from) ?? parseDay(to);
          if (focus) {
            setMonth(focus);
          }
        }}
      >
        <Popover.Trigger className="inline-flex h-8 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-foreground">
          <Calendar className="size-4 text-muted-foreground" />
          {rangeLabel(from, to)}
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner sideOffset={6} align="start" className="z-50">
            <Popover.Popup className="rounded-xl bg-popover p-3 text-popover-foreground shadow-lg ring-1 ring-foreground/10">
              <DayPicker
                mode="range"
                resetOnSelect
                locale={ptBR}
                selected={draft ?? toRange(from, to)}
                onSelect={pick}
                month={month}
                onMonthChange={setMonth}
                disabled={latest ? { after: latest } : undefined}
                numberOfMonths={2}
                className="range-calendar"
              />
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </div>
  );
}

function rangeLabel(from: string, to: string): string {
  if (!from || !to) {
    return messages.chartDate;
  }
  return from === to ? formatBr(from) : `${formatBr(from)} – ${formatBr(to)}`;
}

function formatBr(day: string): string {
  const [year, month, date] = day.split("-");
  return `${date}/${month}/${year}`;
}

function parseDay(value: string): Date | undefined {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return undefined;
  }
  const [year, month, date] = value.split("-").map(Number);
  return new Date(year, month - 1, date);
}

function formatDay(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

function toRange(from: string, to: string): DateRange | undefined {
  const start = parseDay(from);
  if (!start) {
    return undefined;
  }
  return { from: start, to: parseDay(to) ?? start };
}
