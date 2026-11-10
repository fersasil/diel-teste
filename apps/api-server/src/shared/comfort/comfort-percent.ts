export function comfortPercent(inRangeSeconds: number, operatingSeconds: number): number | null {
  if (operatingSeconds <= 0) {
    return null;
  }

  return Math.min(Math.max(inRangeSeconds, 0), operatingSeconds) / operatingSeconds;
}
