import { validateRange } from "../../app/environment/services/timeseries-bucket/timeseries-bucket.service";
import { daySpan, endOfLocalDay, localDay, parseDay, rangeEnd } from "./local-day";

describe("local day", () => {
  it("ends the default window at the virtual clock", () => {
    const latest = new Date("2026-02-10T18:00:00.000Z");
    const end = rangeEnd({
      day: null,
      timeZone: "America/Sao_Paulo",
      virtualNow: new Date("2026-04-04T12:00:00.000Z"),
    });
    expect(end.toISOString()).toBe("2026-04-04T12:00:00.000Z");
    expect(localDay(latest, "America/Sao_Paulo")).toBe("2026-02-10");
  });

  it("uses the end of the picked local day", () => {
    expect(parseDay("2026-02-10")).toBe("2026-02-10");
    expect(parseDay("10/02")).toBeNull();
    expect(endOfLocalDay("2026-02-10", "America/Sao_Paulo").toISOString()).toBe("2026-02-11T02:59:59.999Z");
  });

  it("covers the chosen local days up to thirty", () => {
    const one = daySpan("2026-02-10", "2026-02-10", "America/Sao_Paulo");
    expect(one?.from.toISOString()).toBe("2026-02-10T03:00:00.000Z");
    expect(one?.to.toISOString()).toBe("2026-02-11T02:59:59.999Z");
    const month = daySpan("2026-02-01", "2026-04-04", "America/Sao_Paulo");
    expect(month && validateRange(month.from, month.to)).toBe("OK");
    expect(daySpan("2026-02-11", "2026-02-10", "America/Sao_Paulo")).toBeNull();
  });
});
