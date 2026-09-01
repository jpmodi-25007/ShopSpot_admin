/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import AdminLayout from "@/components/AdminLayout/AdminLayout";
import Modal from "@/components/Modal/Modal";
import {
  Users, UserPlus, Search, Filter, MoreVertical,
  ShieldAlert, Mail, MapPin, Eye, Edit3, Trash2, Shield,
  Plus, Edit2, ChevronLeft, ChevronRight, Download, X,
} from "lucide-react";
import toast from "react-hot-toast";
import s from "../../components/AdminLayout/shared.module.css";
import { API_URL } from "@/config/constants";

function statusClass(isActive: boolean) {
  if (isActive) return s.statusActive;
  return s.statusSuspended;
}

export default function UsersPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const { data, error, mutate } = useSWR(`${API_URL}/admin/users?page=${currentPage}&limit=50`, fetcher);
  const users = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 50, totalPages: 1 };

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [isInviteOpen, setInviteOpen] = useState(false);
  const [editUserId, setEditUserId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);

  // Forms state
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteMobile, setInviteMobile] = useState("");
  const [inviteRole, setInviteRole] = useState("CUSTOMER");
  const [inviteAvatar, setInviteAvatar] = useState<File | null>(null);
  const [inviteAvatarPreview, setInviteAvatarPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editStatus, setEditStatus] = useState("Active");

  const handleInvite = async () => {
    if (!inviteName || !inviteEmail || !inviteRole) {
      toast.error("Name, Email, and Role are required");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      
      let avatarUrl: string | undefined;
      
      if (inviteAvatar) {
        const formData = new FormData();
        formData.append("file", inviteAvatar);
        
        const uploadRes = await fetch(`${API_URL}/upload/image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
        
        if (!uploadRes.ok) throw new Error("Failed to upload avatar");
        
        const uploadData = await uploadRes.json();
        if (uploadData?.data?.url) {
          avatarUrl = uploadData.data.url;
        }
      }

      const res = await fetch(`${API_URL}/admin/users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          mobile: inviteMobile,
          role: inviteRole,
          avatarUrl
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create user");
      }

      toast.success(`User ${inviteName} created successfully!`);
      setInviteOpen(false);
      mutate();
      setInviteEmail("");
      setInviteName("");
      setInviteMobile("");
      setInviteRole("CUSTOMER");
      setInviteAvatar(null);
      if (inviteAvatarPreview) URL.revokeObjectURL(inviteAvatarPreview);
      setInviteAvatarPreview(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to create user");
      console.error(e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setInviteAvatar(file);
      setInviteAvatarPreview(URL.createObjectURL(file));
    }
  };

  const removeAvatar = () => {
    if (inviteAvatarPreview) URL.revokeObjectURL(inviteAvatarPreview);
    setInviteAvatar(null);
    setInviteAvatarPreview(null);
  };

  const handleEditStatus = async () => {
    try {
      if (!editUserId) return;
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/admin/users/${editUserId}/suspend`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isSuspended: editStatus === "Suspended", reason: "Admin UI action" })
      });
      if (res.ok) {
        setEditUserId(null);
        mutate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = users.filter((u: { name?: string; email?: string; isActive?: boolean; createdAt?: string }) => {
    let matchStatus = true;
    if (statusFilter === "ACTIVE") matchStatus = u.isActive === true;
    if (statusFilter === "SUSPENDED") matchStatus = u.isActive === false;
    
    let matchDate = true;
    if (dateFilter !== "ALL" && u.createdAt) {
      const joinDate = new Date(u.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - joinDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (dateFilter === "LAST_7_DAYS") matchDate = diffDays <= 7;
      if (dateFilter === "LAST_30_DAYS") matchDate = diffDays <= 30;
      if (dateFilter === "THIS_YEAR") matchDate = joinDate.getFullYear() === now.getFullYear();
    }
    
    if (!search) return matchStatus && matchDate;
    const searchLower = search.toLowerCase();
    const matchName = u.name?.toLowerCase().includes(searchLower) || false;
    const matchEmail = u.email?.toLowerCase().includes(searchLower) || false;
    return matchStatus && matchDate && (matchName || matchEmail);
  });

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ["ID", "Name", "Email", "Role", "Mobile", "Status", "Joined"];
    const rows = filtered.map((u: any) => [
      u.id,
      `"${u.name || ''}"`,
      `"${u.email || ''}"`,
      u.role,
      `"${u.mobile || ''}"`,
      u.isActive ? "Active" : "Suspended",
      new Date(u.createdAt).toISOString()
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "users_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Export successful");
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>User Management</h1>
          <p className={s.pageSubtitle}>Overview and administration of all platform users.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className={s.btnSecondary} id="users-export" onClick={handleExportCSV}>
            <Download size={14} />
            Export CSV
          </button>
          <button className={s.btnPrimary} id="users-invite" onClick={() => setInviteOpen(true)}>
            <Plus size={14} />
            Invite User
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={s.toolbar}>
        <div className={s.toolbarSearch}>
          <Search size={15} style={{ color: "var(--neutral-400)", flexShrink: 0 }} />
          <input
            id="users-search"
            type="text"
            placeholder="Search by name or email..."
            className={s.toolbarSearchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={s.toolbarActions}>
          <select 
            className={s.toolbarFilter} 
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--neutral-300)", fontSize: "13px", background: "white", cursor: "pointer" }}
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="SUSPENDED">Suspended</option>
          </select>
          <select 
            className={s.toolbarFilter} 
            value={dateFilter} 
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--neutral-300)", fontSize: "13px", background: "white", cursor: "pointer" }}
          >
            <option value="ALL">All Time</option>
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="LAST_30_DAYS">Last 30 Days</option>
            <option value="THIS_YEAR">This Year</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardTitle}>All Users</span>
          <span style={{ fontSize: "12px", color: "var(--neutral-500)" }}>{filtered.length} results</span>
        </div>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>User</th>
                <th>Phone</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user: { id: string; name: string; email: string; role: string; isActive: boolean; lastLoginAt?: string; mobile?: string; createdAt: string; [key: string]: any }) => (
                <tr
                  key={user.id}
                  onClick={() => router.push(`/users/${user.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <div className={s.shopInfo}>
                      <div
                        className={s.shopAvatarPlaceholder}
                        style={{
                          background: "#3B82F620",
                          color: "#3B82F6",
                          borderRadius: "50%",
                        }}
                      >
                        {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                      </div>
                      <div>
                        <div className={s.shopName}>{user.name || "Unnamed User"}</div>
                        <div className={s.shopMeta}>{user.email}</div>
                        <div className={s.shopMeta} style={{ fontSize: 10 }}>{user.role}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--neutral-600)" }}>{user.mobile || "N/A"}</td>
                  <td style={{ color: "var(--neutral-600)" }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>
                    <span className={`${s.statusBadge} ${statusClass(user.isActive)}`}>
                      {user.isActive ? "Active" : "Suspended"}
                    </span>
                  </td>
                  <td>
                    <div className={s.actionBtns}>
                      <button
                        className={s.actionBtn}
                        id={`user-view-${user.id}`}
                        title="View"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/users/${user.id}`);
                        }}
                      >
                        <Eye size={14} />
                      </button>
                      <button className={s.actionBtn} id={`user-edit-${user.id}`} title="Edit" onClick={(e) => { e.stopPropagation(); setEditUserId(user.id); }}><Edit2 size={14} /></button>
                      <button className={`${s.actionBtn} ${s.actionBtnDanger}`} id={`user-delete-${user.id}`} title="Delete" onClick={(e) => { e.stopPropagation(); setDeleteUserId(user.id); }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className={s.emptyState}>
              <div className={s.emptyIcon}><Users size={28} /></div>
              <div className={s.emptyTitle}>No users found</div>
              <div className={s.emptyDesc}>Try adjusting your search.</div>
            </div>
          )}
        </div>
        <div className={s.pagination}>
          <span className={s.paginationMeta}>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * meta.limit + 1}–{Math.min(currentPage * meta.limit, meta.total)} of {meta.total} users
          </span>
          <div className={s.paginationBtns}>
            <button 
              className={s.pgBtn} 
              id="users-prev" 
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
              id="users-next" 
              onClick={() => setCurrentPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={currentPage === meta.totalPages || meta.totalPages === 0}
              style={{ opacity: (currentPage === meta.totalPages || meta.totalPages === 0) ? 0.5 : 1, cursor: (currentPage === meta.totalPages || meta.totalPages === 0) ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={isInviteOpen} onClose={() => setInviteOpen(false)} title="Add User">
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
          <p style={{ color: "var(--neutral-500)", fontSize: 14, margin: 0 }}>Manually create a new user profile.</p>
          
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Avatar</label>
            <div style={{ display: "flex", gap: 12 }}>
              {inviteAvatarPreview ? (
                <div style={{ position: "relative", width: 80, height: 80, borderRadius: "50%", overflow: "hidden", border: "1px solid var(--neutral-200)" }}>
                  <img src={inviteAvatarPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button 
                    onClick={removeAvatar}
                    style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 30, height: 30, background: "rgba(0,0,0,0.5)", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <label style={{ width: 80, height: 80, borderRadius: "50%", border: "2px dashed var(--neutral-300)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--neutral-500)", cursor: "pointer", background: "var(--neutral-50)", transition: "all 0.2s" }}>
                  <span style={{ fontSize: 10, fontWeight: 600 }}>Upload</span>
                  <input type="file" accept="image/*" onChange={handleAvatarSelect} style={{ display: "none" }} />
                </label>
              )}
            </div>
          </div>
          
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Full Name *</label>
            <input type="text" placeholder="e.g. Alex Morgan" value={inviteName} onChange={e => setInviteName(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Email Address *</label>
            <input type="email" placeholder="alex@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Mobile Number</label>
            <input type="tel" placeholder="+91 98765 43210" value={inviteMobile} onChange={e => setInviteMobile(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Role *</label>
            <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8, background: "white" }}>
              <option value="CUSTOMER">Customer</option>
              <option value="SHOPKEEPER">Shopkeeper</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button className={s.btnSecondary} onClick={() => setInviteOpen(false)} disabled={isSubmitting}>Cancel</button>
            <button className={s.btnPrimary} onClick={handleInvite} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create User"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editUserId !== null} onClose={() => setEditUserId(null)} title="Edit User">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: "var(--neutral-500)", fontSize: 14, margin: 0 }}>Update user details and status.</p>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Status</label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8, background: "white" }}>
              <option>Active</option>
              <option>Suspended</option>
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button className={s.btnSecondary} onClick={() => setEditUserId(null)}>Cancel</button>
            <button className={s.btnPrimary} onClick={handleEditStatus}>Save Changes</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteUserId !== null} onClose={() => setDeleteUserId(null)} title="Delete User">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: "var(--neutral-700)", fontSize: 15, margin: 0 }}>Are you sure you want to delete this user? This action cannot be undone.</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button className={s.btnSecondary} style={{ flex: 1, justifyContent: "center" }} onClick={() => setDeleteUserId(null)}>Cancel</button>
            <button className={s.btnPrimary} style={{ background: "var(--red-600)" }} onClick={() => { setDeleteUserId(null); toast.success("User Deleted"); }}>Delete User</button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
