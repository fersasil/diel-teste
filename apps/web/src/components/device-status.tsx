import { marks } from "../brand/tokens";
import { messages } from "../shared/messages/pt-BR";

const labels = {
  ONLINE: messages.online,
  OFFLINE: messages.offline,
  NO_DATA: messages.noData,
} as const;

const tones = {
  ONLINE: marks.inRange,
  OFFLINE: marks.noData,
  NO_DATA: marks.noData,
} as const;

export function DeviceStatus({ status }: { status: keyof typeof labels }) {
  return (
    <span className={`status status-${status} inline-flex items-center gap-1.5 text-sm text-foreground`}>
      <span className="size-2 rounded-full" style={{ backgroundColor: tones[status] }} aria-hidden="true" />
      {labels[status]}
    </span>
  );
}
