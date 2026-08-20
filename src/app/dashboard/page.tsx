"use client";

import React from "react";
import {
  Store, Users, DollarSign, Handshake,
  ArrowUpRight, ArrowRight, TrendingUp, ShieldCheck,
  Download, RefreshCw,
} from "lucide-react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";
import AdminLayout from "@/components/AdminLayout/AdminLayout";
import styles from "./dashboard.module.css";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { API_URL } from "@/config/constants";
import { useRouter } from "next/navigation";

export default function Dashboard() {
  const router = useRouter();
  const { data: stats, error, mutate } = useSWR(`${API_URL}/admin/dashboard`, fetcher);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  // Provide fallbacks while loading
  const isLoading = !stats && !error;
  const dashboardData = stats || {
    totalShops: 0,
    monthlyActiveUsers: 0,
    platformRevenue: 0,
    activeNegotiations: 0,
    chartData: [],
    verificationQueue: [],
    verifiedShops: 0,
    dealsClosed: 0,
    avgDiscount: 0
  };

  return (
    <AdminLayout>
      {/* Page Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <p className={styles.greeting}>{greeting}, Alex 👋</p>
          <h1 className={styles.title}>Dashboard</h1>
          <p className={styles.subtitle}>Here&apos;s what&apos;s happening across the platform today.</p>
        </div>
        <div className={styles.headerActions}>
          <button className={styles.btnSecondary} id="dashboard-refresh" onClick={() => mutate()}>
            <RefreshCw size={14} />
            Refresh
          </button>
          <button className={styles.btnPrimary} id="dashboard-export">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      {/* Metrics */}
      <div className={styles.metricsGrid}>
        <div className={`${styles.metricCard} ${styles.metricCardTeal}`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Total Shops</span>
            <div className={`${styles.metricIconWrap} ${styles.iconTeal}`}>
              <Store size={18} />
            </div>
          </div>
          <div className={styles.metricValue}>{isLoading ? "..." : dashboardData.totalShops.toLocaleString()}</div>
          <div className={`${styles.metricTrend} ${styles.trendUp}`}>
            <ArrowUpRight size={14} />
            <span>Active</span>
          </div>
          <Store size={72} className={styles.metricBg} />
        </div>

        <div className={`${styles.metricCard} ${styles.metricCardBlue}`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Monthly Active Users</span>
            <div className={`${styles.metricIconWrap} ${styles.iconBlue}`}>
              <Users size={18} />
            </div>
          </div>
          <div className={styles.metricValue}>{isLoading ? "..." : (dashboardData.monthlyActiveUsers > 1000 ? (dashboardData.monthlyActiveUsers/1000).toFixed(1) + 'K' : dashboardData.monthlyActiveUsers)}</div>
          <div className={`${styles.metricTrend} ${styles.trendUp}`}>
            <ArrowUpRight size={14} />
            <span>Registered users</span>
          </div>
          <Users size={72} className={styles.metricBg} />
        </div>

        <div className={`${styles.metricCard} ${styles.metricCardGreen}`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Platform Revenue</span>
            <div className={`${styles.metricIconWrap} ${styles.iconGreen}`}>
              <DollarSign size={18} />
            </div>
          </div>
          <div className={styles.metricValue}>{isLoading ? "..." : `$${dashboardData.platformRevenue.toLocaleString()}`}</div>
          <div className={`${styles.metricTrend} ${styles.trendUp}`}>
            <ArrowUpRight size={14} />
            <span>Total Delivered</span>
          </div>
          <DollarSign size={72} className={styles.metricBg} />
        </div>

        <div className={`${styles.metricCard} ${styles.metricCardAmber}`}>
          <div className={styles.metricHeader}>
            <span className={styles.metricLabel}>Active Negotiations</span>
            <div className={`${styles.metricIconWrap} ${styles.iconAmber}`}>
              <Handshake size={18} />
            </div>
          </div>
          <div className={styles.metricValue}>{isLoading ? "..." : dashboardData.activeNegotiations}</div>
          <div className={`${styles.metricTrend} ${styles.trendNeutral}`}>
            <ArrowRight size={14} />
            <span>Pending/Countered</span>
          </div>
          <Handshake size={72} className={styles.metricBg} />
        </div>
      </div>

      {/* Main Grid: Chart + Verifications */}
      <div className={styles.mainGrid}>
        {/* Area Chart */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>Shop Performance (8 Weeks)</h3>
              <p className={styles.cardSubtitle}>Shop views vs buyer inquiries over time</p>
            </div>
            <div className={styles.chartLegend}>
              <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.dotTeal}`} />
                Views
              </div>
              <div className={styles.legendItem}>
                <span className={`${styles.legendDot} ${styles.dotAmber}`} />
                Inquiries
              </div>
            </div>
          </div>
          <div className={styles.chartContainer}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardData.chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14B8A6" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#14B8A6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorInq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} dy={8} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94A3B8", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    borderRadius: "10px",
                    border: "1.5px solid #E2E8F0",
                    boxShadow: "0 10px 25px rgba(0,0,0,0.08)",
                    fontSize: "12px",
                  }}
                />
                <Area type="monotone" dataKey="views" stroke="#14B8A6" strokeWidth={2.5} fill="url(#colorViews)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
                <Area type="monotone" dataKey="inquiries" stroke="#F59E0B" strokeWidth={2.5} fill="url(#colorInq)" dot={false} activeDot={{ r: 5, strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verification Requests */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <div>
              <h3 className={styles.cardTitle}>Verification Queue</h3>
              <p className={styles.cardSubtitle}>Shops awaiting approval</p>
            </div>
            <span className={styles.badge}>{dashboardData.verificationQueue.length} Pending</span>
          </div>
          <div className={styles.requestList}>
            {dashboardData.verificationQueue.map((req: { name: string; location: string; type: string }, i: number) => (
              <div key={i} className={styles.requestItem}>
                <div className={styles.requestHeader}>
                  <div className={styles.requestInfo}>
                    <h4>{req.name}</h4>
                    <p>{req.location} · {req.type}</p>
                  </div>
                </div>
                <div className={styles.requestActions}>
                  <button className={styles.btnApprove} id={`approve-${i}`}>Approve</button>
                  <button className={styles.btnReject} id={`reject-${i}`}>Reject</button>
                </div>
              </div>
            ))}
            {!isLoading && dashboardData.verificationQueue.length === 0 && (
              <div style={{ padding: 16, textAlign: 'center', color: 'var(--neutral-500)', fontSize: 14 }}>
                No shops await verification.
              </div>
            )}
          </div>
          <button className={styles.viewAllBtn} id="view-all-requests" onClick={() => router.push('/shops')}>
            View All Requests →
          </button>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className={styles.statsRow}>
        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: "#F0FDF4" }}>
            <ShieldCheck size={22} style={{ color: "#22C55E" }} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Verified Shops</div>
            <div className={styles.statValue}>{isLoading ? "..." : dashboardData.verifiedShops}</div>
            <div className={`${styles.statChange} ${styles.trendUp}`}>
              <ArrowUpRight size={12} style={{ display: "inline" }} /> 88.4% verification rate
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: "#EFF6FF" }}>
            <TrendingUp size={22} style={{ color: "#3B82F6" }} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Deals Closed</div>
            <div className={styles.statValue}>{isLoading ? "..." : dashboardData.dealsClosed}</div>
            <div className={`${styles.statChange} ${styles.trendUp}`}>
              <ArrowUpRight size={12} style={{ display: "inline" }} /> +22% this month
            </div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconBox} style={{ background: "#FFF7ED" }}>
            <Handshake size={22} style={{ color: "#F59E0B" }} />
          </div>
          <div className={styles.statInfo}>
            <div className={styles.statLabel}>Avg. Discount</div>
            <div className={styles.statValue}>{isLoading ? "..." : dashboardData.avgDiscount}%</div>
            <div className={`${styles.statChange} ${styles.trendNeutral}`}>
              <ArrowRight size={12} style={{ display: "inline" }} /> Stable
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
