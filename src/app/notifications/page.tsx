"use client";

import React, { useMemo, useState } from "react";
import AdminLayout from "@/components/AdminLayout/AdminLayout";
import {
  ShieldCheck,
  AlertTriangle,
  BellOff,
  Megaphone,
  RefreshCw,
  CheckCheck,
  Inbox,
  Loader2,
} from "lucide-react";
import sharedStyles from "../../components/AdminLayout/shared.module.css";
import styles from "./notifications.module.css";
import useSWR, { mutate as globalMutate } from "swr";
import { fetcher } from "@/lib/fetcher";
import { API_URL } from "@/config/constants";
import { apiPost, buildQuery } from "@/lib/api";
import { revalidateAdminSummary } from "@/lib/revalidate";
import toast from "react-hot-toast";

type Notif = {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  type?: string;
};

type Feed = {
  data: Notif[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    unreadCount: number;
  };
};

type Filter = "all" | "unread";

function relativeTime(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  const sec = Math.max(0, Math.floor(ms / 1000));
  if (sec < 60) return "Just now";
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function iconFor(type?: string) {
  if (!type) return ShieldCheck;
  if (type === "SYSTEM") return Megaphone;
  if (type.includes("REPORT") || type.includes("REJECT")) return AlertTriangle;
  if (type.includes("ORDER") || type.includes("RESERVATION")) return Inbox;
  return ShieldCheck;
}

function toneFor(type?: string): "system" | "alert" | "success" | "info" {
  if (type === "SYSTEM") return "system";
  if (type && (type.includes("REJECT") || type.includes("EXPIR"))) return "alert";
  if (type && (type.includes("ACCEPT") || type.includes("APPROV") || type.includes("COMPLETE"))) {
    return "success";
  }
  return "info";
}

export default function NotificationsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [isMarking, setIsMarking] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastData, setBroadcastData] = useState({
    title: "",
    body: "",
    targetRole: "ALL",
  });

  const query = buildQuery({ page, limit: 30, filter: filter === "all" ? undefined : filter });
  const key = `${API_URL}/admin/notifications${query}`;
  const { data, error, isLoading, mutate, isValidating } = useSWR<Feed>(key, fetcher, {
    keepPreviousData: true,
  });

  const notifications = data?.data || [];
  const meta = data?.meta;
  const unreadCount = meta?.unreadCount ?? 0;

  const refreshBadges = async () => {
    await Promise.all([
      mutate(),
      revalidateAdminSummary(),
      globalMutate(
        (k) => typeof k === "string" && k.startsWith(`${API_URL}/admin/notifications`),
        undefined,
        { revalidate: true },
      ),
    ]);
  };

  const handleMarkAllRead = async () => {
    try {
      setIsMarking(true);
      await apiPost("/admin/notifications/mark-read");
      toast.success("All notifications marked as read");
      setFilter("all");
      setPage(1);
      await refreshBadges();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setIsMarking(false);
    }
  };

  const handleMarkOne = async (id: string) => {
    try {
      setMarkingId(id);
      await apiPost(`/admin/notifications/${id}/read`);
      await refreshBadges();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setMarkingId(null);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastData.title || !broadcastData.body) {
      return toast.error("Title and body are required");
    }
    try {
      setIsBroadcasting(true);
      await apiPost("/notifications/broadcast", broadcastData);
      toast.success("Broadcast sent");
      setShowBroadcastModal(false);
      setBroadcastData({ title: "", body: "", targetRole: "ALL" });
      setFilter("all");
      setPage(1);
      await refreshBadges();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const subtitle = useMemo(() => {
    if (!meta) return "System alerts and broadcasts for your admin account.";
    return `${meta.total.toLocaleString()} in inbox · ${unreadCount.toLocaleString()} unread`;
  }, [meta, unreadCount]);

  return (
    <AdminLayout>
      <div>
        <header className={sharedStyles.pageHeader}>
          <div>
            <h1 className={sharedStyles.pageTitle}>Notifications</h1>
            <p className={sharedStyles.pageSubtitle}>{subtitle}</p>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button
              type="button"
              className={sharedStyles.btnSecondary}
              onClick={() => mutate()}
              disabled={isValidating}
              title="Refresh"
            >
              <RefreshCw size={16} className={isValidating ? styles.spin : undefined} />
              <span>Refresh</span>
            </button>
            <button
              type="button"
              className={sharedStyles.btnSecondary}
              onClick={() => setShowBroadcastModal(true)}
            >
              <Megaphone size={16} />
              <span>Broadcast</span>
            </button>
            <button
              type="button"
              className={sharedStyles.btnPrimary}
              onClick={handleMarkAllRead}
              disabled={isMarking || unreadCount === 0}
            >
              <CheckCheck size={16} />
              <span>{isMarking ? "Marking..." : "Mark all read"}</span>
            </button>
          </div>
        </header>

        <div className={styles.toolbar}>
          <div className={styles.filters} role="tablist" aria-label="Notification filter">
            {(
              [
                { id: "all", label: "All" },
                { id: "unread", label: `Unread${unreadCount ? ` (${unreadCount})` : ""}` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={filter === tab.id}
                className={`${styles.filterBtn} ${filter === tab.id ? styles.filterBtnActive : ""}`}
                onClick={() => {
                  setFilter(tab.id);
                  setPage(1);
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.notificationsContainer}>
          {error && (
            <div className={styles.errorState}>
              <AlertTriangle size={20} />
              <div>
                <strong>Could not load notifications</strong>
                <p>{(error as Error).message || "Please try again."}</p>
              </div>
              <button type="button" className={styles.retryBtn} onClick={() => mutate()}>
                Retry
              </button>
            </div>
          )}

          {!error && isLoading && !data && (
            <div className={styles.loadingState}>
              <Loader2 size={22} className={styles.spin} />
              <span>Loading notifications…</span>
            </div>
          )}

          {!error && !isLoading && notifications.length === 0 && (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <BellOff size={28} />
              </div>
              <h3 className={styles.emptyTitle}>
                {filter === "unread" ? "No unread notifications" : "You're all caught up"}
              </h3>
              <p className={styles.emptyDesc}>
                {filter === "unread"
                  ? "Switch to All to see older alerts, or broadcast a message to the platform."
                  : "System alerts and broadcasts will show up here."}
              </p>
            </div>
          )}

          {!error && notifications.length > 0 && (
            <div className={styles.notificationList}>
              {notifications.map((notif, index) => {
                const Icon = iconFor(notif.type);
                const tone = toneFor(notif.type);
                return (
                  <button
                    type="button"
                    key={notif.id}
                    className={`${styles.notificationCard} ${!notif.isRead ? styles.unread : ""}`}
                    style={{ animationDelay: `${Math.min(index, 12) * 0.03}s` }}
                    onClick={() => {
                      if (!notif.isRead) void handleMarkOne(notif.id);
                    }}
                    disabled={markingId === notif.id}
                  >
                    <div className={`${styles.iconWrapper} ${styles[tone]}`}>
                      <Icon size={20} />
                    </div>

                    <div className={styles.contentWrapper}>
                      <div className={styles.headerRow}>
                        <h4 className={styles.title}>{notif.title}</h4>
                        <time className={styles.date} dateTime={notif.createdAt} title={new Date(notif.createdAt).toLocaleString()}>
                          {relativeTime(notif.createdAt)}
                        </time>
                      </div>
                      <p className={styles.bodyText}>{notif.body}</p>
                      <div className={styles.metaRow}>
                        <span className={styles.typeChip}>{notif.type || "ALERT"}</span>
                        {!notif.isRead && (
                          <span className={styles.markHint}>
                            {markingId === notif.id ? "Marking…" : "Click to mark read"}
                          </span>
                        )}
                      </div>
                    </div>

                    {!notif.isRead && <span className={styles.unreadDot} aria-hidden />}
                  </button>
                );
              })}
            </div>
          )}

          {meta && meta.totalPages > 1 && (
            <div className={styles.pager}>
              <button
                type="button"
                className={styles.pagerBtn}
                disabled={page <= 1 || isValidating}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              <span className={styles.pagerMeta}>
                Page {meta.page} of {meta.totalPages}
              </span>
              <button
                type="button"
                className={styles.pagerBtn}
                disabled={page >= meta.totalPages || isValidating}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>

      {showBroadcastModal && (
        <div className={styles.modalBackdrop} onClick={() => setShowBroadcastModal(false)}>
          <div
            className={styles.modalContent}
            role="dialog"
            aria-modal="true"
            aria-labelledby="broadcast-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id="broadcast-title" className={styles.modalTitle}>
              Broadcast message
            </h2>
            <p className={styles.modalHint}>
              Sends a system notification to every active account in the selected audience.
              Choosing Everyone also notifies admins (including you).
            </p>
            <form onSubmit={handleBroadcast}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="bcast-audience">
                  Audience
                </label>
                <select
                  id="bcast-audience"
                  className={styles.formSelect}
                  value={broadcastData.targetRole}
                  onChange={(e) =>
                    setBroadcastData((prev) => ({ ...prev, targetRole: e.target.value }))
                  }
                >
                  <option value="ALL">Everyone on Findivo</option>
                  <option value="SHOPKEEPER">All retailers</option>
                  <option value="CUSTOMER">All customers</option>
                  <option value="INFLUENCER">All influencers</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="bcast-title">
                  Title
                </label>
                <input
                  id="bcast-title"
                  required
                  maxLength={120}
                  type="text"
                  className={styles.formInput}
                  value={broadcastData.title}
                  onChange={(e) =>
                    setBroadcastData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  placeholder="e.g. Scheduled maintenance"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="bcast-body">
                  Message
                </label>
                <textarea
                  id="bcast-body"
                  required
                  maxLength={1000}
                  className={styles.formTextarea}
                  value={broadcastData.body}
                  onChange={(e) =>
                    setBroadcastData((prev) => ({ ...prev, body: e.target.value }))
                  }
                  placeholder="Write the message users will see…"
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button type="submit" disabled={isBroadcasting} className={styles.submitBtn}>
                  {isBroadcasting ? "Sending…" : "Send broadcast"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
