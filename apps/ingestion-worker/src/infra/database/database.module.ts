import { Global, Module } from "@nestjs/common";
import { PgPool, useDatabase } from "./pg-pool";

@Global()
@Module({
  providers: [
    {
      provide: PgPool,
      useFactory: () => {
        const pool = new PgPool();
        useDatabase(pool);
        return pool;
      },
    },
  ],
  exports: [PgPool],
})
export class DatabaseModule {}
