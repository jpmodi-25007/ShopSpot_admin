/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR, { mutate as globalMutate } from "swr";
import { usePathname, useRouter } from "next/navigation";
import {
  Store,
  LayoutDashboard,
  ShoppingBag,
  Users,
  Star,
  ShieldAlert,
  BarChart3,
  Settings,
  FileText,
  LifeBuoy,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  Calendar,
} from "lucide-react";
import styles from "./AdminLayout.module.css";
import toast from "react-hot-toast";
import { fetcher } from "@/lib/fetcher";
import { apiGet, apiPost, clearSession } from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { useDebounce } from "@/lib/useDebounce";
import { API_URL } from "@/config/constants";

interface AdminLayoutProps {
  children: React.ReactNode;
}

type SummaryKey = "pendingShops" | "pendingInfluencers" | "pendingReports" | "unreadNotifications";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ size?: number }>;
  section: string;
  badgeKey?: SummaryKey;
}

interface SearchHit {
  group: "Users" | "Shops" | "Influencers";
  id: string;
  title: string;
  sub: string;
  href: string;
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "main" },
  { label: "Shop Management", href: "/shops", icon: ShoppingBag, section: "main", badgeKey: "pendingShops" },
  { label: "Promotions", href: "/promotions", icon: Sparkles, section: "main" },
  { label: "Events", href: "/events", icon: Calendar, section: "main" },
  { label: "User Management", href: "/users", icon: Users, section: "main" },
  { label: "Influencers", href: "/influencers", icon: Star, section: "main", badgeKey: "pendingInfluencers" },
  { label: "Moderation", href: "/moderation", icon: ShieldAlert, section: "ops", badgeKey: "pendingReports" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, section: "ops" },
  { label: "Settings", href: "/settings", icon: Settings, section: "ops" },
  { label: "Notifications", href: "/notifications", icon: Bell, section: "ops", badgeKey: "unreadNotifications" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);

  // Global search state
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [hits, setHits] = useState<SearchHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [activeHit, setActiveHit] = useState(0);
  const debouncedQuery = useDebounce(query.trim(), 300);
  const searchRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: me } = useSWR(`${API_URL}/auth/me`, fetcher, { revalidateOnFocus: false });
  const { data: summary } = useSWR(`${API_URL}/admin/summary`, fetcher, {
    refreshInterval: 20000,
    revalidateOnFocus: true,
  });
  const { data: notificationsPayload, mutate: mutateNotifications } = useSWR(
    showNotifications ? `${API_URL}/admin/notifications?limit=8` : null,
    fetcher,
  );
  const notifications: Array<{
    id: string;
    title: string;
    body: string;
    isRead: boolean;
    createdAt: string;
  }> = Array.isArray(notificationsPayload)
    ? notificationsPayload
    : notificationsPayload?.data || [];

  // Client-side route guard: the API enforces authorization itself, this just
  // sends visitors without an admin session to the login page.
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const role = localStorage.getItem("userRole");
    if (!token || role !== "ADMIN") {
      router.replace("/login");
    }
  }, [router]);

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem("refreshToken");
    try {
      // Revoke the server-side session (best effort - we sign out locally regardless).
      if (refreshToken) await apiPost("/auth/logout", { refreshToken });
    } catch {
      /* ignore */
    }
    clearSession();
    await globalMutate(() => true, undefined, { revalidate: false });
    toast.success("Logged out successfully");
    router.push("/login");
  };

  // Close dropdowns on outside click / Escape
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setSearchOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSearchOpen(false);
        setShowNotifications(false);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchOpen(true);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  // Debounced global search across users, shops and influencers
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      /* eslint-disable react-hooks/set-state-in-effect -- clearing/filling hits after debounce is the point of this effect */
      setHits([]);
      setSearching(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const q = encodeURIComponent(debouncedQuery);
    Promise.allSettled([
      apiGet<{ data: Array<Record<string, unknown>> }>(`/admin/users?search=${q}&limit=5`),
      apiGet<{ data: Array<Record<string, unknown>> }>(`/admin/shops?search=${q}&limit=5`),
      apiGet<{ data: Array<Record<string, unknown>> }>(`/admin/influencers?search=${q}&limit=5`),
    ]).then(([users, shops, influencers]) => {
      if (cancelled) return;
      const next: SearchHit[] = [];
      if (users.status === "fulfilled")
        for (const u of users.value.data ?? [])
          next.push({ group: "Users", id: String(u.id), title: String(u.name || u.email || u.mobile || "Unnamed user"), sub: `${u.email || u.mobile || ""} · ${u.role || ""}`, href: `/users/${u.id}` });
      if (shops.status === "fulfilled")
        for (const sh of shops.value.data ?? []) {
          const owner = sh.owner as { email?: string } | undefined;
          next.push({ group: "Shops", id: String(sh.id), title: String(sh.name || "Shop"), sub: `${sh.city || "No city"} · ${owner?.email || ""}`, href: `/shops/${sh.id}` });
        }
      if (influencers.status === "fulfilled")
        for (const i of influencers.value.data ?? []) {
          const user = i.user as { name?: string; email?: string } | undefined;
          next.push({ group: "Influencers", id: String(i.id), title: String(i.displayName || user?.name || "Influencer"), sub: String(user?.email || i.username || ""), href: `/influencers/${i.id}` });
        }
      setHits(next);
      setActiveHit(0);
      setSearching(false);
    });
    /* eslint-enable react-hooks/set-state-in-effect */
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  const goToHit = useCallback(
    (hit: SearchHit) => {
      setSearchOpen(false);
      setQuery("");
      router.push(hit.href);
    },
    [router],
  );

  const handleSearchKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveHit((i) => Math.min(i + 1, Math.max(hits.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveHit((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && hits[activeHit]) {
      e.preventDefault();
      goToHit(hits[activeHit]);
    }
  };

  const handleMarkAllRead = async () => {
    setMarkingRead(true);
    try {
      await apiPost("/admin/notifications/mark-read");
      await Promise.all([mutateNotifications(), globalMutate(`${API_URL}/admin/summary`)]);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setMarkingRead(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const stats = await apiGet<Record<string, unknown>>("/admin/dashboard");
      const rows: unknown[][] = [];
      for (const [key, value] of Object.entries(stats)) {
        if (value === null || typeof value === "object") continue;
        rows.push([key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()), value]);
      }
      downloadCsv(`platform-report-${new Date().toISOString().slice(0, 10)}.csv`, ["Metric", "Value"], rows);
      toast.success("Report downloaded");
    } catch (e) {
      toast.error((e as Error).message || "Could not generate report");
    } finally {
      setExporting(false);
    }
  };

  const adminName: string = me?.name || me?.email || "Admin";
  const initials = adminName
    .split(/\s+/)
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const badgeTitles: Record<SummaryKey, string> = {
    pendingShops: "Shops awaiting KYC verification",
    pendingInfluencers: "Influencers awaiting verification",
    pendingReports: "Open moderation reports",
    unreadNotifications: "Unread notifications",
  };
  const badgeValue = (key?: SummaryKey) => {
    const n = key && summary ? Number(summary[key]) : 0;
    if (!n || n <= 0) return null;
    // Show the real count so a large queue doesn't look "stuck" at 99+.
    return n > 999 ? "999+" : n.toLocaleString();
  };
  const unread = Number(summary?.unreadNotifications) || 0;
  const groups = (["Users", "Shops", "Influencers"] as const).filter((g) => hits.some((h) => h.group === g));

  const mainItems = navItems.filter((i) => i.section === "main");
  const opsItems = navItems.filter((i) => i.section === "ops");

  const renderNavItem = (item: NavItem) => {
    const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={`${styles.navItem} ${isActive ? styles.navItemActive : ""}`}
        onClick={() => setSidebarOpen(false)}
      >
        <Icon size={18} />
        <span className={styles.navLabel}>{item.label}</span>
        {badgeValue(item.badgeKey) && (
          <span className={styles.navBadge} title={item.badgeKey ? badgeTitles[item.badgeKey] : undefined}>
            {badgeValue(item.badgeKey)}
          </span>
        )}
        {isActive && <span className={styles.activeGlow} />}
      </Link>
    );
  };

  return (
    <div className={styles.layout}>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div className={styles.overlay} onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ""}`}>
        {/* Logo */}
        <div className={styles.sidebarHeader}>
          <div className={styles.logoMark}>
            <Store size={20} className={styles.logoIcon} />
          </div>
          <div className={styles.logoText}>
            <span className={styles.logoTitle}>Findivo</span>
            <span className={styles.logoSubtitle}>Admin Portal</span>
          </div>
          <button className={styles.sidebarClose} onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        {/* Navigation */}
        <nav className={styles.nav}>
          <span className={styles.navSection}>Platform</span>
          {mainItems.map(renderNavItem)}

          <span className={styles.navSection}>Operations</span>
          {opsItems.map(renderNavItem)}
        </nav>

        {/* Report CTA */}
        <div className={styles.sidebarCta}>
          <div className={styles.ctaCard}>
            <Sparkles size={18} className={styles.ctaIcon} />
            <div>
              <p className={styles.ctaTitle}>Generate Report</p>
              <p className={styles.ctaDesc}>Export platform analytics</p>
            </div>
          </div>
          <button className={styles.ctaBtn} onClick={handleExport} disabled={exporting}>
            <FileText size={14} />
            {exporting ? "Preparing..." : "Export Now"}
          </button>
        </div>

        {/* Footer */}
        <div className={styles.sidebarFooter}>
          <Link href="/support" className={styles.footerLink}>
            <LifeBuoy size={16} />
            Help & Support
          </Link>
          <button onClick={handleLogout} className={`${styles.footerLink} ${styles.footerLinkDanger}`} style={{ border: "none", background: "none", width: "100%", cursor: "pointer", textAlign: "left" }}>
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className={styles.mainContent}>
        {/* Top Navbar */}
        <header className={styles.topBar}>
          <div className={styles.topBarLeft}>
            <button className={styles.menuBtn} onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className={styles.searchWrap} ref={searchRef}>
              <div className={styles.searchContainer}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search users, shops or influencers..."
                  className={styles.searchInput}
                  id="admin-global-search"
                  value={query}
                  autoComplete="off"
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setSearchOpen(true);
                  }}
                  onFocus={() => setSearchOpen(true)}
                  onKeyDown={handleSearchKey}
                />
                <kbd className={styles.searchKbd}>⌘K</kbd>
              </div>
              {searchOpen && query.trim().length >= 2 && (
                <div className={styles.searchResults} role="listbox">
                  {searching && hits.length === 0 && <div className={styles.searchEmpty}>Searching...</div>}
                  {!searching && hits.length === 0 && debouncedQuery === query.trim() && (
                    <div className={styles.searchEmpty}>No results for &ldquo;{query.trim()}&rdquo;</div>
                  )}
                  {groups.map((g) => (
                    <div key={g}>
                      <div className={styles.searchGroup}>{g}</div>
                      {hits.filter((h) => h.group === g).map((h) => (
                        <button
                          key={`${h.group}-${h.id}`}
                          type="button"
                          className={`${styles.searchItem} ${hits[activeHit] === h ? styles.searchItemActive : ""}`}
                          onMouseEnter={() => setActiveHit(hits.indexOf(h))}
                          onClick={() => goToHit(h)}
                        >
                          <span className={styles.searchItemTitle}>{h.title}</span>
                          <span className={styles.searchItemSub}>{h.sub}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.topBarRight}>
            <div className={styles.notifWrap} ref={notifRef}>
              <button
                className={styles.notifBtn}
                id="admin-notifications"
                aria-label="Notifications"
                onClick={() => setShowNotifications((v) => !v)}
              >
                <Bell size={18} />
                {unread > 0 && <span className={styles.notifDot} />}
              </button>

              {showNotifications && (
                <div className={styles.notifPanel}>
                  <div className={styles.notifPanelHeader}>
                    <span>Notifications</span>
                    <button className={styles.notifMarkBtn} onClick={handleMarkAllRead} disabled={markingRead || unread === 0}>
                      Mark all read
                    </button>
                  </div>
                  <div className={styles.notifList}>
                    {!notifications && <div className={styles.searchEmpty}>Loading...</div>}
                    {Array.isArray(notifications) && notifications.length === 0 && (
                      <div className={styles.searchEmpty}>You&apos;re all caught up.</div>
                    )}
                    {notifications.slice(0, 6).map((n) => (
                        <button
                          type="button"
                          key={n.id}
                          className={styles.notifRow}
                          onClick={async () => {
                            if (n.isRead) return;
                            try {
                              await apiPost(`/admin/notifications/${n.id}/read`);
                              await Promise.all([
                                mutateNotifications(),
                                globalMutate(`${API_URL}/admin/summary`),
                              ]);
                            } catch (e) {
                              toast.error((e as Error).message);
                            }
                          }}
                        >
                          <div className={`${styles.notifUnreadDot} ${n.isRead ? styles.notifReadDot : ""}`} />
                          <div>
                            <div className={styles.notifTitle}>{n.title}</div>
                            <div className={styles.notifBody}>{n.body}</div>
                            <div className={styles.notifTime}>{new Date(n.createdAt).toLocaleString()}</div>
                          </div>
                        </button>
                      ))}
                  </div>
                  <Link href="/notifications" className={styles.notifFooter} onClick={() => setShowNotifications(false)}>
                    View all notifications
                  </Link>
                </div>
              )}
            </div>

            <div className={styles.adminProfile}>
              {me?.avatarUrl ? (
                <img src={me.avatarUrl} alt={adminName} className={styles.avatar} />
              ) : (
                <div className={styles.avatarFallback}>{initials || "A"}</div>
              )}
              <div className={styles.adminInfo}>
                <span className={styles.adminName}>{adminName}</span>
                <span className={styles.adminRole}>Administrator</span>
              </div>
              <ChevronDown size={14} className={styles.chevron} />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className={styles.pageContainer}>
          <div className="page-enter">{children}</div>
        </div>
      </main>
    </div>
  );
}
