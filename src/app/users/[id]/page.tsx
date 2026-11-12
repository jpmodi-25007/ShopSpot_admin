"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout/AdminLayout";
import Modal from "@/components/Modal/Modal";
import {
  ChevronLeft, Mail, Phone, Calendar, ShoppingBag, DollarSign,
  AlertOctagon, Star, Key, ShieldOff, ShieldCheck, Edit2
} from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { API_URL } from "@/config/constants";
import toast from "react-hot-toast";
import s from "../../../components/AdminLayout/shared.module.css";
import { apiPatch, apiPost, apiPut } from "@/lib/api";

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [isEditUserOpen, setEditUserOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editMobile, setEditMobile] = useState("");

  const { data: user, error, mutate } = useSWR(`${API_URL}/admin/users/${id}`, fetcher, {
    onSuccess: (data) => {
      setAdminNotes(data?.adminNote || "");
    },
  });

  const handleSuspend = async () => {
    if (!user) return;
    try {
      setIsUpdating(true);
      await apiPost(`/admin/users/${id}/suspend`, { isActive: !user.isActive });
      await mutate();
      toast.success(`Account ${user.isActive ? "suspended" : "activated"} successfully`);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotesSave = async () => {
    try {
      setIsUpdating(true);
      await apiPut(`/admin/users/${id}/notes`, { note: adminNotes });
      toast.success("Admin notes saved");
      mutate();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handlePasswordReset = async () => {
    const emailOrPhone = user?.email || user?.mobile;
    if (!emailOrPhone) {
      toast.error("This user has no email or phone to send a reset to");
      return;
    }
    try {
      setIsUpdating(true);
      await apiPost("/auth/forgot-password", { emailOrPhone });
      toast.success("If that account exists, a 6-digit reset code has been emailed");
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error("Name is required");
      return;
    }
    try {
      setIsUpdating(true);
      await apiPatch(`/admin/users/${id}`, {
        name: editName.trim(),
        email: editEmail.trim() || undefined,
        mobile: editMobile,
      });
      toast.success("Profile updated");
      setEditUserOpen(false);
      mutate();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <AdminLayout>
      <div className={s.pageHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button
            onClick={() => router.push("/users")}
            style={{ background: "none", border: "none", color: "var(--neutral-500)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 14, marginRight: 16 }}
          >
            <ChevronLeft size={16} />
            Back to Users
          </button>
          <h1 className={s.pageTitle} style={{ margin: 0 }}>User Profile</h1>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <button className={s.btnSecondary} onClick={() => {
            if (!user) return;
            setEditName(user.name || "");
            setEditEmail(user.email || "");
            setEditMobile(user.mobile || "");
            setEditUserOpen(true);
          }} disabled={!user}>
            <Edit2 size={14} /> Edit Profile
          </button>
          <span className={`${s.statusBadge} ${user?.isActive ? s.statusActive : s.statusSuspended}`}>
            {user ? (user.isActive ? "Active" : "Suspended") : "…"}
          </span>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#fef2f2", color: "#b91c1c", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {(error as Error).message || "Failed to load user"}
        </div>
      )}

      <div className={s.detailGrid3}>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className={s.card} style={{ textAlign: "center", padding: "32px 20px" }}>
            {user?.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.name} style={{ width: 100, height: 100, borderRadius: "50%", margin: "0 auto 16px auto", objectFit: "cover" }} />
            ) : (
              <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#0F766E20", color: "#0F766E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 700, margin: "0 auto 16px auto" }}>
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--neutral-900)", marginBottom: 4 }}>{user?.name || "Loading..."}</h2>
            <div style={{ fontSize: 12, color: "var(--neutral-500)", fontWeight: 600 }}>{user?.role}</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24, textAlign: "left" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Mail size={16} style={{ color: "var(--neutral-400)" }} />
                <span style={{ fontSize: 14, color: "var(--neutral-700)" }}>{user?.email || "No Email"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Phone size={16} style={{ color: "var(--neutral-400)" }} />
                <span style={{ fontSize: 14, color: "var(--neutral-700)" }}>{user?.mobile || "No Phone"}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <Calendar size={16} style={{ color: "var(--neutral-400)" }} />
                <span style={{ fontSize: 14, color: "var(--neutral-700)" }}>Joined {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className={s.card} style={{ padding: 24 }}>
            <h3 className={s.cardTitle} style={{ marginBottom: 20 }}>Account Overview</h3>
            <div className={s.formGrid2}>
              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--neutral-200)", display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ background: "var(--teal-50)", color: "var(--teal-600)", padding: 12, borderRadius: 12 }}>
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase" }}>Total Orders</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--neutral-900)" }}>{user?.customerOrders?.length || 0}</div>
                </div>
              </div>
              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--neutral-200)", display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ background: "var(--blue-50)", color: "var(--blue-600)", padding: 12, borderRadius: 12 }}>
                  <DollarSign size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase" }}>Lifetime Spent</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--neutral-900)" }}>
                    ₹{user?.customerOrders?.reduce((acc: number, o: { total: string | number }) => acc + (parseFloat(String(o.total)) || 0), 0).toLocaleString() || 0}
                  </div>
                </div>
              </div>
              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--amber-200)", background: "var(--amber-50)", display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ background: "var(--amber-100)", color: "var(--amber-600)", padding: 12, borderRadius: 12 }}>
                  <AlertOctagon size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--amber-700)", fontWeight: 600, textTransform: "uppercase" }}>Reviews Given</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--neutral-900)" }}>{user?.reviews?.length || 0}</div>
                </div>
              </div>
              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--neutral-200)", display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ background: "var(--purple-50)", color: "var(--purple-600)", padding: 12, borderRadius: 12 }}>
                  <Star size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase" }}>Last Login</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--neutral-900)" }}>
                    {user?.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString() : "Never"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className={s.card} style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 className={s.cardTitle}>Recent Orders</h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {user?.customerOrders?.map((o: { id: string; createdAt: string; status: string; total: string | number }) => (
                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--neutral-100)" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--teal-500)" }} />
                    <span style={{ fontSize: 14, color: "var(--neutral-800)" }}>
                      Order #{o.id.slice(-4).toUpperCase()} · {o.status} · ₹{Number(o.total).toLocaleString()}
                    </span>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--neutral-400)" }}>{new Date(o.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
              {!user?.customerOrders?.length && <div style={{ fontSize: 14, color: "var(--neutral-500)", padding: "12px 0" }}>No recent orders.</div>}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className={s.card} style={{ padding: 24 }}>
            <h3 className={s.cardTitle} style={{ marginBottom: 16 }}>Administration</h3>
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--neutral-600)" }}>Admin Notes (Internal)</span>
                <button
                  onClick={handleNotesSave}
                  disabled={isUpdating}
                  style={{ fontSize: 11, background: "none", border: "none", color: "var(--primary-600)", fontWeight: 600, cursor: "pointer" }}
                >
                  Save
                </button>
              </div>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                maxLength={2000}
                placeholder="Add notes about this user..."
                style={{ width: "100%", height: 120, padding: 12, borderRadius: 8, border: "1px solid var(--neutral-300)", resize: "none", fontSize: 13, fontFamily: "inherit" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button
                className={s.btnSecondary}
                style={{ width: "100%", padding: "10px", justifyContent: "center" }}
                onClick={handlePasswordReset}
                disabled={isUpdating || !user}
              >
                <Key size={16} /> Send Password Reset
              </button>
              <button
                disabled={isUpdating || !user}
                className={user?.isActive ? `${s.btnSecondary} ${s.btnDanger}` : s.btnPrimary}
                style={{ width: "100%", padding: "10px", justifyContent: "center" }}
                onClick={handleSuspend}
              >
                {user?.isActive ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                {isUpdating ? "Updating..." : (user?.isActive ? "Suspend Account" : "Activate Account")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isEditUserOpen} onClose={() => setEditUserOpen(false)} title="Edit Profile">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Full Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Email Address</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }}
            />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Phone Number</label>
            <input
              type="tel"
              value={editMobile}
              onChange={(e) => setEditMobile(e.target.value)}
              placeholder="Leave blank to clear"
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button className={s.btnSecondary} onClick={() => setEditUserOpen(false)} disabled={isUpdating}>Cancel</button>
            <button className={s.btnPrimary} onClick={handleSaveProfile} disabled={isUpdating}>
              {isUpdating ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
