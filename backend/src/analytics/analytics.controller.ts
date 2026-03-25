import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentStore } from "../auth/current-store.decorator";
import { JwtStoreGuard } from "../auth/jwt-store.guard";
import { AnalyticsQueryDto } from "./dto/analytics-query.dto";
import { AnalyticsService } from "./analytics.service";

@Controller("analytics")
@UseGuards(JwtStoreGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get("overview")
  async getOverview(
    @CurrentStore() store: { storeId: string },
    @Query() query: AnalyticsQueryDto
  ) {
    return this.analyticsService.getOverview(store.storeId, query.trendDays ?? 14);
  }

  @Get("top-products")
  async getTopProducts(@CurrentStore() store: { storeId: string }) {
    return this.analyticsService.getTopProducts(store.storeId);
  }

  @Get("recent-activity")
  async getRecentActivity(@CurrentStore() store: { storeId: string }) {
    return this.analyticsService.getRecentActivity(store.storeId);
  }
}
