import { Global, Module } from "@nestjs/common";
import { ObjectStore, useObjectStore } from "./object-store";

@Global()
@Module({
  providers: [
    {
      provide: ObjectStore,
      useFactory: () => {
        const store = new ObjectStore();
        useObjectStore(store);
        return store;
      },
    },
  ],
  exports: [ObjectStore],
})
export class ObjectStoreModule {}
