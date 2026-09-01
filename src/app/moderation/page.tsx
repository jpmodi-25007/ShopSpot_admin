/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import AdminLayout from "@/components/AdminLayout/AdminLayout";
import {
  ShieldAlert, CheckCircle, Clock, XCircle, Search, Filter,
  Eye, CheckCheck, Ban, ChevronLeft, ChevronRight,
} from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import s from "../../components/AdminLayout/shared.module.css";
import localStyles from "./moderation.module.css";
import { API_URL } from "@/config/constants";



function severityBadge(severity: string) {
  const map: Record<string, { bg: string; color: string }> = {
    critical: { bg: "#FFF1F2", color: "#EF4444" },
    high: { bg: "#FFF7ED", color: "#F59E0B" },
    medium: { bg: "#EFF6FF", color: "#3B82F6" },
    low: { bg: "#F0FDF4", color: "#22C55E" },
  };
  return map[severity] || map.low;
}

export default function ModerationPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const { data, error, mutate } = useSWR(`${API_URL}/admin/reports?page=${currentPage}&limit=50`, fetcher);
  const { data: statsData } = useSWR(`${API_URL}/admin/reports/stats`, fetcher);
  
  const reports = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 50, totalPages: 1 };

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [reasonFilter, setReasonFilter] = useState("ALL");
  
  const stats = [
    { label: "Total Flagged", value: statsData?.totalFlagged || 0, icon: ShieldAlert, color: "#F59E0B", bg: "var(--warning-100)" },
    { label: "Under Review", value: statsData?.underReview || 0, icon: Clock, color: "#3B82F6", bg: "var(--info-100)" },
    { label: "Resolved", value: statsData?.resolved || 0, icon: CheckCircle, color: "#22C55E", bg: "var(--success-100)" },
    { label: "Pending", value: (statsData?.totalFlagged || 0) - (statsData?.resolved || 0), icon: XCircle, color: "#EF4444", bg: "var(--error-100)" },
  ];


  const filtered = reports.filter((r: { targetType?: string; status?: string; reporter?: { name?: string }; reason?: string; title?: string; shop?: { name?: string } }) => {
    let matchStatus = true;
    if (statusFilter !== "ALL") matchStatus = r.status === statusFilter;
    
    let matchReason = true;
    if (reasonFilter !== "ALL") matchReason = r.reason === reasonFilter;

    if (!search) return matchStatus && matchReason;
    const searchLower = search.toLowerCase();
    const matchTitle = r.title?.toLowerCase().includes(searchLower) || false;
    const matchShop = r.shop?.name?.toLowerCase().includes(searchLower) || false;
    const matchReasonText = r.reason?.toLowerCase().includes(searchLower) || false;
    return matchStatus && matchReason && (matchTitle || matchShop || matchReasonText);
  });

  const handleResolve = async (id: string, newStatus: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/admin/reports/${id}/resolve`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        mutate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Content Moderation</h1>
          <p className={s.pageSubtitle}>Review flagged listings and enforce community guidelines.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className={s.btnSecondary} id="mod-bulk-resolve">Bulk Resolve</button>
          <button className={s.btnDanger} id="mod-bulk-remove">
            <Ban size={14} />
            Bulk Remove
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className={localStyles.statsGrid}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className={localStyles.statCard}>
              <div className={localStyles.statIcon} style={{ background: stat.bg }}>
                <Icon size={20} style={{ color: stat.color }} />
              </div>
              <div>
                <div className={localStyles.statLabel}>{stat.label}</div>
                <div className={localStyles.statValue}>{stat.value}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className={s.toolbar}>
        <div className={s.toolbarSearch}>
          <Search size={15} style={{ color: "var(--neutral-400)", flexShrink: 0 }} />
          <input
            id="mod-search"
            type="text"
            placeholder="Search flagged items..."
            className={s.toolbarSearchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={s.toolbarActions}>
          <select 
            className={s.toolbarFilter} 
            value={reasonFilter} 
            onChange={(e) => setReasonFilter(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--neutral-300)", fontSize: "13px", background: "white", cursor: "pointer" }}
          >
            <option value="ALL">All Reasons</option>
            <option value="SPAM">Spam</option>
            <option value="INAPPROPRIATE">Inappropriate</option>
            <option value="FRAUD">Fraud</option>
          </select>
          <select 
            className={s.toolbarFilter} 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--neutral-300)", fontSize: "13px", background: "white", cursor: "pointer" }}
          >
            <option value="ALL">All Status</option>
            <option value="PENDING">Pending</option>
            <option value="UNDER_REVIEW">Under Review</option>
            <option value="RESOLVED">Resolved</option>
            <option value="DISMISSED">Dismissed</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardTitle}>Flagged Items</span>
          <span style={{ fontSize: "12px", color: "var(--neutral-500)" }}>{filtered.length} results</span>
        </div>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Item</th>
                <th>Shop</th>
                <th>Reason</th>
                <th>Reports</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item: { id: string; targetType: string; targetId: string; reporter?: { name?: string }; reason: string; status: string; createdAt: string; title?: string; shop?: { name?: string }; severity: string; image?: string; reports?: number; [key: string]: any }) => {
                const sv = severityBadge(item.severity.toLowerCase());
                return (
                  <tr key={item.id}>
                    <td>
                      <div className={s.shopInfo}>
                        {item.image ? (
                          <img src={item.image} alt={item.title} className={s.shopAvatar} style={{ borderRadius: 8 }} />
                        ) : (
                          <div className={s.shopAvatarPlaceholder} style={{ borderRadius: 8 }}>{item.title?.charAt(0)}</div>
                        )}
                        <div className={s.shopName} style={{ maxWidth: 180 }}>{item.title}</div>
                      </div>
                    </td>
                    <td style={{ color: "var(--neutral-600)" }}>{item.shop?.name || 'Unknown'}</td>
                    <td style={{ color: "var(--neutral-600)" }}>{item.reason}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: (item.reports || 0) > 20 ? "#EF4444" : (item.reports || 0) > 5 ? "#F59E0B" : "var(--neutral-900)"
                      }}>
                        {item.reports || 0}
                      </span>
                    </td>
                    <td>
                      <span className={s.statusBadge} style={{ background: sv.bg, color: sv.color }}>
                        {item.severity}
                      </span>
                    </td>
                    <td>
                      <span className={`${s.statusBadge} ${item.status === "RESOLVED" ? s.statusActive : item.status === "UNDER_REVIEW" ? s.statusPending : s.statusInactive}`}>
                        {item.status}
                      </span>
                    </td>
                    <td>
                      <div className={s.actionBtns}>
                        <button className={s.actionBtn} title="Review" onClick={() => handleResolve(item.id, 'UNDER_REVIEW')}><Eye size={14} /></button>
                        <button className={s.actionBtn} title="Resolve" style={{ color: "var(--success-500)" }} onClick={() => handleResolve(item.id, 'RESOLVED')}><CheckCheck size={14} /></button>
                        <button className={`${s.actionBtn} ${s.actionBtnDanger}`} title="Remove"><Ban size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className={s.pagination}>
          <span className={s.paginationMeta}>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * meta.limit + 1}–{Math.min(currentPage * meta.limit, meta.total)} of {meta.total} reports
          </span>
          <div className={s.paginationBtns}>
            <button 
              className={s.pgBtn} 
              id="mod-prev" 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={14} />
            </button>
            
            {Array.from({ length: meta.totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === meta.totalPages || Math.abs(currentPage - p) <= 1)
              .map((p, i, arr) => (
                <React.Fragment key={p}>
                  {i > 0 && arr[i - 1] !== p - 1 && <span style={{ padding: "0 8px", color: "var(--neutral-400)" }}>...</span>}
                  <button 
                    className={`${s.pgBtn} ${currentPage === p ? s.pgBtnActive : ''}`} 
                    onClick={() => setCurrentPage(p)}
                  >
                    {p}
                  </button>
                </React.Fragment>
              ))}

            <button 
              className={s.pgBtn} 
              id="mod-next" 
              onClick={() => setCurrentPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={currentPage === meta.totalPages || meta.totalPages === 0}
              style={{ opacity: (currentPage === meta.totalPages || meta.totalPages === 0) ? 0.5 : 1, cursor: (currentPage === meta.totalPages || meta.totalPages === 0) ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
