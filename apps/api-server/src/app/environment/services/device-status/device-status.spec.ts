import { deviceStatus } from "./device-status.service";

describe("deviceStatus", () => {
  const now = new Date("2026-11-04T18:00:00Z");

  it("uses the virtual clock, not the wall clock", () => {
    expect(deviceStatus(null, now)).toBe("NO_DATA");
    expect(deviceStatus(new Date("2026-11-04T17:45:00Z"), now)).toBe("ONLINE");
    expect(deviceStatus(new Date("2026-11-04T17:44:59Z"), now)).toBe("OFFLINE");
  });
});
