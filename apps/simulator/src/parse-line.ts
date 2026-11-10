export function normalizeLine(line: string): string {
  const raw = JSON.parse(line) as {
    dev_id?: string;
    deviceId?: string;
    timestamp?: string;
    GMT?: number;
    samplingTime?: number;
    intervalSeconds?: number;
    Temperature?: number[];
    readings?: number[];
    savedData?: boolean;
    saved_data?: boolean;
  };

  if (raw.deviceId && raw.readings) {
    return line;
  }

  const timestamp = raw.timestamp ?? "";
  const utc = new Date(Date.parse(`${timestamp}Z`) - Number(raw.GMT ?? 0) * 3_600_000);
  return JSON.stringify({
    deviceId: raw.dev_id,
    timestamp: utc.toISOString(),
    intervalSeconds: raw.samplingTime,
    readings: raw.Temperature ?? [],
    savedData: Boolean(raw.savedData ?? raw.saved_data),
  });
}
