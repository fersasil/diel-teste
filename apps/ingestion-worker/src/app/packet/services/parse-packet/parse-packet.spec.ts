import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parsePacket } from "./parse-packet.service";

describe("parsePacket", () => {
  it("maps a data-folder line onto UTC and keeps a contract packet", () => {
    const line = readFileSync(
    resolve(__dirname, "../../../../../../../data/telemetrias-cort.jsonl"),
    "utf8",
  ).split("\n")[0] ?? "";
    const packet = parsePacket(line);
    expect(packet).toMatchObject({
      deviceId: "IOT020",
      timestamp: "2026-02-11T02:51:04.000Z",
      intervalSeconds: 30,
      savedData: false,
    });
    expect(packet?.readings).toHaveLength(12);

    const contract = parsePacket(JSON.stringify({
      deviceId: "IOT001",
      timestamp: "2026-03-01T15:00:00.000Z",
      intervalSeconds: 60,
      readings: [22],
      savedData: true,
    }));
    expect(contract).toMatchObject({
      deviceId: "IOT001",
      timestamp: "2026-03-01T15:00:00.000Z",
      savedData: true,
    });
  });
});
