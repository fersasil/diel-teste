import { Module } from "@nestjs/common";
import { GetDashboardSummaryService } from "./get-dashboard-summary.service";

@Module({
  providers: [GetDashboardSummaryService],
  exports: [GetDashboardSummaryService],
})
export class GetDashboardSummaryModule {}
