export function nextVirtualNow(current: Date | null, sampleTime: Date): Date {
  if (current === null || sampleTime.getTime() > current.getTime()) {
    return sampleTime;
  }
  return current;
}
