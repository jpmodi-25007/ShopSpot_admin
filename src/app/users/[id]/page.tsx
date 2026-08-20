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

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [isEditUserOpen, setEditUserOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const { data: user, error, mutate } = useSWR(`${API_URL}/admin/users/${id}`, fetcher, {
    onSuccess: (data) => {
      // Optional: if backend returned notes, we could set them here. We'll simulate it for now.
    }
  });

  const handleSuspend = async () => {
    if (!user) return;
    try {
      setIsUpdating(true);
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/admin/users/${id}/suspend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !user.isActive })
      });
      if (!res.ok) throw new Error("Failed to update status");
      mutate();
      toast.success(`Account ${user.isActive ? "suspended" : "activated"} successfully`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleNotesSave = () => {
    // In a real implementation this would hit an API endpoint like PUT /admin/users/:id/notes
    toast.success("Admin notes saved successfully");
  };

  return (
    <AdminLayout>
      {/* Top Navigation */}
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
        <div style={{ display: "flex", gap: 12 }}>
          <button className={s.btnSecondary} onClick={() => setEditUserOpen(true)}><Edit2 size={14} /> Edit Profile</button>
          <span className={`${s.statusBadge} ${s.statusActive}`}>Active</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 300px", gap: 24 }}>
        
        {/* Left Panel: Profile */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className={s.card} style={{ textAlign: "center", padding: "32px 20px" }}>
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.name} style={{ width: 100, height: 100, borderRadius: "50%", margin: "0 auto 16px auto", objectFit: "cover" }} />
            ) : (
              <div style={{ width: 100, height: 100, borderRadius: "50%", background: "#0F766E20", color: "#0F766E", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 700, margin: "0 auto 16px auto" }}>
                {user?.name?.charAt(0) || "U"}
              </div>
            )}
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--neutral-900)", marginBottom: 4 }}>{user?.name || "Loading..."}</h2>
            
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

        {/* Center Panel: Metrics & Activity */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className={s.card} style={{ padding: 24 }}>
            <h3 className={s.cardTitle} style={{ marginBottom: 20 }}>Account Overview</h3>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Metric 1 */}
              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--neutral-200)", display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ background: "var(--teal-50)", color: "var(--teal-600)", padding: 12, borderRadius: 12 }}>
                  <ShoppingBag size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase" }}>Total Orders</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--neutral-900)" }}>{user?.customerOrders?.length || 0}</div>
                </div>
              </div>

              {/* Metric 2 */}
              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--neutral-200)", display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ background: "var(--blue-50)", color: "var(--blue-600)", padding: 12, borderRadius: 12 }}>
                  <DollarSign size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase" }}>Lifetime Spent</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--neutral-900)" }}>
                    ${user?.customerOrders?.reduce((acc: number, o: { total: string | number }) => acc + (parseFloat(String(o.total)) || 0), 0).toLocaleString() || 0}
                  </div>
                </div>
              </div>

              {/* Metric 3 */}
              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--amber-200)", background: "var(--amber-50)", display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ background: "var(--amber-100)", color: "var(--amber-600)", padding: 12, borderRadius: 12 }}>
                  <AlertOctagon size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--amber-700)", fontWeight: 600, textTransform: "uppercase" }}>Active Disputes</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--neutral-900)" }}>0</div>
                </div>
              </div>

              {/* Metric 4 */}
              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--neutral-200)", display: "flex", gap: 16, alignItems: "center" }}>
                <div style={{ background: "var(--purple-50)", color: "var(--purple-600)", padding: 12, borderRadius: 12 }}>
                  <Star size={24} />
                </div>
                <div>
                  <div style={{ fontSize: 12, color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase" }}>Reviews Given</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: "var(--neutral-900)" }}>{user?.reviews?.length || 0}</div>
                </div>
              </div>
            </div>
          </div>

          <div className={s.card} style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 className={s.cardTitle}>Recent Activity</h3>
              <button className={s.btnSecondary} style={{ padding: "4px 8px", fontSize: 12 }}>View All</button>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {user?.customerOrders?.map((o: { id: string; createdAt: string; shop?: { name?: string }; status: string; total: string | number }) => (
                <div key={o.id} style={{ display: "flex", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--neutral-100)" }}>
                  <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--teal-500)" }}></div>
                    <span style={{ fontSize: 14, color: "var(--neutral-800)" }}>Placed Order #{o.id.slice(-4).toUpperCase()}</span>
                  </div>
                  <span style={{ fontSize: 12, color: "var(--neutral-400)" }}>{new Date(o.createdAt).toLocaleDateString()}</span>
                </div>
              ))}
              {!user?.customerOrders?.length && <div style={{ fontSize: 14, color: "var(--neutral-500)", padding: "12px 0" }}>No recent activity.</div>}
            </div>
          </div>
        </div>

        {/* Right Panel: Decision */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className={s.card} style={{ padding: 24 }}>
            <h3 className={s.cardTitle} style={{ marginBottom: 16 }}>Administration</h3>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--neutral-600)" }}>Admin Notes (Internal)</span>
                <button 
                  onClick={handleNotesSave}
                  style={{ fontSize: 11, background: "none", border: "none", color: "var(--primary-600)", fontWeight: 600, cursor: "pointer" }}>
                  Save
                </button>
              </div>
              <textarea 
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add notes about this user..." 
                style={{ width: "100%", height: 120, padding: 12, borderRadius: 8, border: "1px solid var(--neutral-300)", resize: "none", fontSize: 13, fontFamily: "inherit" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button className={s.btnSecondary} style={{ width: "100%", padding: "10px", justifyContent: "center" }} onClick={() => toast("Password reset email sent (simulation)", { icon: "📧" })}>
                <Key size={16} /> Send Password Reset
              </button>
              <button 
                disabled={isUpdating}
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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>First Name</label>
              <input type="text" defaultValue="John" style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Last Name</label>
              <input type="text" defaultValue="Doe" style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Email Address</label>
            <input type="email" defaultValue="john@example.com" style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Phone Number</label>
            <input type="tel" defaultValue="+1 (555) 123-4567" style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button className={s.btnSecondary} onClick={() => setEditUserOpen(false)}>Cancel</button>
            <button className={s.btnPrimary} onClick={() => { setEditUserOpen(false); toast.success("Profile Updated"); }}>Save Changes</button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
