export type DemoStore = {
  id: string;
  name: string;
  slug: string;
};

export type OverviewResponse = {
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

export type TopProduct = {
  productId: string;
  productName: string;
  revenue: number;
  purchases: number;
};

export type ActivityEvent = {
  eventId: string;
  eventType: string;
  timestamp: string;
  productId?: string | null;
  amount?: number | null;
  currency?: string | null;
  metadata?: Record<string, unknown> | null;
};
