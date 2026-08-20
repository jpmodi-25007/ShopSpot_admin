/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import AdminLayout from "@/components/AdminLayout/AdminLayout";
import Modal from "@/components/Modal/Modal";
import {
  Search, Filter, Eye, Edit2, ShieldOff,
  ChevronLeft, ChevronRight, Star as StarIcon, UserCheck,
} from "lucide-react";
import toast from "react-hot-toast";
import s from "../../components/AdminLayout/shared.module.css";
import { API_URL } from "@/config/constants";


function statusClass(status: string) {
  if (status === "Verified") return s.statusActive;
  if (status === "Pending") return s.statusPending;
  if (status === "Flagged") return s.statusSuspended;
  return s.statusInactive;
}

function StarRating({ rating }: { rating: number }) {
  if (!rating) return <span style={{ color: "var(--neutral-400)", fontSize: 12 }}>—</span>;
  return (
    <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 13, fontWeight: 600 }}>
      <StarIcon size={13} style={{ color: "#F59E0B", fill: "#F59E0B" }} />
      {rating.toFixed(1)}
    </span>
  );
}

export default function InfluencersPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const { data, error, mutate } = useSWR(`${API_URL}/admin/influencers?page=${currentPage}&limit=50`, fetcher);
  const { data: categoriesData } = useSWR(`${API_URL}/categories`, fetcher);
  
  const influencers = data?.data || [];
  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);

  const [search, setSearch] = useState("");
  const [isInviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteBio, setInviteBio] = useState("");
  const [inviteCity, setInviteCity] = useState("");
  const [inviteCategory, setInviteCategory] = useState("");
  const [inviteInstagram, setInviteInstagram] = useState("");
  const [inviteYoutube, setInviteYoutube] = useState("");
  const [inviteFacebook, setInviteFacebook] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [editCreatorId, setEditCreatorId] = useState<string | null>(null);
  const [deleteCreatorId, setDeleteCreatorId] = useState<string | null>(null);

  const [editStatus, setEditStatus] = useState("VERIFIED");

  const handleEditStatus = async () => {
    try {
      if (!editCreatorId) return;
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/admin/influencers/${editCreatorId}/verify`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: editStatus })
      });
      if (res.ok) {
        setEditCreatorId(null);
        mutate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleInvite = async () => {
    if (!inviteName || !inviteEmail) {
      toast.error("Name and Email are required");
      return;
    }
    
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/admin/influencers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: inviteName,
          email: inviteEmail,
          bio: inviteBio,
          city: inviteCity,
          categoryId: inviteCategory,
          instagramUrl: inviteInstagram,
          youtubeUrl: inviteYoutube,
          facebookUrl: inviteFacebook
        })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create influencer");
      }

      toast.success(`Influencer ${inviteName} created successfully!`);
      setInviteOpen(false);
      setInviteEmail("");
      setInviteName("");
      setInviteBio("");
      setInviteCity("");
      setInviteCategory("");
      setInviteInstagram("");
      setInviteYoutube("");
      setInviteFacebook("");
      mutate();
    } catch (e: any) {
      toast.error(e.message || "Failed to create influencer");
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = influencers.filter(
    (c: { user?: { name?: string; email?: string; avatarUrl?: string }; platforms?: string[]; socialPlatform?: string }) =>
      c.user?.name?.toLowerCase().includes(search.toLowerCase()) ||
      c.socialPlatform?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout>
      {/* Header */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Influencer Management</h1>
          <p className={s.pageSubtitle}>Review and manage creator accounts and campaigns.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className={s.btnSecondary} id="influencers-export" onClick={() => toast.success('Export started.')}>Export CSV</button>
          <button className={s.btnPrimary} id="influencers-invite" onClick={() => setInviteOpen(true)}>
            <UserCheck size={14} />
            Invite Creator
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={s.toolbar}>
        <div className={s.toolbarSearch}>
          <Search size={15} style={{ color: "var(--neutral-400)", flexShrink: 0 }} />
          <input
            id="influencers-search"
            type="text"
            placeholder="Search by name or niche..."
            className={s.toolbarSearchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={s.toolbarActions}>
          <button className={s.toolbarFilter} id="influencers-filter-status">
            <Filter size={13} /> Status
          </button>
          <button className={s.toolbarFilter} id="influencers-filter-niche">
            <Filter size={13} /> Niche
          </button>
        </div>
      </div>

      {/* Table */}
      <div className={s.card}>
        <div className={s.cardHeader}>
          <span className={s.cardTitle}>All Influencers</span>
          <span style={{ fontSize: "12px", color: "var(--neutral-500)" }}>{filtered.length} results</span>
        </div>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Creator</th>
                <th>Niche</th>
                <th>Campaigns</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((creator: { id: string; user?: { id: string; name: string; email: string; isActive: boolean; avatarUrl?: string }; verificationStatus: string; followerCount: number; platforms: string[]; socialPlatform?: string; createdAt: string }) => (
                <tr 
                  key={creator.id}
                  onClick={() => router.push(`/influencers/${creator.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <div className={s.shopInfo}>
                      {creator.user?.avatarUrl ? (
                        <img src={creator.user.avatarUrl} alt={creator.user?.name} className={s.shopAvatar} />
                      ) : (
                        <div className={s.shopAvatarPlaceholder} style={{ background: "#F59E0B20", color: "#F59E0B" }}>
                          {creator.user?.name ? creator.user.name.charAt(0) : "I"}
                        </div>
                      )}
                      <div>
                        <div className={s.shopName}>{creator.user?.name || 'Unnamed Creator'}</div>
                        <div className={s.shopMeta}>{creator.socialPlatform}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--neutral-600)" }}>{creator.socialPlatform || 'Unknown'}</td>
                  <td style={{ fontWeight: 600, color: "var(--neutral-800)" }}>
                    {creator.followerCount ? creator.followerCount.toLocaleString() : '0'}
                  </td>
                  <td>
                    <span className={`${s.statusBadge} ${creator.verificationStatus === 'VERIFIED' ? s.statusActive : s.statusPending}`}>
                      {creator.verificationStatus || 'PENDING'}
                    </span>
                  </td>
                  <td>
                    <div className={s.actionBtns}>
                      <button 
                        className={s.actionBtn} 
                        id={`inf-view-${creator.id}`} 
                        title="View Profile"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/influencers/${creator.id}`);
                        }}
                      >
                        <Eye size={14} />
                      </button>
                      <button className={s.actionBtn} id={`inf-edit-${creator.id}`} title="Edit" onClick={(e) => { e.stopPropagation(); setEditCreatorId(creator.id); }}><Edit2 size={14} /></button>
                      <button className={`${s.actionBtn} ${s.actionBtnDanger}`} id={`inf-suspend-${creator.id}`} title="Suspend" onClick={(e) => { e.stopPropagation(); setDeleteCreatorId(creator.id); }}><ShieldOff size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className={s.emptyState}>
              <div className={s.emptyIcon}><StarIcon size={28} /></div>
              <div className={s.emptyTitle}>No influencers found</div>
              <div className={s.emptyDesc}>Try adjusting your search.</div>
            </div>
          )}
        </div>
        <div className={s.pagination}>
          <span className={s.paginationMeta}>Showing 1–{filtered.length} of {influencers.length}</span>
          <div className={s.paginationBtns}>
            <button className={s.pgBtn} id="inf-prev"><ChevronLeft size={14} /></button>
            <button className={`${s.pgBtn} ${s.pgBtnActive}`} id="inf-pg-1">1</button>
            <button className={s.pgBtn} id="inf-pg-2">2</button>
            <button className={s.pgBtn} id="inf-next"><ChevronRight size={14} /></button>
          </div>
        </div>
      </div>

      <Modal isOpen={isInviteOpen} onClose={() => setInviteOpen(false)} title="Invite Creator">
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
          <p style={{ color: "var(--neutral-500)", fontSize: 14, margin: 0 }}>Create an influencer profile manually.</p>
          
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Creator Name *</label>
            <input type="text" placeholder="e.g. Alex" value={inviteName} onChange={e => setInviteName(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Email Address *</label>
            <input type="email" placeholder="creator@example.com" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Bio</label>
            <textarea placeholder="Brief bio..." value={inviteBio} onChange={e => setInviteBio(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8, resize: "vertical", minHeight: 80 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>City</label>
            <input type="text" placeholder="e.g. Bangalore" value={inviteCity} onChange={e => setInviteCity(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Category</label>
            <select value={inviteCategory} onChange={e => setInviteCategory(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8, background: "white" }}>
              <option value="">Select a category</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Instagram URL</label>
            <input type="url" placeholder="https://instagram.com/..." value={inviteInstagram} onChange={e => setInviteInstagram(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>YouTube URL</label>
            <input type="url" placeholder="https://youtube.com/..." value={inviteYoutube} onChange={e => setInviteYoutube(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Facebook URL</label>
            <input type="url" placeholder="https://facebook.com/..." value={inviteFacebook} onChange={e => setInviteFacebook(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button className={s.btnSecondary} onClick={() => setInviteOpen(false)} disabled={isSubmitting}>Cancel</button>
            <button className={s.btnPrimary} onClick={handleInvite} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Influencer"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editCreatorId !== null} onClose={() => setEditCreatorId(null)} title="Edit Influencer">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: "var(--neutral-500)", fontSize: 14, margin: 0 }}>Update creator verification and status.</p>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Verification Status</label>
            <select 
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8, background: "white" }}>
              <option>VERIFIED</option>
              <option>PENDING</option>
              <option>REJECTED</option>
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button className={s.btnSecondary} onClick={() => setEditCreatorId(null)}>Cancel</button>
            <button className={s.btnPrimary} onClick={handleEditStatus}>Save Changes</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteCreatorId !== null} onClose={() => setDeleteCreatorId(null)} title="Suspend Influencer">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: "var(--neutral-700)", fontSize: 15, margin: 0 }}>Are you sure you want to suspend this influencer? They will no longer be able to bid on campaigns.</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button className={s.btnSecondary} onClick={() => setDeleteCreatorId(null)}>Cancel</button>
            <button className={s.btnPrimary} style={{ background: "var(--red-600)" }} onClick={() => { setDeleteCreatorId(null); toast.success("Influencer Suspended"); }}>Suspend Account</button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
