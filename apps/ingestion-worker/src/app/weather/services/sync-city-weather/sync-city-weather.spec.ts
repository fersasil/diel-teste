import { syncCityWeather, type WeatherStore } from "./sync-city-weather.service";

const span = { from: new Date("2026-02-10T00:00:00.000Z"), to: new Date("2026-02-10T03:00:00.000Z") };

function store(id: string, latitude: number): WeatherStore {
  return { id, city: id, latitude, longitude: -43.2, coveredFrom: null, coveredTo: null };
}

describe("sync city weather", () => {
  it("fetches each coordinate once and skips a city already covered", async () => {
    const fetched: string[] = [];
    const saved: string[] = [];
    const covered = store("LOJA-RJ-001", -22.92);
    covered.coveredFrom = span.from;
    covered.coveredTo = span.to;
    const result = await syncCityWeather({
      stores: async () => [covered, store("LOJA-SP-001", -23.56), store("LOJA-SP-002", -23.56)],
      span: async () => span,
      fetchCity: async (place) => {
        fetched.push(place.id);
        return [{ readingTime: span.from, temperature: 24 }];
      },

      save: async (id) => {
        saved.push(id);
        return 1;
      },
    });
    expect(fetched).toEqual(["LOJA-SP-001"]);
    expect(saved).toEqual(["LOJA-SP-001", "LOJA-SP-002"]);
    expect(result).toEqual({ stores: 3, hours: 2, failed: 0 });
  });

  it("keeps the other cities when one forecast fails", async () => {
    const saved: string[] = [];
    const result = await syncCityWeather({
      stores: async () => [store("LOJA-RJ-001", -22.92), store("LOJA-PE-001", -8.12)],
      span: async () => span,
      fetchCity: async (place) => {
        if (place.id === "LOJA-RJ-001") {
          throw new Error("down");
        }

        return [{ readingTime: span.from, temperature: 29 }];
      },

      save: async (id) => {
        saved.push(id);
        return 2;
      },
    });
    expect(saved).toEqual(["LOJA-PE-001"]);
    expect(result.failed).toBe(1);
    expect(result.hours).toBe(2);
  });
});
