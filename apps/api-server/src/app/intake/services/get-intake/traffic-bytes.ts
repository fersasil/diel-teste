const PUBLISHED_FILE_BYTES = 28_414_325;
const PUBLISHED_READINGS = 180_951 * 12;

export const BYTES_PER_READING = PUBLISHED_FILE_BYTES / PUBLISHED_READINGS;

export function trafficBytes(readings: number, recentReadings: number): {
  totalBytes: number;
  bytesPerHour: number;
} {
  return {
    totalBytes: Math.round(readings * BYTES_PER_READING),
    bytesPerHour: Math.round(recentReadings * BYTES_PER_READING),
  };
}
