import { Injectable } from "@nestjs/common";
import { startIngestion } from "./subscribe";

@Injectable()
export class MqttIngestion {
  private stopTask: (() => Promise<void>) | undefined;

  async start(): Promise<void> {
    const running = await startIngestion();
    this.stopTask = running.stop;
  }

  async stop(): Promise<void> {
    await this.stopTask?.();
  }
}
