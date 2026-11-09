import { rawPartKey } from "./raw-batch-writer.service";

describe("raw part object", () => {
  it("writes a new file inside the client hour", () => {
    const at = new Date("2026-04-02T14:10:00.000Z");
    expect(rawPartKey(at, "CLI-001", "a")).toBe("dt=2026-04-02/hour=14/client=CLI-001/a.jsonl.gz");
    expect(rawPartKey(at, "CLI-001", "b")).not.toBe(rawPartKey(at, "CLI-001", "a"));
  });
});
