import { isOperatingAt } from "./operating-hours.service";

const hours = {
  mon: [["09:00", "20:00"]],
  sun: [["22:00", "02:00"]],
};

describe("isOperatingAt", () => {
  it("uses the store timezone and a window that crosses midnight", () => {
    expect(isOperatingAt(new Date("2026-01-12T12:00:00Z"), "America/Sao_Paulo", hours)).toBe(true);
    expect(isOperatingAt(new Date("2026-01-12T11:59:00Z"), "America/Sao_Paulo", hours)).toBe(false);
    expect(isOperatingAt(new Date("2026-01-12T01:30:00Z"), "America/Sao_Paulo", hours)).toBe(true);
    expect(isOperatingAt(new Date("2026-01-12T06:00:00Z"), "America/Sao_Paulo", hours)).toBe(false);
  });
});
