export interface WeatherStore {
  id: string;
  city: string;
  latitude: number;
  longitude: number;
  coveredFrom: Date | null;
  coveredTo: Date | null;
}
