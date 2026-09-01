/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import AdminLayout from "@/components/AdminLayout/AdminLayout";
import Modal from "@/components/Modal/Modal";
import {
  Store, Plus, Search, Filter, MoreVertical,
  MapPin, Phone, Mail, Link as LinkIcon,
  ShieldCheck, AlertCircle, Eye, CheckCircle2,
  XCircle, MoreHorizontal, ChevronLeft, ChevronRight, Edit2, Trash2,
  Image, X
} from "lucide-react";
import toast from "react-hot-toast";
import s from "../../components/AdminLayout/shared.module.css";
import { API_URL } from "@/config/constants";

function statusClass(status: string) {
  if (status === "Active") return s.statusActive;
  if (status === "Pending") return s.statusPending;
  if (status === "Suspended") return s.statusSuspended;
  return s.statusInactive;
}

export default function ShopsPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const { data, error, mutate } = useSWR(`${API_URL}/admin/shops?page=${currentPage}&limit=50`, fetcher);
  const { data: categoriesData } = useSWR(`${API_URL}/categories`, fetcher);
  
  const shops = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 50, totalPages: 1 };
  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [isAddOpen, setAddOpen] = useState(false);
  const [editShopId, setEditShopId] = useState<string | null>(null);
  const [deleteShopId, setDeleteShopId] = useState<string | null>(null);
  
  const [editStatus, setEditStatus] = useState("Active");

  // Create Shop State
  const [newShopName, setNewShopName] = useState("");
  const [newShopCategory, setNewShopCategory] = useState("");
  const [newShopCity, setNewShopCity] = useState("");
  const [newShopState, setNewShopState] = useState("");
  const [newShopPincode, setNewShopPincode] = useState("");
  const [newShopAddress, setNewShopAddress] = useState("");
  const [newShopPhone, setNewShopPhone] = useState("");
  const [newShopWhatsapp, setNewShopWhatsapp] = useState("");
  const [newShopGst, setNewShopGst] = useState("");
  const [newOwnerEmail, setNewOwnerEmail] = useState("");
  const [newOwnerName, setNewOwnerName] = useState("");
  const [newShopLogo, setNewShopLogo] = useState<File | null>(null);
  const [newShopLogoPreview, setNewShopLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set default category when categories load
  React.useEffect(() => {
    if (categories.length > 0 && !newShopCategory) {
      setNewShopCategory(categories[0].id);
    }
  }, [categories, newShopCategory]);

  const handleCreateShop = async () => {
    if (!newShopName || !newOwnerEmail || !newShopCategory) {
      toast.error("Shop Name, Category, and Owner Email are required");
      return;
    }
    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("accessToken");
      
      let logoUrl: string | undefined;
      
      if (newShopLogo) {
        const formData = new FormData();
        formData.append("file", newShopLogo);
        
        const uploadRes = await fetch(`${API_URL}/upload/image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
        
        if (!uploadRes.ok) {
          throw new Error("Failed to upload logo");
        }
        
        const uploadData = await uploadRes.json();
        if (uploadData?.data?.url) {
          logoUrl = uploadData.data.url;
        }
      }

      const res = await fetch(`${API_URL}/admin/shops`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ 
          name: newShopName, 
          categoryId: newShopCategory, 
          city: newShopCity,
          state: newShopState,
          pincode: newShopPincode,
          address: newShopAddress,
          phone: newShopPhone,
          whatsapp: newShopWhatsapp,
          gstNumber: newShopGst,
          ownerEmail: newOwnerEmail,
          ownerName: newOwnerName,
          logoUrl
        })
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to create shop");
      }
      toast.success("Shop created successfully!");
      setAddOpen(false);
      
      setNewShopName("");
      setNewShopCategory(categories.length > 0 ? categories[0].id : "");
      setNewShopCity("");
      setNewShopState("");
      setNewShopPincode("");
      setNewShopAddress("");
      setNewShopPhone("");
      setNewShopWhatsapp("");
      setNewShopGst("");
      setNewOwnerEmail("");
      setNewOwnerName("");
      setNewShopLogo(null);
      if (newShopLogoPreview) URL.revokeObjectURL(newShopLogoPreview);
      setNewShopLogoPreview(null);
      
      mutate();
    } catch (e: any) {
      toast.error(e.message || "Failed to create shop");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setNewShopLogo(file);
      setNewShopLogoPreview(URL.createObjectURL(file));
    }
  };

  const removeLogo = () => {
    if (newShopLogoPreview) URL.revokeObjectURL(newShopLogoPreview);
    setNewShopLogo(null);
    setNewShopLogoPreview(null);
  };

  const handleEditStatus = async () => {
    try {
      if (!editShopId) return;
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/admin/shops/${editShopId}/verify`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isGstVerified: editStatus === "Active", isKycVerified: editStatus === "Active" })
      });
      if (res.ok) {
        setEditShopId(null);
        mutate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filtered = shops.filter((s: { name?: string; owner?: { name?: string; email?: string }; isKycVerified?: boolean; categoryId?: string; createdAt?: string }) => {
    let matchStatus = true;
    if (statusFilter === "VERIFIED") matchStatus = s.isKycVerified === true;
    if (statusFilter === "PENDING") matchStatus = s.isKycVerified === false;
    
    let matchCategory = true;
    if (categoryFilter !== "ALL") matchCategory = s.categoryId === categoryFilter;

    let matchDate = true;
    if (dateFilter !== "ALL" && s.createdAt) {
      const joinDate = new Date(s.createdAt);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - joinDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (dateFilter === "LAST_7_DAYS") matchDate = diffDays <= 7;
      if (dateFilter === "LAST_30_DAYS") matchDate = diffDays <= 30;
      if (dateFilter === "THIS_YEAR") matchDate = joinDate.getFullYear() === now.getFullYear();
    }

    if (!search) return matchStatus && matchCategory && matchDate;
    const searchLower = search.toLowerCase();
    const matchName = s.name?.toLowerCase().includes(searchLower) || false;
    const matchOwnerName = s.owner?.name?.toLowerCase().includes(searchLower) || false;
    return matchStatus && matchCategory && matchDate && (matchName || matchOwnerName);
  });

  const handleExportCSV = () => {
    if (filtered.length === 0) {
      toast.error("No data to export");
      return;
    }
    const headers = ["ID", "Shop Name", "Category", "City", "Status", "Owner Email", "Rating"];
    const rows = filtered.map((s: any) => [
      s.id,
      `"${s.name || ''}"`,
      `"${s.category || 'General'}"`,
      `"${s.city || ''}"`,
      s.isKycVerified ? "Verified" : "Pending",
      `"${s.owner?.email || ''}"`,
      s.averageRating || 0
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map((r: any) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "shops_export.csv");
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
          <h1 className={s.pageTitle}>Shop Management</h1>
          <p className={s.pageSubtitle}>Manage and oversee all registered local businesses.</p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button className={s.btnSecondary} id="shops-export" onClick={handleExportCSV}>
            Export CSV
          </button>
          <button className={s.btnPrimary} id="shops-add" onClick={() => setAddOpen(true)}>
            <Plus size={15} />
            Add Shop
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className={s.toolbar}>
        <div className={s.toolbarSearch}>
          <Search size={15} style={{ color: "var(--neutral-400)", flexShrink: 0 }} />
          <input
            id="shops-search"
            type="text"
            placeholder="Search by name or category..."
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
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
          </select>
          <select 
            className={s.toolbarFilter} 
            value={categoryFilter} 
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--neutral-300)", fontSize: "13px", background: "white", cursor: "pointer" }}
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
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
          <span className={s.cardTitle}>All Shops</span>
          <span style={{ fontSize: "12px", color: "var(--neutral-500)" }}>{filtered.length} results</span>
        </div>
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Shop</th>
                <th>Category</th>
                <th>City</th>
                <th>Rating</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((shop: { id: string; name: string; isActive: boolean; owner?: { name?: string; email?: string }; rating?: number; reviewCount?: number; isKycVerified?: boolean; isGstVerified?: boolean; createdAt: string; category?: string; city?: string; averageRating?: number; logoUrl?: string; [key: string]: any }) => (
                <tr 
                  key={shop.id} 
                  onClick={() => router.push(`/shops/${shop.id}`)}
                  style={{ cursor: "pointer" }}
                >
                  <td>
                    <div className={s.shopInfo}>
                      {shop.logoUrl ? (
                        <img src={shop.logoUrl} alt={shop.name} className={s.shopAvatar} />
                      ) : (
                        <div className={s.shopAvatarPlaceholder}>
                          {shop.name ? shop.name.charAt(0) : "S"}
                        </div>
                      )}
                      <div>
                        <div className={s.shopName}>{shop.name}</div>
                        <div className={s.shopMeta}>{shop.owner?.email || 'N/A'}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ color: "var(--neutral-600)" }}>{shop.category || 'General'}</td>
                  <td style={{ color: "var(--neutral-600)" }}>{shop.city || 'N/A'}</td>
                  <td style={{ fontWeight: 700, color: "var(--neutral-900)" }}>
                    {shop.averageRating ? `${shop.averageRating} Stars` : "No Ratings"}
                  </td>
                  <td>
                    <span className={`${s.statusBadge} ${shop.isKycVerified ? s.statusActive : s.statusPending}`}>
                      {shop.isKycVerified ? "Verified" : "Pending"}
                    </span>
                  </td>
                  <td>
                    <div className={s.actionBtns}>
                      <button 
                        className={s.actionBtn} 
                        title="View" 
                        id={`shop-view-${shop.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/shops/${shop.id}`);
                        }}
                      >
                        <Eye size={14} />
                      </button>
                      <button className={s.actionBtn} title="Edit" id={`shop-edit-${shop.id}`} onClick={(e) => { e.stopPropagation(); setEditShopId(shop.id); }}>
                        <Edit2 size={14} />
                      </button>
                      <button className={`${s.actionBtn} ${s.actionBtnDanger}`} title="Delete" id={`shop-delete-${shop.id}`} onClick={(e) => { e.stopPropagation(); setDeleteShopId(shop.id); }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className={s.emptyState}>
              <div className={s.emptyIcon}>
                <Store size={28} />
              </div>
              <div className={s.emptyTitle}>No shops found</div>
              <div className={s.emptyDesc}>Try adjusting your search or filter.</div>
            </div>
          )}
        </div>

        {/* Pagination */}
        <div className={s.pagination}>
          <span className={s.paginationMeta}>
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * meta.limit + 1}–{Math.min(currentPage * meta.limit, meta.total)} of {meta.total} shops
          </span>
          <div className={s.paginationBtns}>
            <button 
              className={s.pgBtn} 
              id="shops-prev" 
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
              id="shops-next" 
              onClick={() => setCurrentPage(p => Math.min(meta.totalPages, p + 1))}
              disabled={currentPage === meta.totalPages || meta.totalPages === 0}
              style={{ opacity: (currentPage === meta.totalPages || meta.totalPages === 0) ? 0.5 : 1, cursor: (currentPage === meta.totalPages || meta.totalPages === 0) ? 'not-allowed' : 'pointer' }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <Modal isOpen={isAddOpen} onClose={() => setAddOpen(false)} title="Add Shop">
        <div style={{ display: "flex", flexDirection: "column", gap: 16, maxHeight: "70vh", overflowY: "auto", paddingRight: 8 }}>
          <p style={{ color: "var(--neutral-500)", fontSize: 14, margin: 0 }}>Register a new local business manually.</p>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Shop Logo</label>
            <div style={{ display: "flex", gap: 12 }}>
              {newShopLogoPreview ? (
                <div style={{ position: "relative", width: 80, height: 80, borderRadius: 8, overflow: "hidden", border: "1px solid var(--neutral-200)" }}>
                  <img src={newShopLogoPreview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button 
                    onClick={removeLogo}
                    style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, background: "rgba(0,0,0,0.5)", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <label style={{ width: 80, height: 80, borderRadius: 8, border: "2px dashed var(--neutral-300)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--neutral-500)", cursor: "pointer", background: "var(--neutral-50)", transition: "all 0.2s" }}>
                  <Image size={20} style={{ marginBottom: 4 }} />
                  <span style={{ fontSize: 10, fontWeight: 600 }}>Upload</span>
                  <input type="file" accept="image/*" onChange={handleLogoSelect} style={{ display: "none" }} />
                </label>
              )}
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Shop Name *</label>
            <input type="text" placeholder="e.g. Sunrise Bakery" value={newShopName} onChange={e => setNewShopName(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Owner Email *</label>
            <input type="email" placeholder="e.g. owner@example.com" value={newOwnerEmail} onChange={e => setNewOwnerEmail(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Owner Name</label>
            <input type="text" placeholder="e.g. John Doe" value={newOwnerName} onChange={e => setNewOwnerName(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Category</label>
            <select value={newShopCategory} onChange={e => setNewShopCategory(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8, background: "white" }}>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>City</label>
            <input type="text" placeholder="e.g. San Francisco" value={newShopCity} onChange={e => setNewShopCity(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>State</label>
            <input type="text" placeholder="e.g. California" value={newShopState} onChange={e => setNewShopState(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Pincode</label>
            <input type="text" placeholder="e.g. 94105" value={newShopPincode} onChange={e => setNewShopPincode(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Address</label>
            <textarea placeholder="e.g. 123 Market St..." value={newShopAddress} onChange={e => setNewShopAddress(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8, resize: "vertical", minHeight: 60 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Phone Number</label>
            <input type="tel" placeholder="+1 234 567 890" value={newShopPhone} onChange={e => setNewShopPhone(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>WhatsApp Number</label>
            <input type="tel" placeholder="+1 234 567 890" value={newShopWhatsapp} onChange={e => setNewShopWhatsapp(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>GST Number</label>
            <input type="text" placeholder="e.g. 22AAAAA0000A1Z5" value={newShopGst} onChange={e => setNewShopGst(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button className={s.btnSecondary} onClick={() => setAddOpen(false)} disabled={isSubmitting}>Cancel</button>
            <button className={s.btnPrimary} onClick={handleCreateShop} disabled={isSubmitting}>{isSubmitting ? "Creating..." : "Create Shop"}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editShopId !== null} onClose={() => setEditShopId(null)} title="Edit Shop">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: "var(--neutral-500)", fontSize: 14, margin: 0 }}>Update shop details and status.</p>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Status</label>
            <select value={editStatus} onChange={e => setEditStatus(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8, background: "white" }}>
              <option value="Active">Active</option>
              <option value="Pending">Pending</option>
              <option value="Suspended">Suspended</option>
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button className={s.btnSecondary} onClick={() => setEditShopId(null)}>Cancel</button>
            <button className={s.btnPrimary} onClick={handleEditStatus}>Save Changes</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteShopId !== null} onClose={() => setDeleteShopId(null)} title="Delete Shop">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: "var(--neutral-700)", fontSize: 15, margin: 0 }}>Are you sure you want to delete this shop? All products, offers, and history will be lost. This cannot be undone.</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button className={s.btnSecondary} onClick={() => setDeleteShopId(null)}>Cancel</button>
            <button className={s.btnPrimary} style={{ background: "var(--red-600)" }} onClick={() => { setDeleteShopId(null); toast.success("Shop Deleted"); }}>Delete Shop</button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
