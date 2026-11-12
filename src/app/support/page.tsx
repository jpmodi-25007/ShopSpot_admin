"use client";

import React from "react";
import Link from "next/link";
import { LifeBuoy, Mail, BookOpen, ShieldAlert, Users, Store } from "lucide-react";
import AdminLayout from "@/components/AdminLayout/AdminLayout";
import s from "../../components/AdminLayout/shared.module.css";

// Optional: set NEXT_PUBLIC_SUPPORT_EMAIL at build time to show a contact address.
const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;

const topics = [
  {
    icon: Store,
    title: "Managing shops",
    body: "Verify KYC/GST, edit details, or set a shop to Inactive/Suspended from Shop Management. A shop with orders or reservations cannot be deleted - suspend it instead.",
    href: "/shops",
  },
  {
    icon: Users,
    title: "Managing users",
    body: "Edit profile details, suspend or re-activate accounts, and keep internal notes. Suspending signs the user out immediately. Users with history cannot be deleted.",
    href: "/users",
  },
  {
    icon: ShieldAlert,
    title: "Moderation",
    body: "Review reported listings, mark them under review or resolved, or remove the content (the product is deactivated, or the shop suspended for shop-level reports).",
    href: "/moderation",
  },
  {
    icon: BookOpen,
    title: "Password resets",
    body: "Use \"Send Password Reset\" on a user's profile. They receive a 6-digit code by email and set their own password; admins never see or set passwords.",
    href: "/users",
  },
];

export default function SupportPage() {
  return (
    <AdminLayout>
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Help &amp; Support</h1>
          <p className={s.pageSubtitle}>Quick guidance for common admin tasks.</p>
        </div>
      </div>

      <div className={s.detailGrid2}>
        {topics.map((t) => {
          const Icon = t.icon;
          return (
            <div key={t.title} className={s.card} style={{ padding: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                <Icon size={18} style={{ color: "var(--primary-500)" }} />
                <span className={s.cardTitle}>{t.title}</span>
              </div>
              <p style={{ margin: "0 0 12px", color: "var(--neutral-600)", fontSize: 14, lineHeight: 1.55 }}>{t.body}</p>
              <Link href={t.href} style={{ color: "var(--primary-600)", fontWeight: 600, fontSize: 13 }}>
                Open &rarr;
              </Link>
            </div>
          );
        })}
      </div>

      <div className={s.card} style={{ padding: 20, marginTop: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
          <LifeBuoy size={18} style={{ color: "var(--primary-500)" }} />
          <span className={s.cardTitle}>Need more help?</span>
        </div>
        {SUPPORT_EMAIL ? (
          <p style={{ margin: 0, fontSize: 14, color: "var(--neutral-700)" }}>
            <Mail size={14} style={{ verticalAlign: "-2px", marginRight: 6 }} />
            Email <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "var(--primary-600)", fontWeight: 600 }}>{SUPPORT_EMAIL}</a>
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: 14, color: "var(--neutral-600)" }}>
            Contact your platform engineering team. (A support address can be shown here by setting
            <code> NEXT_PUBLIC_SUPPORT_EMAIL</code> when building the admin app.)
          </p>
        )}
      </div>
    </AdminLayout>
  );
}
