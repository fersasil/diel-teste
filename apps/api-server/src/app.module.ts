import { Module } from "@nestjs/common";
import { AuthModule } from "./app/auth/auth.module";
import { ClientsModule } from "./app/clients/clients.module";
import { EnvironmentModule } from "./app/environment/environment.module";
import { OpenApiModule } from "./app/openapi/openapi.module";
import { RawBatchesModule } from "./app/raw-batches/raw-batches.module";
import { StoresModule } from "./app/stores/stores.module";

@Module({
  imports: [
    AuthModule,
    ClientsModule,
    StoresModule,
    EnvironmentModule,
    RawBatchesModule,
    OpenApiModule,
  ],
})
export class AppModule {}
