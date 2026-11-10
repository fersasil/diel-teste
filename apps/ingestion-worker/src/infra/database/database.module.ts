import { Global, Module } from "@nestjs/common";
import { PgPool } from "./pg-pool";

@Global()
@Module({
  providers: [PgPool],
  exports: [PgPool],
})
export class DatabaseModule {}
