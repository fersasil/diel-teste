import { Module } from "@nestjs/common";
import { ObjectStoreModule } from "../object-store/object-store.module";
import { MqttIngestion } from "./mqtt.ingestion";

@Module({
  imports: [ObjectStoreModule],
  providers: [MqttIngestion],
  exports: [MqttIngestion],
})
export class MqttModule {}
