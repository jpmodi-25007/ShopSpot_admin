/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout/AdminLayout";
import {
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Store,
  Download,
  MapPin,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import styles from "./analytics.module.css";
import s from "../../components/AdminLayout/shared.module.css";
import { API_URL } from "@/config/constants";
import { downloadCsv } from "@/lib/csv";
import toast from "react-hot-toast";

type Period = "today" | "week" | "month" | "all";

interface TrendMap {
  revenue: number;
  shops: number;
  orders: number;
  users: number;
  views: number;
}

interface AnalyticsPayload {
  period: Period;
  periodLabel: string;
  totalUsers: number;
  totalShops: number;
  totalOrders: number;
  totalRevenue: number | string;
  views?: number;
  trends?: TrendMap;
  revenueBreakdown: { name: string; value: number; amount?: number; color: string }[];
  negotiationTrends: { name: string; initiated: number; completed: number }[];
  topShops: {
    id?: string;
    rank: string | number;
    name: string;
    location: string;
    revenue: string | number;
    orders?: number;
    views?: string | number;
  }[];
  cityDistribution?: { city: string; count: number; pct: number }[];
  mapPoints?: {
    id: string;
    name: string;
    city: string;
    count?: number;
    lat: number;
    lng: number;
    x: number;
    y: number;
  }[];
}

interface TooltipProps {
  active?: boolean;
  payload?: {
    name: string;
    value: number;
    color?: string;
    payload: { color?: string; amount?: number; name?: string };
  }[];
  label?: string;
}

const PERIODS: { key: Period; label: string }[] = [
  { key: "today", label: "Today" },
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "all", label: "All" },
];

const money = (value: number | string | undefined) =>
  `₹${Number(value || 0).toLocaleString("en-IN")}`;

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (!active || !payload?.length) return null;
  const row = payload[0];
  const amount = row.payload?.amount;
  return (
    <div className={styles.customTooltip}>
      <p className={styles.tooltipLabel}>{label || row.payload?.name || row.name}</p>
      <p className={styles.tooltipValue} style={{ color: row.payload?.color || row.color }}>
        {typeof amount === "number" ? money(amount) : row.value}
        {typeof amount === "number" ? ` (${row.value}%)` : ""}
      </p>
    </div>
  );
};

function TrendBadge({ value }: { value?: number }) {
  const v = Number(value || 0);
  if (v === 0) {
    return (
      <div className={`${styles.metricTrend} ${styles.trendFlat}`}>
        <Minus size={14} /> 0%
      </div>
    );
  }
  const positive = v > 0;
  return (
    <div className={`${styles.metricTrend} ${positive ? styles.trendPositive : styles.trendNegative}`}>
      {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
      {Math.abs(v)}%
    </div>
  );
}

/** Lightweight India outline + live shop pins (no map tiles / API keys). */
function IndiaShopMap({
  points,
}: {
  points: NonNullable<AnalyticsPayload["mapPoints"]>;
}) {
  const [hover, setHover] = useState<(typeof points)[number] | null>(null);
  const shopTotal = useMemo(
    () => points.reduce((sum, p) => sum + (p.count || 1), 0),
    [points],
  );
  const maxCount = useMemo(
    () => Math.max(1, ...points.map((p) => p.count || 1)),
    [points],
  );

  return (
    <div className={styles.mapWrap}>
      <svg viewBox="0 0 100 100" className={styles.mapSvg} role="img" aria-label="Shop locations across India">
        {/* Georeferenced India bounding box (6.5–37.5°N, 68–97.5°E). Bubbles use the same projection. */}
        <rect x="2" y="2" width="96" height="96" className={styles.mapFrame} rx="1.5" />
        {[20, 40, 60, 80].map((v) => (
          <g key={v}>
            <line x1={v} y1="2" x2={v} y2="98" className={styles.mapGrid} />
            <line x1="2" y1={v} x2="98" y2={v} className={styles.mapGrid} />
          </g>
        ))}
        <text x="4" y="7" className={styles.mapAxis}>37.5°N</text>
        <text x="4" y="97" className={styles.mapAxis}>6.5°N</text>
        <text x="3" y="99" className={styles.mapAxis} style={{ fontSize: 2.2 }}>68°E</text>
        <text x="86" y="99" className={styles.mapAxis} style={{ fontSize: 2.2 }}>97.5°E</text>
        {points.map((p) => {
          const count = p.count || 1;
          const r = Math.min(8, 1.6 + Math.sqrt(count / maxCount) * 6);
          return (
            <g key={p.id}>
              <circle
                cx={2 + p.x * 0.96}
                cy={2 + p.y * 0.96}
                r={r}
                className={styles.mapDot}
                onMouseEnter={() => setHover(p)}
                onMouseLeave={() => setHover(null)}
              >
                <title>
                  {p.city}: {count} shops
                </title>
              </circle>
              {count >= 5 && (
                <text
                  x={2 + p.x * 0.96}
                  y={2 + p.y * 0.96 + 0.8}
                  textAnchor="middle"
                  className={styles.mapBubbleLabel}
                >
                  {count}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      <div className={styles.mapMeta}>
        <MapPin size={14} />
        <span>
          {shopTotal.toLocaleString()} shops across {points.length} location{points.length === 1 ? "" : "s"}
          {hover ? ` · ${hover.city} (${hover.count || 1})` : ""}
        </span>
      </div>
    </div>
  );
}

export default function AnalyticsScreen() {
  const [period, setPeriod] = useState<Period>("month");
  const { data, error, isLoading } = useSWR<AnalyticsPayload>(
    `${API_URL}/analytics/admin?period=${period}`,
    fetcher,
  );

  const stats: AnalyticsPayload = data || {
    period,
    periodLabel: "…",
    totalRevenue: 0,
    totalShops: 0,
    totalOrders: 0,
    totalUsers: 0,
    revenueBreakdown: [],
    negotiationTrends: [],
    topShops: [],
    cityDistribution: [],
    mapPoints: [],
    trends: { revenue: 0, shops: 0, orders: 0, users: 0, views: 0 },
  };

  const revenueData = stats.revenueBreakdown || [];
  const negotiationData = stats.negotiationTrends || [];
  const topShopsData = stats.topShops || [];
  const cities = stats.cityDistribution || [];
  const mapPoints = stats.mapPoints || [];
  const maxCity = Math.max(1, ...cities.map((c) => c.count));

  const handleExport = () => {
    if (!data) {
      toast.error("Nothing to export yet");
      return;
    }
    try {
      const rows: unknown[][] = [
        ["Period", stats.periodLabel],
        ["Total revenue (delivered)", Number(stats.totalRevenue)],
        ["Active shops", stats.totalShops],
        ["Orders in period", stats.totalOrders],
        ["Total users", stats.totalUsers],
        ["Views in period", stats.views ?? 0],
        [],
        ["Revenue source", "Amount", "Share %"],
        ...revenueData.map((r) => [r.name, r.amount ?? "", r.value]),
        [],
        ["City", "Shops", "Share %"],
        ...cities.map((c) => [c.city, c.count, c.pct]),
        [],
        ["Rank", "Shop", "City", "Revenue", "Orders"],
        ...topShopsData.map((sh) => [
          sh.rank,
          sh.name,
          sh.location,
          typeof sh.revenue === "number" ? sh.revenue : sh.revenue,
          sh.orders ?? "",
        ]),
      ];
      downloadCsv(
        `analytics-${stats.period}-${new Date().toISOString().slice(0, 10)}.csv`,
        ["Field", "Value", "Extra"],
        rows,
      );
      toast.success("Analytics exported");
    } catch (e: unknown) {
      toast.error((e as Error).message || "Export failed");
    }
  };

  return (
    <AdminLayout>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Platform Analytics</h1>
          <p className={s.pageSubtitle}>
            {stats.periodLabel ? `Showing ${stats.periodLabel.toLowerCase()}.` : "Overview of platform performance and engagement."}
            {" "}Trends compare against the previous equal window.
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <div className={styles.dateToggle}>
            {PERIODS.map((tab) => (
              <button
                key={tab.key}
                className={`${styles.toggleBtn} ${period === tab.key ? styles.active : ""}`}
                onClick={() => setPeriod(tab.key)}
                id={`analytics-tab-${tab.key}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button className={s.btnSecondary} id="analytics-export" onClick={handleExport} disabled={!data}>
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#fef2f2", color: "#b91c1c", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {(error as Error).message || "Failed to load analytics"}
        </div>
      )}

      <div className={styles.metricsGrid}>
        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Delivered Revenue</span>
            <TrendBadge value={stats.trends?.revenue} />
          </div>
          <div className={styles.metricValue}>{isLoading ? "…" : money(stats.totalRevenue)}</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Active Shops</span>
            <TrendBadge value={stats.trends?.shops} />
          </div>
          <div className={styles.metricValue}>{isLoading ? "…" : Number(stats.totalShops).toLocaleString("en-IN")}</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Orders</span>
            <TrendBadge value={stats.trends?.orders} />
          </div>
          <div className={styles.metricValue}>{isLoading ? "…" : Number(stats.totalOrders).toLocaleString("en-IN")}</div>
        </div>

        <div className={styles.metricCard}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Total Users</span>
            <TrendBadge value={stats.trends?.users} />
          </div>
          <div className={styles.metricValue}>{isLoading ? "…" : Number(stats.totalUsers).toLocaleString("en-IN")}</div>
        </div>
      </div>

      <div className={styles.chartsGrid}>
        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Revenue Mix</h3>
            <p className={styles.cardSubtitle}>Delivered GMV, in-progress orders, and subscriptions</p>
          </div>
          <div className={styles.chartContainer}>
            {revenueData.every((r) => !r.value) ? (
              <div className={styles.emptyChart}>No revenue recorded in this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {revenueData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "16px" }}>
            {revenueData.map((item) => (
              <div key={item.name} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--neutral-600)" }}>
                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: item.color }} />
                  {item.name}
                </div>
                <span style={{ fontWeight: 600, color: "var(--neutral-900)" }}>
                  {money(item.amount ?? 0)} · {item.value}%
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.cardHeader} style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <div>
              <h3 className={styles.cardTitle}>Negotiation Trends</h3>
              <p className={styles.cardSubtitle}>Initiated vs accepted deals in {stats.periodLabel?.toLowerCase() || "period"}</p>
            </div>
            <div style={{ display: "flex", gap: "16px", fontSize: "13px", color: "var(--neutral-600)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#0F766E" }} /> Initiated
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#F59E0B" }} /> Accepted
              </div>
            </div>
          </div>
          <div className={styles.chartContainer}>
            {negotiationData.every((d) => !d.initiated && !d.completed) ? (
              <div className={styles.emptyChart}>No negotiations in this period.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={negotiationData} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} dy={10} />
                  <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fill: "#6B7280", fontSize: 12 }} />
                  <Tooltip contentStyle={{ borderRadius: "8px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1)" }} cursor={{ fill: "#F3F4F6" }} />
                  <Bar dataKey="initiated" fill="#0F766E" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="completed" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Geographic Heatmap</h3>
            <p className={styles.cardSubtitle}>Active shop density across India (live coordinates)</p>
          </div>
          {mapPoints.length === 0 ? (
            <div className={styles.emptyChart}>No shops with map coordinates yet.</div>
          ) : (
            <IndiaShopMap points={mapPoints} />
          )}
          <div className={styles.cityList}>
            {cities.slice(0, 6).map((c) => (
              <div key={c.city} className={styles.cityRow}>
                <div className={styles.cityLabel}>
                  <span>{c.city}</span>
                  <span>{c.count}</span>
                </div>
                <div className={styles.cityTrack}>
                  <div className={styles.cityFill} style={{ width: `${(c.count / maxCity) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.chartCard}>
          <div className={styles.cardHeader}>
            <h3 className={styles.cardTitle}>Top Performing Shops</h3>
            <p className={styles.cardSubtitle}>Ranked by delivered + confirmed order value</p>
          </div>
          <div className={styles.shopsList}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", textTransform: "uppercase", color: "var(--neutral-500)", fontWeight: 600, paddingBottom: "8px" }}>
              <span style={{ width: "24px" }}>#</span>
              <span style={{ flex: 1, paddingLeft: "16px" }}>Shop</span>
              <span style={{ width: "110px", textAlign: "right" }}>Revenue / Orders</span>
            </div>

            {topShopsData.length === 0 && (
              <div className={styles.emptyChart} style={{ minHeight: 120 }}>No ranked shops in this period.</div>
            )}

            {topShopsData.map((shop) => {
              const body = (
                <>
                  <div className={styles.shopRank}>{shop.rank}</div>
                  <div className={styles.shopIcon}>
                    <Store size={20} />
                  </div>
                  <div className={styles.shopInfo}>
                    <div className={styles.shopName}>{shop.name}</div>
                    <div className={styles.shopLocation}>{shop.location}</div>
                  </div>
                  <div className={styles.shopStats}>
                    <div className={styles.shopRevenue}>
                      {typeof shop.revenue === "number" ? money(shop.revenue) : shop.revenue}
                    </div>
                    <div className={styles.shopViews}>
                      {shop.orders != null ? `${shop.orders} orders` : shop.views}
                    </div>
                  </div>
                </>
              );
              return shop.id ? (
                <Link key={String(shop.rank)} href={`/shops/${shop.id}`} className={styles.shopItem}>
                  {body}
                </Link>
              ) : (
                <div key={String(shop.rank)} className={styles.shopItem}>
                  {body}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
