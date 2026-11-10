import { sharedTopic, workerId } from "./worker-identity";

describe("shared mqtt subscription", () => {
  const clientId = process.env.MQTT_CLIENT_ID;
  const shareGroup = process.env.MQTT_SHARE_GROUP;

  afterEach(() => {
    if (clientId === undefined) {
      delete process.env.MQTT_CLIENT_ID;
    } else {
      process.env.MQTT_CLIENT_ID = clientId;
    }

    if (shareGroup === undefined) {
      delete process.env.MQTT_SHARE_GROUP;
    } else {
      process.env.MQTT_SHARE_GROUP = shareGroup;
    }
  });

  it("delivers each message to one member of the group", () => {
    process.env.MQTT_SHARE_GROUP = "ingestion";
    expect(sharedTopic()).toBe("$share/ingestion/diel/telemetry");
  });

  it("gives every replica its own client id", () => {
    process.env.MQTT_CLIENT_ID = "ingestion-worker-2";
    const id = workerId();
    expect(id.startsWith("ingestion-worker-2-")).toBe(true);
    expect(id).not.toBe("ingestion-worker-2");
  });
});
