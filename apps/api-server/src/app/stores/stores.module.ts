import { Module } from "@nestjs/common";
import { GetDashboardSummaryModule } from "./services/get-dashboard-summary/get-dashboard-summary.module";
import { ListStoresModule } from "./services/list-stores/list-stores.module";
import { StoresController } from "./stores.controller";

@Module({
  imports: [ListStoresModule, GetDashboardSummaryModule],
  controllers: [StoresController],
})
export class StoresModule {}
