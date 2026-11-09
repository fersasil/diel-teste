import { Injectable } from "@nestjs/common";
import { startStreamConsumer } from "./consume.service";

@Injectable()
export class StreamConsumer {
  private stopTask: (() => Promise<void>) | undefined;

  start(): void {
    this.stopTask = startStreamConsumer().stop;
  }

  async stop(): Promise<void> {
    await this.stopTask?.();
  }
}
