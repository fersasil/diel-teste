import { messages } from "../shared/messages/pt-BR";
import { cn } from "@/lib/utils";

const labels = {
  ONLINE: messages.online,
  OFFLINE: messages.offline,
  NO_DATA: messages.noData,
} as const;

const tones = {
  ONLINE: "bg-emerald-500",
  OFFLINE: "bg-slate-300",
  NO_DATA: "bg-slate-300",
} as const;

export function DeviceStatus({ status }: { status: keyof typeof labels }) {
  return (
    <span className={`status status-${status} inline-flex items-center gap-1.5 text-sm`}>
      <span className={cn("size-2 rounded-full", tones[status])} aria-hidden="true" />
      {labels[status]}
    </span>
  );
}
