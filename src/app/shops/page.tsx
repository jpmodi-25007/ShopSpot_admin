/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import AdminLayout from "@/components/AdminLayout/AdminLayout";
import Modal from "@/components/Modal/Modal";
import {
  Store, Plus, Search, Eye, ChevronLeft, ChevronRight, Edit2, Trash2,
  Image, X
} from "lucide-react";
import toast from "react-hot-toast";
import s from "../../components/AdminLayout/shared.module.css";
import { API_URL } from "@/config/constants";
import { apiDelete, apiPatch, apiPost, authHeaders, buildQuery, createdFromFor, fetchAllPages, messageFromBody } from "@/lib/api";
import { downloadCsv } from "@/lib/csv";
import { useDebounce } from "@/lib/useDebounce";
import { revalidateAdminSummary } from "@/lib/revalidate";

function statusClass(status: string) {
  if (status === "Active") return s.statusActive;
  if (status === "Pending") return s.statusPending;
  if (status === "Suspended") return s.statusSuspended;
  return s.statusInactive;
}

export default function ShopsPage() {
  const router = useRouter();
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const debouncedSearch = useDebounce(search.trim(), 350);

  const query = buildQuery({
    page: currentPage,
    limit: 50,
    search: debouncedSearch || undefined,
    status: statusFilter,
    categoryId: categoryFilter,
    createdFrom: createdFromFor(dateFilter),
  });
  const { data, error, mutate, isLoading } = useSWR(`${API_URL}/admin/shops${query}`, fetcher);
  const { data: categoriesData } = useSWR(`${API_URL}/categories`, fetcher);

  const shops = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: 50, totalPages: 1 };
  const categories = Array.isArray(categoriesData) ? categoriesData : (categoriesData?.data || []);

  const [isAddOpen, setAddOpen] = useState(false);
  const [editShopId, setEditShopId] = useState<string | null>(null);
  const [deleteShopId, setDeleteShopId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [editStatus, setEditStatus] = useState("ACTIVE");

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


  const resetCreate = () => {
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
  };

  const handleCreateShop = async () => {
    if (!newShopName.trim() || !newOwnerEmail.trim() || !newShopCategory) {
      toast.error("Shop Name, Category, and Owner Email are required");
      return;
    }
    try {
      setIsSubmitting(true);
      let logoUrl: string | undefined;
      if (newShopLogo) {
        const formData = new FormData();
        formData.append("file", newShopLogo);
        const uploadRes = await fetch(`${API_URL}/upload/image`, {
          method: "POST",
          headers: authHeaders(false),
          body: formData,
        });
        const uploadData = await uploadRes.json().catch(() => ({}));
        if (!uploadRes.ok) throw new Error(messageFromBody(uploadData, "Failed to upload logo"));
        logoUrl = uploadData?.data?.url;
      }

      await apiPost("/admin/shops", {
        name: newShopName.trim(),
        categoryId: newShopCategory,
        city: newShopCity.trim() || undefined,
        state: newShopState.trim() || undefined,
        pincode: newShopPincode.trim() || undefined,
        address: newShopAddress.trim() || undefined,
        phone: newShopPhone.trim() || undefined,
        whatsapp: newShopWhatsapp.trim() || undefined,
        gstNumber: newShopGst.trim() || undefined,
        ownerEmail: newOwnerEmail.trim(),
        ownerName: newOwnerName.trim() || undefined,
        logoUrl,
      });
      toast.success("Shop created successfully");
      setAddOpen(false);
      resetCreate();
      await Promise.all([mutate(), revalidateAdminSummary()]);
    } catch (e: unknown) {
      toast.error((e as Error).message || "Failed to create shop");
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

  const openEdit = (shop: { id: string; status?: string; isKycVerified?: boolean }) => {
    setEditShopId(shop.id);
    if (shop.status === "SUSPENDED") setEditStatus("SUSPENDED");
    else if (shop.status === "INACTIVE") setEditStatus("INACTIVE");
    else if (shop.isKycVerified) setEditStatus("VERIFIED");
    else setEditStatus("PENDING");
  };

  const handleEditStatus = async () => {
    if (!editShopId) return;
    setBusy(true);
    try {
      const body: Record<string, unknown> = {};
      if (editStatus === "VERIFIED") {
        body.status = "ACTIVE";
        body.isKycVerified = true;
        body.isGstVerified = true;
      } else if (editStatus === "PENDING") {
        body.status = "ACTIVE";
        body.isKycVerified = false;
        body.isGstVerified = false;
      } else {
        body.status = editStatus; // ACTIVE | INACTIVE | SUSPENDED
      }
      await apiPatch(`/admin/shops/${editShopId}`, body);
      toast.success("Shop updated");
      setEditShopId(null);
      await Promise.all([mutate(), revalidateAdminSummary()]);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteShopId) return;
    setBusy(true);
    try {
      await apiDelete(`/admin/shops/${deleteShopId}`);
      toast.success("Shop deleted");
      setDeleteShopId(null);
      await Promise.all([mutate(), revalidateAdminSummary()]);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleExportCSV = async () => {
    try {
      toast.loading("Preparing export...", { id: "shops-export" });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rows = await fetchAllPages<any>("/admin/shops", {
        search: debouncedSearch || undefined,
        status: statusFilter,
        categoryId: categoryFilter,
        createdFrom: createdFromFor(dateFilter),
      });
      if (rows.length === 0) {
        toast.error("No data to export", { id: "shops-export" });
        return;
      }
      downloadCsv(
        "shops_export.csv",
        ["ID", "Shop Name", "Category", "City", "Status", "Owner Email", "Rating"],
        rows.map((sh) => [
          sh.id,
          sh.name || "",
          (sh.category as { name?: string } | undefined)?.name || "General",
          sh.city || "",
          sh.status === "SUSPENDED" ? "Suspended" : sh.isKycVerified ? "Verified" : "Pending",
          (sh.owner as { email?: string } | undefined)?.email || "",
          sh.rating ?? 0,
        ]),
      );
      toast.success(`Exported ${rows.length} shops`, { id: "shops-export" });
    } catch (e: unknown) {
      toast.error((e as Error).message || "Export failed", { id: "shops-export" });
    }
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
          <button className={s.btnPrimary} id="shops-add" onClick={() => { if (!newShopCategory && categories[0]?.id) setNewShopCategory(categories[0].id); setAddOpen(true); }}>
            <Plus size={15} />
            Add Shop
          </button>
        </div>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#fef2f2", color: "#b91c1c", borderRadius: 8, marginBottom: 12, fontSize: 14 }}>
          {(error as Error).message || "Failed to load shops"}
        </div>
      )}

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
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
          />
        </div>
        <div className={s.toolbarActions}>
          <select 
            className={s.toolbarFilter} 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--neutral-300)", fontSize: "13px", background: "white", cursor: "pointer" }}
          >
            <option value="ALL">All Status</option>
            <option value="VERIFIED">Verified</option>
            <option value="PENDING">Pending</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="INACTIVE">Inactive</option>
          </select>
          <select 
            className={s.toolbarFilter} 
            value={categoryFilter} 
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            style={{ padding: "6px 12px", borderRadius: "6px", border: "1px solid var(--neutral-300)", fontSize: "13px", background: "white", cursor: "pointer" }}
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat: { id: string; name: string }) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
          <select 
            className={s.toolbarFilter} 
            value={dateFilter} 
            onChange={(e) => { setDateFilter(e.target.value); setCurrentPage(1); }}
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
          <span style={{ fontSize: "12px", color: "var(--neutral-500)" }}>{meta.total} results</span>
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
              {shops.map((shop: {
                  id: string; name: string; logoUrl?: string; city?: string; rating?: number | string; status?: string; isKycVerified?: boolean; owner?: { email?: string }; category?: { name?: string } | string;
                }) => (
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
                  <td style={{ color: "var(--neutral-600)" }}>{(typeof shop.category === 'object' && shop.category?.name) || (typeof shop.category === 'string' ? shop.category : 'General')}</td>
                  <td style={{ color: "var(--neutral-600)" }}>{shop.city || 'N/A'}</td>
                  <td style={{ fontWeight: 700, color: "var(--neutral-900)" }}>
                    {shop.rating ? `${Number(shop.rating).toFixed(1)} Stars` : "No Ratings"}
                  </td>
                  <td>
                    <span className={`${s.statusBadge} ${shop.status === "SUSPENDED" || shop.status === "INACTIVE" ? s.statusSuspended : shop.isKycVerified ? s.statusActive : s.statusPending}`}>
                      {shop.status === "SUSPENDED" ? "Suspended" : shop.status === "INACTIVE" ? "Inactive" : shop.isKycVerified ? "Verified" : "Pending"}
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
                      <button className={s.actionBtn} title="Edit" id={`shop-edit-${shop.id}`} onClick={(e) => { e.stopPropagation(); openEdit(shop); }}>
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

          {!isLoading && shops.length === 0 && (
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
            Showing {shops.length === 0 ? 0 : (currentPage - 1) * meta.limit + 1}–{Math.min(currentPage * meta.limit, meta.total)} of {meta.total} shops
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
              {categories.map((cat: { id: string; name: string }) => (
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
              <option value="VERIFIED">Verified (KYC + GST)</option>
              <option value="PENDING">Pending verification</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="SUSPENDED">Suspended</option>
            </select>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button className={s.btnSecondary} onClick={() => setEditShopId(null)} disabled={busy}>Cancel</button>
            <button className={s.btnPrimary} onClick={handleEditStatus} disabled={busy}>{busy ? "Saving..." : "Save Changes"}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteShopId !== null} onClose={() => setDeleteShopId(null)} title="Delete Shop">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ color: "var(--neutral-700)", fontSize: 15, margin: 0 }}>Delete this shop only if it has no orders, reservations, negotiations or reviews. Otherwise suspend it instead. This cannot be undone.</p>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button className={s.btnSecondary} onClick={() => setDeleteShopId(null)} disabled={busy}>Cancel</button>
            <button className={s.btnPrimary} style={{ background: "var(--red-600)" }} onClick={handleDelete} disabled={busy}>{busy ? "Deleting..." : "Delete Shop"}</button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
