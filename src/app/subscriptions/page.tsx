"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import AdminLayout from "@/components/AdminLayout/AdminLayout";
import { CreditCard, Users, TrendingUp, Edit2, Check, X, Sparkles, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { API_URL } from "@/config/constants";
import { apiPatch, apiPost } from "@/lib/api";
import styles from "./subscriptions.module.css";

type Tab = "plans" | "subscribers" | "revenue";

interface SubscriptionPlanItem {
  id: string;
  tier: "FREE" | "PRO" | "PREMIUM";
  name: string;
  tagline: string;
  price: number | string;
  yearlyPrice: number | string | null;
  productLimit: number;
  eventLimit: number;
  features: string[] | string;
  isHighlighted: boolean;
  isActive: boolean;
}

interface SubscriberItem {
  id: string;
  shopId: string;
  planTier: "FREE" | "PRO" | "PREMIUM";
  planName?: string;
  shopName?: string;
  startedAt?: string | null;
  expiresAt?: string | null;
  isActive: boolean;
  shop?: {
    id?: string;
    name?: string;
    _count?: {
      products?: number;
    };
  } | null;
}

interface PaymentItem {
  shop?: { name?: string } | null;
  planId?: string;
  planName?: string;
  amount: number | string;
  status: string;
  createdAt: string;
}

interface PaymentStatsData {
  mrr?: number;
  totalRevenue?: number;
  activePaid?: number;
  freeCount?: number;
  tierCounts?: {
    FREE?: number;
    PRO?: number;
    PREMIUM?: number;
  };
  recentPayments?: PaymentItem[];
}

interface EditingPlanForm {
  id: string;
  tier: "FREE" | "PRO" | "PREMIUM";
  name: string;
  tagline: string;
  price: string | number;
  yearlyPrice: string | number | null;
  productLimit: string | number;
  eventLimit: string | number;
  features: string;
  isHighlighted: boolean;
  isActive: boolean;
}

export default function SubscriptionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("plans");
  const [filterTier, setFilterTier] = useState("ALL");
  const [editingPlan, setEditingPlan] = useState<EditingPlanForm | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: plansData, mutate: mutatePlans } = useSWR<SubscriptionPlanItem[] | { data: SubscriptionPlanItem[] }>(
    `${API_URL}/subscriptions/plans`,
    fetcher
  );
  const { data: subsData, mutate: mutateSubs } = useSWR<SubscriberItem[] | { data: SubscriberItem[] }>(
    `${API_URL}/admin/subscriptions?tier=${filterTier}`,
    fetcher
  );
  const { data: statsData } = useSWR<PaymentStatsData | { data: PaymentStatsData }>(
    `${API_URL}/admin/payments/stats`,
    fetcher
  );

  const [overrideModal, setOverrideModal] = useState<{ shopId: string; shopName: string; currentTier: string } | null>(null);
  const [overrideTier, setOverrideTier] = useState<string>("PRO");
  const [overrideDuration, setOverrideDuration] = useState<number>(1);
  const [overrideNote, setOverrideNote] = useState<string>("");
  const [overriding, setOverriding] = useState(false);

  async function handleOverridePlan() {
    if (!overrideModal) return;
    setOverriding(true);
    try {
      await apiPost(`/admin/shops/${overrideModal.shopId}/override-plan`, {
        tier: overrideTier,
        durationMonths: overrideDuration,
        note: overrideNote.trim() || undefined,
      });
      const durationLabel = overrideDuration === 0 ? "lifetime" : `${overrideDuration} month(s)`;
      toast.success(`Plan updated to ${overrideTier} for ${durationLabel}`);
      setOverrideModal(null);
      setOverrideNote("");
      setOverrideDuration(1);
      mutateSubs();
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to override plan");
    } finally {
      setOverriding(false);
    }
  }

  const plans: SubscriptionPlanItem[] = Array.isArray(plansData)
    ? plansData
    : plansData && Array.isArray((plansData as { data: SubscriptionPlanItem[] }).data)
      ? (plansData as { data: SubscriptionPlanItem[] }).data
      : [];

  const subscribers: SubscriberItem[] = Array.isArray(subsData)
    ? subsData
    : subsData && Array.isArray((subsData as { data: SubscriberItem[] }).data)
      ? (subsData as { data: SubscriberItem[] }).data
      : [];

  const stats: PaymentStatsData = (statsData && "data" in statsData && statsData.data)
    ? statsData.data
    : ((statsData as PaymentStatsData) || {});

  const tierBadge: Record<string, string> = {
    FREE: styles.badgeFree,
    PRO: styles.badgePro,
    PREMIUM: styles.badgePremium,
  };

  const tierIcon: Record<string, string> = {
    FREE: "🆓",
    PRO: "⭐",
    PREMIUM: "👑",
  };

  const [seeding, setSeeding] = useState(false);

  async function handleSeedPlans() {
    setSeeding(true);
    try {
      await apiPost("/admin/subscription-plans/seed");
      toast.success("Default plans initialized");
      mutatePlans();
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to initialize plans");
    } finally {
      setSeeding(false);
    }
  }

  async function savePlan() {
    if (!editingPlan) return;
    setSaving(true);
    try {
      await apiPatch(`/admin/subscription-plans/${editingPlan.id}`, {
        name: editingPlan.name,
        tagline: editingPlan.tagline,
        price: parseFloat(String(editingPlan.price)),
        yearlyPrice: editingPlan.yearlyPrice ? parseFloat(String(editingPlan.yearlyPrice)) : null,
        productLimit: parseInt(String(editingPlan.productLimit), 10),
        eventLimit: parseInt(String(editingPlan.eventLimit), 10),
        features: typeof editingPlan.features === "string"
          ? editingPlan.features.split("\n").map((f: string) => f.trim()).filter(Boolean)
          : editingPlan.features,
        isHighlighted: editingPlan.isHighlighted,
        isActive: editingPlan.isActive,
      });
      toast.success("Plan updated successfully");
      setEditingPlan(null);
      mutatePlans();
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to update plan");
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Subscription Management</h1>
          <p className={styles.subtitle}>Manage plans, subscribers, and revenue</p>
        </div>

        {/* Tabs */}
        <div className={styles.tabs}>
          {([
            { id: "plans", label: "Plans", icon: CreditCard },
            { id: "subscribers", label: "Subscribers", icon: Users },
            { id: "revenue", label: "Revenue", icon: TrendingUp },
          ] as { id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }[]).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`${styles.tab} ${activeTab === id ? styles.tabActive : ""}`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Plans Tab */}
        {activeTab === "plans" && (
          <div>
            <div className={styles.planActionsBar}>
              <p className={styles.planActionsHint}>Edit any plan to update features, prices, and product limits in real time.</p>
              <button className={styles.seedBtn} onClick={handleSeedPlans} disabled={seeding}>
                <RefreshCw size={14} className={seeding ? styles.spinning : ""} />
                {seeding ? "Initializing..." : "Reset Default Plans"}
              </button>
            </div>
            {plans.length === 0 ? (
              <div className={styles.emptyPlansCard}>
                <Sparkles size={36} color="#4E342E" />
                <h3>No plans found in database</h3>
                <p>Initialize default Free, Pro, and Premium plans now.</p>
                <button className={styles.saveBtn} onClick={handleSeedPlans} disabled={seeding}>
                  {seeding ? "Initializing..." : "Initialize Default Plans"}
                </button>
              </div>
            ) : (
              <div className={styles.plansGrid}>
                {plans.map((plan) => (
                  <div key={plan.id} className={`${styles.planCard} ${plan.isHighlighted ? styles.planCardHighlighted : ""}`}>
                    {plan.isHighlighted && <div className={styles.popularBadge}>⭐ Most Popular</div>}
                    <div className={styles.planHeader}>
                      <span className={styles.planIcon}>{tierIcon[plan.tier] || "📦"}</span>
                      <div>
                        <h3 className={styles.planName}>{plan.name}</h3>
                        <p className={styles.planTagline}>{plan.tagline}</p>
                      </div>
                      <button
                        className={styles.editBtn}
                        onClick={() => setEditingPlan({
                          id: plan.id,
                          tier: plan.tier,
                          name: plan.name,
                          tagline: plan.tagline,
                          price: plan.price,
                          yearlyPrice: plan.yearlyPrice,
                          productLimit: plan.productLimit,
                          eventLimit: plan.eventLimit,
                          features: Array.isArray(plan.features) ? plan.features.join("\n") : String(plan.features || ""),
                          isHighlighted: Boolean(plan.isHighlighted),
                          isActive: Boolean(plan.isActive),
                        })}
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                    <div className={styles.planStats}>
                      <div className={styles.planStat}>
                        <span className={styles.planStatLabel}>Monthly Price</span>
                        <span className={styles.planStatValue}>₹{plan.price}</span>
                      </div>
                      <div className={styles.planStat}>
                        <span className={styles.planStatLabel}>Products</span>
                        <span className={styles.planStatValue}>{plan.productLimit}</span>
                      </div>
                      <div className={styles.planStat}>
                        <span className={styles.planStatLabel}>Events/month</span>
                        <span className={styles.planStatValue}>{plan.eventLimit}</span>
                      </div>
                    </div>
                    <div className={styles.featuresList}>
                      {(Array.isArray(plan.features) ? plan.features : []).map((f: string, i: number) => (
                        <div key={i} className={styles.featureItem}>
                          <Check size={14} className={styles.featureCheck} />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                    <div className={styles.planFooter}>
                      <span className={`${styles.statusBadge} ${plan.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                        {plan.isActive ? "Active" : "Inactive"}
                      </span>
                      {plan.isHighlighted && <span className={styles.highlightBadge}>Highlighted</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Edit Plan Modal */}
        {editingPlan && (
          <div className={styles.modalOverlay}>
            <div className={styles.modal}>
              <div className={styles.modalHeader}>
                <h2>Edit {editingPlan.tier} Plan</h2>
                <button onClick={() => setEditingPlan(null)}><X size={20} /></button>
              </div>
              <div className={styles.modalBody}>
                <label className={styles.formLabel}>Name</label>
                <input className={styles.formInput} value={editingPlan.name} onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value })} />
                
                <label className={styles.formLabel}>Tagline</label>
                <input className={styles.formInput} value={editingPlan.tagline} onChange={e => setEditingPlan({ ...editingPlan, tagline: e.target.value })} />
                
                <div className={styles.formRow}>
                  <div>
                    <label className={styles.formLabel}>Monthly Price (₹)</label>
                    <input type="number" className={styles.formInput} value={editingPlan.price} onChange={e => setEditingPlan({ ...editingPlan, price: e.target.value })} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Yearly Price (₹)</label>
                    <input type="number" className={styles.formInput} value={editingPlan.yearlyPrice || ""} onChange={e => setEditingPlan({ ...editingPlan, yearlyPrice: e.target.value })} />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div>
                    <label className={styles.formLabel}>Product Limit</label>
                    <input type="number" className={styles.formInput} value={editingPlan.productLimit} onChange={e => setEditingPlan({ ...editingPlan, productLimit: e.target.value })} />
                  </div>
                  <div>
                    <label className={styles.formLabel}>Events/Month</label>
                    <input type="number" className={styles.formInput} value={editingPlan.eventLimit} onChange={e => setEditingPlan({ ...editingPlan, eventLimit: e.target.value })} />
                  </div>
                </div>

                <label className={styles.formLabel}>Features (one per line)</label>
                <textarea className={styles.formTextarea} rows={8} value={editingPlan.features} onChange={e => setEditingPlan({ ...editingPlan, features: e.target.value })} />

                <div className={styles.formRow}>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" checked={editingPlan.isHighlighted} onChange={e => setEditingPlan({ ...editingPlan, isHighlighted: e.target.checked })} />
                    Show &quot;Most Popular&quot; badge
                  </label>
                  <label className={styles.checkboxLabel}>
                    <input type="checkbox" checked={editingPlan.isActive} onChange={e => setEditingPlan({ ...editingPlan, isActive: e.target.checked })} />
                    Active
                  </label>
                </div>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.cancelBtn} onClick={() => setEditingPlan(null)}>Cancel</button>
                <button className={styles.saveBtn} onClick={savePlan} disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Subscribers Tab */}
        {activeTab === "subscribers" && (
          <div>
            <div className={styles.filterRow}>
              <select className={styles.filterSelect} value={filterTier} onChange={e => setFilterTier(e.target.value)}>
                <option value="ALL">All Plans</option>
                <option value="FREE">Free</option>
                <option value="PRO">Pro</option>
                <option value="PREMIUM">Premium</option>
              </select>
            </div>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Shop</th>
                    <th>Plan</th>
                    <th>Products Used</th>
                    <th>Started</th>
                    <th>Expires</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {subscribers.length === 0 && (
                    <tr><td colSpan={7} className={styles.emptyState}>No subscribers found</td></tr>
                  )}
                  {subscribers.map((sub) => (
                    <tr key={sub.id}>
                      <td className={styles.shopCell}>
                        <span className={styles.shopName}>{sub.shop?.name || sub.shopName || "—"}</span>
                      </td>
                      <td>
                        <span className={`${styles.tierBadge} ${tierBadge[sub.planTier] || ""}`}>
                          {tierIcon[sub.planTier]} {sub.planTier}
                        </span>
                      </td>
                      <td>{sub.shop?._count?.products ?? "—"}</td>
                      <td>{sub.startedAt ? new Date(sub.startedAt).toLocaleDateString("en-IN") : "—"}</td>
                      <td>{sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString("en-IN") : "—"}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${sub.isActive ? styles.badgeActive : styles.badgeInactive}`}>
                          {sub.isActive ? "Active" : "Expired"}
                        </span>
                      </td>
                      <td>
                        <button
                          className={styles.overrideBtn}
                          onClick={() => {
                            setOverrideModal({
                              shopId: sub.shopId || sub.shop?.id || "",
                              shopName: sub.shop?.name || sub.shopName || "Shop",
                              currentTier: sub.planTier,
                            });
                            setOverrideTier(sub.planTier === "PREMIUM" ? "PRO" : "PREMIUM");
                            setOverrideDuration(1);
                            setOverrideNote("");
                          }}
                        >
                          Change Plan
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Revenue Tab */}
        {activeTab === "revenue" && (
          <div>
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Monthly Recurring Revenue</div>
                <div className={styles.statValue}>₹{stats.mrr?.toLocaleString("en-IN") || "0"}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Total Revenue (All Time)</div>
                <div className={styles.statValue}>₹{stats.totalRevenue?.toLocaleString("en-IN") || "0"}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Active Paid Subscribers</div>
                <div className={styles.statValue}>{stats.activePaid || 0}</div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statLabel}>Free Plan Users</div>
                <div className={styles.statValue}>{stats.freeCount || 0}</div>
              </div>
            </div>

            <h3 className={styles.sectionTitle}>Plan Distribution</h3>
            <div className={styles.distributionGrid}>
              {[
                { tier: "FREE", label: "Free", count: stats.tierCounts?.FREE || 0, color: "#6B7280" },
                { tier: "PRO", label: "Pro ⭐", count: stats.tierCounts?.PRO || 0, color: "#3B82F6" },
                { tier: "PREMIUM", label: "Premium 👑", count: stats.tierCounts?.PREMIUM || 0, color: "#F59E0B" },
              ].map(({ tier, label, count, color }) => (
                <div key={tier} className={styles.distCard} style={{ borderLeft: `4px solid ${color}` }}>
                  <div className={styles.distLabel}>{label}</div>
                  <div className={styles.distCount}>{count}</div>
                  <div className={styles.distSub}>shops</div>
                </div>
              ))}
            </div>

            <h3 className={styles.sectionTitle}>Recent Payments</h3>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Shop</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.recentPayments || []).map((p, i: number) => (
                    <tr key={i}>
                      <td>{p.shop?.name || "—"}</td>
                      <td>{p.planName || "—"}</td>
                      <td>₹{Number(p.amount).toLocaleString("en-IN")}</td>
                      <td>{new Date(p.createdAt).toLocaleDateString("en-IN")}</td>
                      <td>
                        <span className={`${styles.statusBadge} ${p.status === "paid" ? styles.badgeActive : styles.badgeInactive}`}>
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {!(stats.recentPayments?.length) && (
                    <tr><td colSpan={5} className={styles.emptyState}>No payments yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Override Plan Modal */}
        {overrideModal && (
          <div className={styles.modalOverlay}>
            <div className={styles.modalSmall}>
              <div className={styles.modalHeader}>
                <h2>Change Plan for {overrideModal.shopName}</h2>
                <button onClick={() => setOverrideModal(null)}><X size={20} /></button>
              </div>
              <div className={styles.modalBody}>
                <p className={styles.formHint}>
                  Currently on <strong>{overrideModal.currentTier}</strong> plan. Changes take effect immediately — product and event limits update at once.
                </p>

                <label className={styles.formLabel}>New Plan Tier</label>
                <select
                  className={styles.formInput}
                  value={overrideTier}
                  onChange={(e) => setOverrideTier(e.target.value)}
                >
                  <option value="FREE">🆓 Free — 50 Products, 0 Events</option>
                  <option value="PRO">⭐ Pro — 200 Products, 1 Event/mo</option>
                  <option value="PREMIUM">👑 Premium — 500 Products, 3 Events/mo</option>
                </select>

                <label className={styles.formLabel} style={{ marginTop: 14, display: "block" }}>
                  Duration (months)
                </label>
                <select
                  className={styles.formInput}
                  value={overrideDuration}
                  onChange={(e) => setOverrideDuration(Number(e.target.value))}
                >
                  <option value={0}>♾️ Lifetime / No Expiry</option>
                  <option value={1}>1 month</option>
                  <option value={2}>2 months</option>
                  <option value={3}>3 months</option>
                  <option value={6}>6 months</option>
                  <option value={12}>12 months (1 year)</option>
                  <option value={24}>24 months (2 years)</option>
                </select>
                <p style={{ fontSize: 12, color: "#6B7280", marginTop: 6 }}>
                  {overrideDuration === 0
                    ? "⚠️ This plan will never expire. Use for pilot or lifetime partners."
                    : `Plan will expire on ${new Date(Date.now() + overrideDuration * 30 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.`}
                </p>

                <label className={styles.formLabel} style={{ marginTop: 14, display: "block" }}>
                  Internal Note (optional)
                </label>
                <textarea
                  className={styles.formTextarea}
                  rows={2}
                  placeholder="e.g. Pilot partner — 3 months free, review on Jan 2027"
                  value={overrideNote}
                  onChange={(e) => setOverrideNote(e.target.value)}
                />
                <p style={{ fontSize: 11, color: "#9CA3AF", marginTop: 4 }}>
                  Stored in audit log. The shopkeeper will be notified of the plan change.
                </p>
              </div>
              <div className={styles.modalFooter}>
                <button className={styles.cancelBtn} onClick={() => setOverrideModal(null)}>Cancel</button>
                <button className={styles.saveBtn} onClick={handleOverridePlan} disabled={overriding}>
                  {overriding ? "Updating..." : "Confirm & Apply Plan"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
