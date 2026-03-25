"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { formatCurrency, formatDateTime, formatEventType, formatNumber, formatShortDate } from "../lib/format";
import type { ActivityEvent, OverviewResponse, TopProduct } from "../lib/types";
import { MetricCard } from "./metric-card";
import { SectionCard } from "./section-card";

const TREND_WINDOWS = [7, 14, 30] as const;
const CHART_COLORS = ["#ef4444", "#f97316", "#0f766e", "#3b82f6", "#f59e0b"];

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { message?: string };
    throw new Error(body.message ?? "Request failed");
  }

  return (await response.json()) as T;
}

type StoreAnalyticsDashboardProps = {
  storeName: string;
};

function buildMetricCards(overview: OverviewResponse) {
  return [
    {
      label: "Revenue Today",
      value: formatCurrency(overview.revenue.today),
      hint: "Calendar day revenue"
    },
    {
      label: "Revenue This Week",
      value: formatCurrency(overview.revenue.week),
      hint: "Current UTC week"
    },
    {
      label: "Revenue This Month",
      value: formatCurrency(overview.revenue.month),
      hint: "Current UTC month"
    },
    {
      label: "Conversion Rate",
      value: `${overview.conversionRate}%`,
      hint: "Purchases / page views"
    }
  ];
}

function buildTrendEventMix(overview: OverviewResponse) {
  return [
    { name: "Views", value: overview.trendEventCounts.pageView },
    { name: "Cart Adds", value: overview.trendEventCounts.addToCart },
    { name: "Removals", value: overview.trendEventCounts.removeFromCart },
    { name: "Checkouts", value: overview.trendEventCounts.checkoutStarted },
    { name: "Purchases", value: overview.trendEventCounts.purchases }
  ];
}

export function StoreAnalyticsDashboard({ storeName }: StoreAnalyticsDashboardProps) {
  const router = useRouter();
  const [trendDays, setTrendDays] = useState<(typeof TREND_WINDOWS)[number]>(14);

  const overview = useSWR<OverviewResponse>(`/api/analytics/overview?trendDays=${trendDays}`, fetchJson, {
    refreshInterval: 15000
  });
  const topProducts = useSWR<TopProduct[]>("/api/analytics/top-products", fetchJson, {
    refreshInterval: 30000
  });
  const recentActivity = useSWR<ActivityEvent[]>("/api/analytics/recent-activity", fetchJson, {
    refreshInterval: 5000
  });

  const isLoading = !overview.data || !topProducts.data || !recentActivity.data;
  const hasError = overview.error || topProducts.error || recentActivity.error;
  const metricCards = overview.data ? buildMetricCards(overview.data) : [];
  const trendEventMix = overview.data ? buildTrendEventMix(overview.data) : [];
  const activeTrendWindow = overview.data?.trendWindowDays ?? trendDays;

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  function refreshDashboard() {
    void overview.mutate();
    void topProducts.mutate();
    void recentActivity.mutate();
  }

  return (
    <div className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow">Store Analytics Dashboard</p>
          <h1>{storeName}</h1>
          <p className="muted">Revenue, conversion, product performance, and recent store activity.</p>
        </div>

        <div className="header-actions">
          <div className="segmented-control" aria-label="Trend window">
            {TREND_WINDOWS.map((value) => (
              <button
                className={trendDays === value ? "active" : ""}
                key={value}
                onClick={() => setTrendDays(value)}
                type="button"
              >
                {value}d
              </button>
            ))}
          </div>
          <button className="secondary-button" onClick={handleLogout} type="button">
            Log out
          </button>
        </div>
      </header>

      {hasError ? (
        <div className="error-banner">
          <p>Something went wrong while loading analytics.</p>
          <button className="secondary-button" onClick={refreshDashboard} type="button">
            Retry
          </button>
        </div>
      ) : null}

      <section className="metrics-grid">
        {isLoading ? (
          <>
            <div className="metric-card skeleton" />
            <div className="metric-card skeleton" />
            <div className="metric-card skeleton" />
            <div className="metric-card skeleton" />
          </>
        ) : (
          metricCards.map((card) => (
            <MetricCard hint={card.hint} key={card.label} label={card.label} value={card.value} />
          ))
        )}
      </section>

      <section className="dashboard-grid">
        <SectionCard subtitle={`Revenue trend for the last ${activeTrendWindow} days`} title="Performance">
          {overview.data ? (
            <div className="chart-wrap">
              <ResponsiveContainer height={280} width="100%">
                <AreaChart data={overview.data.revenueTrend}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="#f97316" stopOpacity={0.5} />
                      <stop offset="100%" stopColor="#f97316" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
                  <XAxis dataKey="date" tickFormatter={formatShortDate} tickLine={false} />
                  <YAxis tickFormatter={(value) => `$${value}`} tickLine={false} width={60} />
                  <Tooltip
                    contentStyle={{
                      background: "#081120",
                      border: "1px solid rgba(148, 163, 184, 0.18)",
                      borderRadius: 16
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                    labelFormatter={(label) => formatShortDate(label)}
                  />
                  <Area
                    dataKey="revenue"
                    fill="url(#revenueFill)"
                    stroke="#f97316"
                    strokeWidth={3}
                    type="monotone"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="panel-skeleton" />
          )}
        </SectionCard>

        <SectionCard subtitle={`Event totals for the last ${activeTrendWindow} days`} title="Event Mix">
          {overview.data ? (
            <div className="chart-wrap">
              <ResponsiveContainer height={280} width="100%">
                <BarChart data={trendEventMix}>
                  <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
                  <XAxis dataKey="name" tickLine={false} />
                  <YAxis tickFormatter={formatNumber} tickLine={false} width={56} />
                  <Tooltip
                    contentStyle={{
                      background: "#081120",
                      border: "1px solid rgba(148, 163, 184, 0.18)",
                      borderRadius: 16
                    }}
                    formatter={(value: number) => formatNumber(value)}
                  />
                  <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                    {trendEventMix.map((entry, index) => (
                      <Cell fill={CHART_COLORS[index % CHART_COLORS.length]} key={entry.name} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="panel-skeleton" />
          )}
        </SectionCard>

        <SectionCard subtitle="Top 10 products ranked by revenue" title="Top Products">
          {topProducts.data ? (
            <div className="table-list">
              {topProducts.data.map((product, index) => (
                <div className="table-row" key={product.productId}>
                  <div>
                    <p className="table-title">
                      {index + 1}. {product.productName}
                    </p>
                    <p className="table-subtitle">{product.productId}</p>
                  </div>
                  <div className="table-metrics">
                    <strong>{formatCurrency(product.revenue)}</strong>
                    <span>{formatNumber(product.purchases)} purchases</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel-skeleton" />
          )}
        </SectionCard>

        <SectionCard subtitle="Latest 20 raw events for this store" title="Recent Activity">
          {recentActivity.data ? (
            <div className="activity-list">
              {recentActivity.data.map((eventItem) => (
                <div className="activity-row" key={eventItem.eventId}>
                  <div>
                    <p className="table-title">{formatEventType(eventItem.eventType)}</p>
                    <p className="table-subtitle">{formatDateTime(eventItem.timestamp)}</p>
                  </div>
                  <div className="activity-meta">
                    {eventItem.productId ? <span>{eventItem.productId}</span> : null}
                    {eventItem.amount ? (
                      <strong>{formatCurrency(eventItem.amount, eventItem.currency ?? "USD")}</strong>
                    ) : (
                      <strong>Event</strong>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="panel-skeleton" />
          )}
        </SectionCard>
      </section>
    </div>
  );
}
