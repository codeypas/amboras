import { Injectable } from "@nestjs/common";
import { CacheService } from "../common/cache.service";
import {
  formatUtcDate,
  startOfUtcDay,
  startOfUtcMonth,
  startOfUtcWeek,
  subtractUtcDays
} from "../common/date.utils";
import { PrismaService } from "../prisma/prisma.service";

type OverviewResponse = {
  revenue: {
    today: number;
    week: number;
    month: number;
  };
  eventCounts: {
    pageView: number;
    addToCart: number;
    removeFromCart: number;
    checkoutStarted: number;
    purchases: number;
  };
  trendEventCounts: {
    pageView: number;
    addToCart: number;
    removeFromCart: number;
    checkoutStarted: number;
    purchases: number;
  };
  trendWindowDays: number;
  conversionRate: number;
  revenueTrend: Array<{
    date: string;
    revenue: number;
  }>;
  generatedAt: string;
};

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService
  ) {}

  async getOverview(storeId: string, trendDays = 14): Promise<OverviewResponse> {
    const cacheKey = `analytics:overview:${storeId}:trend:${trendDays}`;
    const cached = await this.cacheService.get<OverviewResponse>(cacheKey);
    if (cached) {
      return cached;
    }

    const now = new Date();
    const today = startOfUtcDay(now);
    const weekStart = startOfUtcWeek(now);
    const monthStart = startOfUtcMonth(now);
    const trendStart = startOfUtcDay(subtractUtcDays(now, trendDays - 1));

    const dailyStats = await this.prisma.storeDailyStats.findMany({
      where: {
        storeId
      },
      orderBy: {
        date: "asc"
      }
    });

    const revenue = {
      today: 0,
      week: 0,
      month: 0
    };

    const totalEventCounts = {
      pageView: 0,
      addToCart: 0,
      removeFromCart: 0,
      checkoutStarted: 0,
      purchases: 0
    };
    const trendEventCounts = {
      pageView: 0,
      addToCart: 0,
      removeFromCart: 0,
      checkoutStarted: 0,
      purchases: 0
    };

    const revenueByDate = new Map<string, number>();

    for (const stat of dailyStats) {
      const statDate = startOfUtcDay(stat.date);

      totalEventCounts.pageView += stat.pageViews;
      totalEventCounts.addToCart += stat.addToCart;
      totalEventCounts.removeFromCart += stat.removeFromCart;
      totalEventCounts.checkoutStarted += stat.checkoutStarted;
      totalEventCounts.purchases += stat.purchases;

      if (statDate.getTime() >= monthStart.getTime()) {
        revenue.month += stat.revenue;
      }

      if (statDate.getTime() >= weekStart.getTime()) {
        revenue.week += stat.revenue;
      }

      if (statDate.getTime() === today.getTime()) {
        revenue.today += stat.revenue;
      }

      if (statDate.getTime() >= trendStart.getTime()) {
        revenueByDate.set(formatUtcDate(statDate), Number(stat.revenue.toFixed(2)));
        trendEventCounts.pageView += stat.pageViews;
        trendEventCounts.addToCart += stat.addToCart;
        trendEventCounts.removeFromCart += stat.removeFromCart;
        trendEventCounts.checkoutStarted += stat.checkoutStarted;
        trendEventCounts.purchases += stat.purchases;
      }
    }

    const revenueTrend = Array.from({ length: trendDays }, (_, index) => {
      const date = startOfUtcDay(subtractUtcDays(now, trendDays - 1 - index));
      const key = formatUtcDate(date);
      return {
        date: key,
        revenue: Number((revenueByDate.get(key) ?? 0).toFixed(2))
      };
    });

    const response: OverviewResponse = {
      revenue: {
        today: Number(revenue.today.toFixed(2)),
        week: Number(revenue.week.toFixed(2)),
        month: Number(revenue.month.toFixed(2))
      },
      eventCounts: totalEventCounts,
      trendEventCounts,
      trendWindowDays: trendDays,
      conversionRate:
        totalEventCounts.pageView > 0
          ? Number(((totalEventCounts.purchases / totalEventCounts.pageView) * 100).toFixed(2))
          : 0,
      revenueTrend,
      generatedAt: new Date().toISOString()
    };

    await this.cacheService.set(cacheKey, response, 45);

    return response;
  }

  async getTopProducts(storeId: string) {
    const cacheKey = `analytics:top-products:${storeId}`;
    const cached = await this.cacheService.get<
      Array<{
        productId: string;
        productName: string;
        revenue: number;
        purchases: number;
      }>
    >(cacheKey);

    if (cached) {
      return cached;
    }

    const grouped = await this.prisma.productDailyStats.groupBy({
      by: ["productId"],
      where: {
        storeId
      },
      _sum: {
        revenue: true,
        purchases: true
      },
      orderBy: {
        _sum: {
          revenue: "desc"
        }
      },
      take: 10
    });

    const productIds = grouped.map((item) => item.productId);
    const products = await this.prisma.product.findMany({
      where: {
        storeId,
        id: {
          in: productIds
        }
      }
    });

    const productById = new Map(products.map((product) => [product.id, product]));
    const response = grouped.map((item) => ({
      productId: item.productId,
      productName: productById.get(item.productId)?.name ?? item.productId,
      revenue: Number((item._sum.revenue ?? 0).toFixed(2)),
      purchases: item._sum.purchases ?? 0
    }));

    await this.cacheService.set(cacheKey, response, 60);

    return response;
  }

  async getRecentActivity(storeId: string) {
    return this.prisma.event.findMany({
      where: {
        storeId
      },
      orderBy: {
        timestamp: "desc"
      },
      take: 20,
      select: {
        eventId: true,
        eventType: true,
        timestamp: true,
        productId: true,
        amount: true,
        currency: true,
        metadata: true
      }
    });
  }
}
