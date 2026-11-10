import { marks } from "../brand/tokens";
import { messages } from "../shared/messages/pt-BR";

const labels = {
  IN_RANGE: messages.inRange,
  ABOVE: messages.above,
  BELOW: messages.below,
  NO_DATA: messages.noData,
} as const;

const tones = {
  IN_RANGE: marks.inRange,
  ABOVE: marks.above,
  BELOW: marks.below,
  NO_DATA: marks.noData,
} as const;

export function ComfortStatus({
  status,
}: {
  status: keyof typeof labels | null | undefined;
}) {
  const value = status ?? "NO_DATA";
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
      <span className="size-2 rounded-full" style={{ backgroundColor: tones[value] }} aria-hidden="true" />
      {labels[value]}
    </span>
  );
}
