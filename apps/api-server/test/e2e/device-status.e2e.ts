import { deviceStatus } from "../../src/app/environment/services/device-status/device-status.service";

describe("device status", () => {
  it("classifies the three states against the virtual clock", () => {
    const now = new Date("2026-11-04T18:00:00Z");
    expect(deviceStatus(null, now)).toBe("NO_DATA");
    expect(deviceStatus(new Date("2026-11-04T17:50:00Z"), now)).toBe("ONLINE");
    expect(deviceStatus(new Date("2026-11-04T17:00:00Z"), now)).toBe("OFFLINE");
  });
});
