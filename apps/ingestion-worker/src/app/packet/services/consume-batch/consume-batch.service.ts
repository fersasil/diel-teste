import { enrichPacket, type Packet } from "../enrich-packet/enrich-packet.service";
import { shouldAck } from "../../../stream/services/ack-gate/ack-gate.service";
import { writeRawBatch } from "../../../raw-batch/services/raw-batch-writer/raw-batch-writer.service";

export async function consumeBatch(
  packets: Packet[],
  rawLines: string[],
  putObject: (key: string, body: Buffer) => Promise<void>,
  commitSamples: () => Promise<void>,
): Promise<{ acked: boolean }> {
  for (const packet of packets) {
    enrichPacket(packet);
  }
  let objectStored = false;
  let samplesCommitted = false;
  try {
    await writeRawBatch(rawLines, putObject);
    objectStored = true;
    await commitSamples();
    samplesCommitted = true;
  } catch {
    return { acked: false };
  }
  return { acked: shouldAck(objectStored, samplesCommitted) };
}
