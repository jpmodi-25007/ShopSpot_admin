/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import AdminLayout from "@/components/AdminLayout/AdminLayout";
import { ArrowUpRight, ArrowDownRight, Store, Download, Calendar } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import styles from "./analytics.module.css";
import s from "../../components/AdminLayout/shared.module.css";
import { API_URL } from "@/config/constants";


interface TooltipProps {
  active?: boolean;
  payload?: { name: string; value: number; color?: string; payload: { color?: string } }[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: TooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className={styles.customTooltip}>
        <p className={styles.tooltipLabel}>{label || payload[0].name}</p>
        <p className={styles.tooltipValue} style={{ color: payload[0].payload.color || payload[0].color }}>
          {payload[0].value}{payload[0].name === 'Subscription Fees' || payload[0].name === 'Ad Credits' || payload[0].name === 'Transaction Fees' ? '%' : ''}
        </p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsScreen() {
  const [activeTab, setActiveTab] = useState("Month");
  const { data, error } = useSWR(`${API_URL}/analytics/admin`, fetcher);

  const stats = data || {
    totalRevenue: 0,
    totalShops: 0,
    totalOrders: 0,
    totalUsers: 0,
    revenueBreakdown: [],
    negotiationTrends: [],
    topShops: []
  };

  const revenueData = stats.revenueBreakdown || [];
  const negotiationData = stats.negotiationTrends || [];
  const topShopsData = stats.topShops || [];

  return (
    <AdminLayout>
      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Platform Analytics</h1>
          <p className={s.pageSubtitle}>Overview of platform performance and engagement.</p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <div className={styles.dateToggle}>
            {['Today', 'Week', 'Month', 'Custom'].map(tab => (
              <button
                key={tab}
                className={`${styles.toggleBtn} ${activeTab === tab ? styles.active : ''}`}
                onClick={() => setActiveTab(tab)}
                id={`analytics-tab-${tab.toLowerCase()}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className={s.btnSecondary} id="analytics-export">
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>Total Revenue</span>
              <div className={`${styles.metricTrend} ${styles.trendPositive}`}>
                <ArrowUpRight size={14} /> 12.5%
              </div>
            </div>
            <div className={styles.metricValue}>${stats.totalRevenue.toLocaleString()}</div>
          </div>
          
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>Active Shops</span>
              <div className={`${styles.metricTrend} ${styles.trendPositive}`}>
                <ArrowUpRight size={14} /> 4.2%
              </div>
            </div>
            <div className={styles.metricValue}>{stats.totalShops.toLocaleString()}</div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>Total Orders</span>
              <div className={`${styles.metricTrend} ${styles.trendPositive}`}>
                <ArrowUpRight size={14} /> 18.1%
              </div>
            </div>
            <div className={styles.metricValue}>{stats.totalOrders.toLocaleString()}</div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <span className={styles.metricLabel}>Total Users</span>
              <div className={`${styles.metricTrend} ${styles.trendNegative}`}>
                <ArrowDownRight size={14} /> 1.2%
              </div>
            </div>
            <div className={styles.metricValue}>{stats.totalUsers.toLocaleString()}</div>
          </div>
        </div>

        <div className={styles.chartsGrid}>
          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Revenue Breakdown</h3>
              <p className={styles.cardSubtitle}>Distribution of income sources</p>
            </div>
            <div className={styles.chartContainer}>
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
                    {revenueData.map((entry: { name: string; value: number; color: string }, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
              {revenueData.map((item: { name: string; value: number; color: string }) => (
                <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--neutral-600)' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }}></div>
                    {item.name}
                  </div>
                  <span style={{ fontWeight: 600, color: 'var(--neutral-900)' }}>{item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.cardHeader} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <h3 className={styles.cardTitle}>Negotiation Trends</h3>
                <p className={styles.cardSubtitle}>Initiated vs Completed Deals</p>
              </div>
              <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--neutral-600)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0F766E' }}></div> Initiated
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></div> Completed
                </div>
              </div>
            </div>
            <div className={styles.chartContainer}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={negotiationData} margin={{ top: 5, right: 0, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#6B7280', fontSize: 12}} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }} cursor={{fill: '#F3F4F6'}} />
                  <Bar dataKey="initiated" fill="#0F766E" radius={[4, 4, 0, 0]} barSize={12} />
                  <Bar dataKey="completed" fill="#F59E0B" radius={[4, 4, 0, 0]} barSize={12} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Geographic Heatmap</h3>
              <p className={styles.cardSubtitle}>Shop density across India</p>
            </div>
            <img 
              src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=800&auto=format&fit=crop" 
              alt="Map placeholder" 
              className={styles.mapImg} 
            />
          </div>

          <div className={styles.chartCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.cardTitle}>Top Performing Shops</h3>
              <p className={styles.cardSubtitle}>Ranked by revenue volume</p>
            </div>
            <div className={styles.shopsList}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', textTransform: 'uppercase', color: 'var(--neutral-500)', fontWeight: 600, paddingBottom: '8px' }}>
                <span style={{ width: '24px' }}>#</span>
                <span style={{ flex: 1, paddingLeft: '16px' }}>Shop</span>
                <span style={{ width: '100px', textAlign: 'right' }}>Revenue / Views</span>
              </div>
              
              {topShopsData.map((shop: { rank: string | number; name: string; location: string; revenue: string | number; views: string | number }) => (
                <div key={shop.rank} className={styles.shopItem}>
                  <div className={styles.shopRank}>{shop.rank}</div>
                  <div className={styles.shopIcon}>
                    <Store size={20} />
                  </div>
                  <div className={styles.shopInfo}>
                    <div className={styles.shopName}>{shop.name}</div>
                    <div className={styles.shopLocation}>{shop.location}</div>
                  </div>
                  <div className={styles.shopStats}>
                    <div className={styles.shopRevenue}>{shop.revenue}</div>
                    <div className={styles.shopViews}>{shop.views} views</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
    </AdminLayout>
  );
}
