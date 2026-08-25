/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import Link from "next/link";
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

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, section: "main" },
  { label: "Shop Management", href: "/shops", icon: ShoppingBag, section: "main" },
  { label: "Promotions", href: "/promotions", icon: Sparkles, section: "main" },
  { label: "Events", href: "/events", icon: Calendar, section: "main" },
  { label: "User Management", href: "/users", icon: Users, section: "main" },
  { label: "Influencers", href: "/influencers", icon: Star, section: "main" },
  { label: "Moderation", href: "/moderation", icon: ShieldAlert, section: "ops", badge: "3" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, section: "ops" },
  { label: "Settings", href: "/settings", icon: Settings, section: "ops" },
  { label: "Notifications", href: "/notifications", icon: Bell, section: "ops", badge: "3" },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("userRole");
    toast.success("Logged out successfully");
    router.push("/login");
  };

  const mainItems = navItems.filter((i) => i.section === "main");
  const opsItems = navItems.filter((i) => i.section === "ops");

  const renderNavItem = (item: (typeof navItems)[0]) => {
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
        {item.badge && <span className={styles.navBadge}>{item.badge}</span>}
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
          <button className={styles.ctaBtn}>
            <FileText size={14} />
            Export Now
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
            <div className={styles.searchContainer}>
              <Search size={16} className={styles.searchIcon} />
              <input
                type="text"
                placeholder="Search shops, users, or actions..."
                className={styles.searchInput}
                id="admin-global-search"
              />
              <kbd className={styles.searchKbd}>⌘K</kbd>
            </div>
          </div>

          <div className={styles.topBarRight}>
            <div style={{ position: "relative" }}>
              <button 
                className={styles.notifBtn} 
                id="admin-notifications"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell size={18} />
                <span className={styles.notifDot} />
              </button>
              
              {showNotifications && (
                <div style={{ position: "absolute", top: "100%", right: 0, marginTop: 8, width: 320, background: "white", borderRadius: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.1)", border: "1px solid var(--neutral-200)", zIndex: 100, overflow: "hidden" }}>
                  <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--neutral-100)", fontWeight: 600, fontSize: 14, color: "var(--neutral-900)" }}>
                    Notifications
                  </div>
                  <div style={{ maxHeight: 300, overflowY: "auto" }}>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--neutral-50)", display: "flex", gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary-500)", marginTop: 6, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-900)" }}>New Shop Application</div>
                        <div style={{ fontSize: 12, color: "var(--neutral-500)", marginTop: 4, lineHeight: 1.4 }}>ElectroHub Downtown applied for verified status.</div>
                        <div style={{ fontSize: 11, color: "var(--neutral-400)", marginTop: 6 }}>10 mins ago</div>
                      </div>
                    </div>
                    <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--neutral-50)", display: "flex", gap: 12 }}>
                      <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--primary-500)", marginTop: 6, flexShrink: 0 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-900)" }}>Influencer Verification</div>
                        <div style={{ fontSize: 12, color: "var(--neutral-500)", marginTop: 4, lineHeight: 1.4 }}>Elena Rivers uploaded proof of audience.</div>
                        <div style={{ fontSize: 11, color: "var(--neutral-400)", marginTop: 6 }}>2 hours ago</div>
                      </div>
                    </div>
                  </div>
                  <div style={{ padding: "10px 16px", textAlign: "center", borderTop: "1px solid var(--neutral-100)", fontSize: 13, color: "var(--primary-600)", fontWeight: 600, cursor: "pointer", background: "var(--neutral-50)" }}>
                    <Link href="/notifications" onClick={() => setShowNotifications(false)}>
                      View all notifications
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.adminProfile}>
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=150&auto=format&fit=crop"
                alt="Admin"
                className={styles.avatar}
              />
              <div className={styles.adminInfo}>
                <span className={styles.adminName}>Alex Morgan</span>
                <span className={styles.adminRole}>Super Admin</span>
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
