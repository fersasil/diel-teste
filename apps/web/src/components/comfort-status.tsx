import { messages } from "../shared/messages/pt-BR";
import { cn } from "@/lib/utils";

const labels = {
  IN_RANGE: messages.inRange,
  ABOVE: messages.above,
  BELOW: messages.below,
  NO_DATA: messages.noData,
} as const;

const tones = {
  IN_RANGE: "text-emerald-700",
  ABOVE: "text-red-600",
  BELOW: "text-sky-700",
  NO_DATA: "text-muted-foreground",
} as const;

export function ComfortStatus({
  status,
}: {
  status: keyof typeof labels | null | undefined;
}) {
  const value = status ?? "NO_DATA";
  return (
    <span className={cn("text-sm", tones[value])}>{labels[value]}</span>
  );
}
