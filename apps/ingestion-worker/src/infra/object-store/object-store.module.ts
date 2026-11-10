import { Global, Module } from "@nestjs/common";
import { ObjectStore } from "./object-store";

@Global()
@Module({
  providers: [ObjectStore],
  exports: [ObjectStore],
})
export class ObjectStoreModule {}
