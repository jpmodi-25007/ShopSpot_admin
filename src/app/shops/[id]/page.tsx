"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout/AdminLayout";
import Modal from "@/components/Modal/Modal";
import {
  ChevronLeft, Edit2, Mail, ShieldOff, ShieldCheck, Star,
  MapPin, CheckCircle2, AlertTriangle, Plus, Search,
  Trash2, Image, X
} from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { API_URL } from "@/config/constants";
import toast from "react-hot-toast";
import s from "../../../components/AdminLayout/shared.module.css";
import { apiDelete, apiPatch, apiPost, authHeaders, messageFromBody } from "@/lib/api";
import { revalidateAdminSummary } from "@/lib/revalidate";

export default function ShopDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [isAddProductOpen, setAddProductOpen] = useState(false);
  const [editProductId, setEditProductId] = useState<string | null>(null);
  const [deleteProductId, setDeleteProductId] = useState<string | null>(null);
  const [isEditShopOpen, setEditShopOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [productSearch, setProductSearch] = useState("");

  const [newProductName, setNewProductName] = useState("");
  const [newProductCategory, setNewProductCategory] = useState("Electronics");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductImages, setNewProductImages] = useState<File[]>([]);
  const [newProductImagePreviews, setNewProductImagePreviews] = useState<string[]>([]);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);

  const [editProductName, setEditProductName] = useState("");
  const [editProductPrice, setEditProductPrice] = useState("");
  const [editProductActive, setEditProductActive] = useState(true);

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editCity, setEditCity] = useState("");

  const { data: shop, error, mutate } = useSWR(`${API_URL}/admin/shops/${id}`, fetcher);

  const handleAddProduct = async () => {
    if (!newProductName.trim() || !newProductPrice) {
      toast.error("Please fill all required fields");
      return;
    }
    try {
      setIsSubmittingProduct(true);
      if (newProductImages.length > 0) {
        // Images are accepted by the upload endpoint but CreateProductDto does not
        // currently persist them; upload is still attempted so failures surface early.
        const formData = new FormData();
        newProductImages.forEach((file) => formData.append("files", file));
        const uploadRes = await fetch(`${API_URL}/upload/images`, {
          method: "POST",
          headers: authHeaders(false),
          body: formData,
        });
        if (!uploadRes.ok) {
          const body = await uploadRes.json().catch(() => ({}));
          throw new Error(messageFromBody(body, "Failed to upload images"));
        }
      }

      await apiPost(`/admin/shops/${id}/products`, {
        name: newProductName.trim(),
        categoryName: newProductCategory,
        sellingPrice: parseFloat(newProductPrice),
      });
      toast.success("Product added successfully");
      setAddProductOpen(false);
      setNewProductName("");
      setNewProductPrice("");
      setNewProductImages([]);
      newProductImagePreviews.forEach((url) => URL.revokeObjectURL(url));
      setNewProductImagePreviews([]);
      mutate();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Failed to add product");
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files);
      const allowedSlots = 3 - newProductImages.length;
      if (allowedSlots <= 0) {
        toast.error("You can only upload up to 3 images");
        return;
      }
      const filesToAdd = filesArray.slice(0, allowedSlots);
      if (filesToAdd.length < filesArray.length) {
        toast.error(`Only ${allowedSlots} more image(s) allowed`);
      }
      setNewProductImages((prev) => [...prev, ...filesToAdd]);
      const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));
      setNewProductImagePreviews((prev) => [...prev, ...newPreviews]);
    }
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(newProductImagePreviews[index]);
    setNewProductImages((prev) => prev.filter((_, i) => i !== index));
    setNewProductImagePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveShop = async () => {
    if (!editName.trim() || !editAddress.trim()) {
      toast.error("Name and address are required");
      return;
    }
    setBusy(true);
    try {
      await apiPatch(`/admin/shops/${id}`, {
        name: editName.trim(),
        phone: editPhone,
        address: editAddress.trim(),
        city: editCity,
      });
      toast.success("Shop updated");
      setEditShopOpen(false);
      mutate();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleToggleSuspend = async () => {
    if (!shop) return;
    const next = shop.status === "SUSPENDED" ? "ACTIVE" : "SUSPENDED";
    setBusy(true);
    try {
      await apiPatch(`/admin/shops/${id}`, { status: next });
      toast.success(next === "SUSPENDED" ? "Shop suspended" : "Shop reactivated");
      mutate();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyShop = async () => {
    setBusy(true);
    try {
      await apiPost(`/admin/shops/${id}/verify`, { isGstVerified: true, isKycVerified: true });
      toast.success("Shop verified");
      await Promise.all([mutate(), revalidateAdminSummary()]);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleSaveProduct = async () => {
    if (!editProductId) return;
    if (!editProductName.trim()) {
      toast.error("Product name is required");
      return;
    }
    setBusy(true);
    try {
      await apiPatch(`/admin/products/${editProductId}`, {
        name: editProductName.trim(),
        sellingPrice: parseFloat(editProductPrice),
        isActive: editProductActive,
      });
      toast.success("Product updated");
      setEditProductId(null);
      mutate();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductId) return;
    setBusy(true);
    try {
      await apiDelete(`/admin/products/${deleteProductId}`);
      toast.success("Product deactivated");
      setDeleteProductId(null);
      mutate();
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const products = (shop?.products || []).filter((p: { name?: string }) => {
    if (!productSearch.trim()) return true;
    return (p.name || "").toLowerCase().includes(productSearch.trim().toLowerCase());
  });
  const verified = !!(shop?.isKycVerified && shop?.isGstVerified);

  return (
    <AdminLayout>
      {/* Top Navigation */}
      <div style={{ marginBottom: 24, display: "flex", alignItems: "center", gap: 8 }}>
        <button 
          onClick={() => router.push("/shops")}
          style={{ background: "none", border: "none", color: "var(--neutral-500)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 14 }}
        >
          <ChevronLeft size={16} />
          Back to Shops
        </button>
      </div>

      {error && (
        <div style={{ padding: 12, background: "#fef2f2", color: "#b91c1c", borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
          {(error as Error).message || "Failed to load shop"}
        </div>
      )}

      {/* Shop Profile Header */}
      <div className={s.card} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16, marginBottom: 24, padding: 24 }}>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {shop?.logoUrl ? (
            <img src={shop.logoUrl} alt={shop.name} style={{ width: 80, height: 80, borderRadius: 12, objectFit: "cover", border: "1px solid var(--neutral-300)" }} />
          ) : (
            <div 
              style={{ width: 80, height: 80, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--teal-50)", color: "var(--teal-700)", fontSize: 32, fontWeight: 700, border: "1px solid var(--neutral-300)" }} 
            >
              {shop?.name?.charAt(0) || "S"}
            </div>
          )}
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <h1 className={s.pageTitle} style={{ margin: 0 }}>{shop?.name || "Loading..."}</h1>
              {verified && (
                <span className={`${s.statusBadge} ${s.statusActive}`}>
                  <CheckCircle2 size={12} style={{ marginRight: 4 }} /> Verified
                </span>
              )}
            </div>
            <p style={{ color: "var(--neutral-500)", fontSize: 13, marginTop: 4, marginBottom: 8 }}>
              Owner: {shop?.owner?.name || "N/A"}
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              {shop?.category?.name && <span style={{ fontSize: 12, background: "var(--neutral-100)", padding: "4px 8px", borderRadius: 4, color: "var(--neutral-600)", fontWeight: 500 }}>{shop.category.name}</span>}
              <span style={{ fontSize: 12, background: "var(--teal-100)", padding: "4px 8px", borderRadius: 4, color: "var(--teal-700)", fontWeight: 500 }}>Shop</span>
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className={s.btnSecondary} onClick={() => {
              if (!shop) return;
              setEditName(shop.name || "");
              setEditPhone(shop.phone || "");
              setEditAddress(shop.address || "");
              setEditCity(shop.city || "");
              setEditShopOpen(true);
            }} disabled={!shop}>
            <Edit2 size={14} /> Edit Shop
          </button>
          {shop?.owner?.email ? (
            <a className={s.btnSecondary} href={`mailto:${shop.owner.email}`} style={{ textDecoration: "none" }}>
              <Mail size={14} /> Email Owner
            </a>
          ) : null}
          <button
            className={`${s.btnSecondary} ${s.btnDanger}`}
            style={{ borderColor: "var(--red-200)", color: "var(--red-600)", background: "var(--red-50)" }}
            onClick={handleToggleSuspend}
            disabled={busy || !shop}
          >
            {shop?.status === "SUSPENDED" ? <ShieldCheck size={14} /> : <ShieldOff size={14} />}
            {shop?.status === "SUSPENDED" ? "Reactivate" : "Suspend"}
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className={s.metricsGrid4}>
        <div className={s.card} style={{ padding: 24 }}>
          <div style={{ fontSize: 12, color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Total Revenue</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--neutral-900)" }}>
            ₹{shop?.orders?.reduce((acc: number, o: { total: string | number }) => acc + (parseFloat(String(o.total)) || 0), 0).toLocaleString() || 0}
          </div>
          <div style={{ fontSize: 12, color: "var(--teal-600)", marginTop: 4, display: "flex", alignItems: "center", gap: 4 }}>
            <span style={{ fontWeight: 600 }}>Lifetime</span>
          </div>
        </div>
        <div className={s.card} style={{ padding: 24 }}>
          <div style={{ fontSize: 12, color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Products</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--neutral-900)" }}>{shop?.products?.length || 0}</div>
          <div style={{ fontSize: 12, color: "var(--neutral-500)", marginTop: 4 }}>Total items</div>
        </div>
        <div className={s.card} style={{ padding: 24 }}>
          <div style={{ fontSize: 12, color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Orders</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--neutral-900)", display: "flex", alignItems: "center", gap: 8 }}>
            {shop?.orders?.length || 0}
          </div>
          <div style={{ fontSize: 12, color: "var(--neutral-500)", marginTop: 4 }}>Lifetime orders</div>
        </div>
        <div className={s.card} style={{ padding: 24 }}>
          <div style={{ fontSize: 12, color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 }}>Customer Rating</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--neutral-900)", display: "flex", alignItems: "center", gap: 8 }}>
            {shop?.rating || "0.0"}<span style={{ fontSize: 16, color: "var(--neutral-400)", fontWeight: 500 }}>/5.0</span>
            <Star size={20} style={{ color: "#F59E0B", fill: "#F59E0B" }} />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className={s.detailGrid2}>
        {/* Left Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Physical Location */}
          <div className={s.card} style={{ padding: 24 }}>
            <h3 className={s.cardTitle} style={{ marginBottom: 16 }}>Physical Location</h3>
            <div style={{ display: "flex", gap: 20 }}>
              <div style={{ width: "40%", height: 160, borderRadius: 8, backgroundColor: "var(--neutral-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <MapPin size={32} color="var(--neutral-400)" />
              </div>
              <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{ fontSize: 11, color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Full Address</div>
                  <div style={{ fontSize: 14, color: "var(--neutral-900)", fontWeight: 500, lineHeight: 1.5 }}>
                    {shop?.address || "No address provided"}
                  </div>
                </div>
                <div style={{ display: "flex", gap: 32 }}>
                  <div>
                    <div style={{ fontSize: 11, color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase", marginBottom: 4 }}>Contact</div>
                    <div style={{ fontSize: 13, color: "var(--neutral-900)" }}>{shop?.owner?.mobile || "No Phone"}</div>
                    <div style={{ fontSize: 13, color: "var(--neutral-600)" }}>{shop?.owner?.email || "No Email"}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Shop Inventory */}
          <div className={s.card} style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 className={s.cardTitle}>Shop Inventory</h3>
              <div style={{ display: "flex", gap: 12 }}>
                <div className={s.toolbarSearch} style={{ margin: 0, padding: "6px 12px", width: 200 }}>
                  <Search size={14} style={{ color: "var(--neutral-400)" }} />
                  <input type="text" placeholder="Search products..." className={s.toolbarSearchInput} style={{ fontSize: 13 }} value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
                </div>
                <button className={s.btnPrimary} style={{ padding: "6px 12px" }} onClick={() => setAddProductOpen(true)}>
                  <Plus size={14} /> Add New Product
                </button>
              </div>
            </div>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock Status</th>
                    <th>Views (30D)</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p: { id: string; name: string; sellingPrice: string | number; images: string[]; categoryId?: string; stock?: number; isActive?: boolean }) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                          {p.images && p.images[0] ? (
                            <img src={p.images[0]} alt={p.name} style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--neutral-100)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--neutral-400)", fontSize: 14, fontWeight: 700 }}>
                              {p.name[0]}
                            </div>
                          )}
                          <span style={{ fontWeight: 500, fontSize: 13, color: "var(--neutral-900)" }}>{p.name}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--neutral-600)" }}>{p.categoryId || "N/A"}</td>
                      <td style={{ fontWeight: 600, fontSize: 13, color: "var(--neutral-900)" }}>₹{parseFloat(String(p.sellingPrice)).toLocaleString()}</td>
                      <td>
                        <span className={`${s.statusBadge} ${p.stock && p.stock > 0 ? s.statusActive : s.statusInactive}`}>
                          {p.stock && p.stock > 0 ? `In Stock (${p.stock})` : 'Out of Stock'}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: "var(--neutral-600)" }}>-</td>
                      <td>
                        <div className={s.actionBtns}>
                          <button className={s.actionBtn} onClick={() => {
                              setEditProductName(p.name || "");
                              setEditProductPrice(String(p.sellingPrice ?? ""));
                              setEditProductActive(p.isActive !== false);
                              setEditProductId(p.id);
                            }}><Edit2 size={13} /></button>
                          <button className={`${s.actionBtn} ${s.actionBtnDanger}`} onClick={() => setDeleteProductId(p.id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!shop?.products?.length && (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "24px 0", color: "var(--neutral-500)" }}>
                        No products available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          {/* Verification & KYC */}
          <div className={s.card} style={{ padding: 24 }}>
            <h3 className={s.cardTitle} style={{ marginBottom: 16 }}>Verification & KYC</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--neutral-200)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: verified ? "var(--teal-50)" : "var(--amber-50)", color: verified ? "var(--teal-600)" : "var(--amber-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {verified ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--neutral-800)" }}>Shop Verification</span>
                </div>
                <span style={{ fontSize: 13, color: verified ? "var(--teal-600)" : "var(--amber-600)" }}>{verified ? 'Verified' : 'Pending'}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: shop?.gstNumber ? "var(--teal-50)" : "var(--neutral-50)", color: shop?.gstNumber ? "var(--teal-600)" : "var(--neutral-400)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    {shop?.gstNumber ? <CheckCircle2 size={16} /> : <ShieldOff size={16} />}
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--neutral-800)" }}>GST / Tax ID</span>
                </div>
                <span style={{ fontSize: 13, color: "var(--neutral-900)", fontWeight: 500, background: "var(--neutral-100)", padding: "4px 8px", borderRadius: 4 }}>
                  {shop?.gstNumber || 'Not Provided'}
                </span>
              </div>

            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal isOpen={isAddProductOpen} onClose={() => setAddProductOpen(false)} title="Add New Product">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Product Name</label>
            <input 
              type="text" 
              placeholder="e.g. Premium Headphones" 
              style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} 
              value={newProductName}
              onChange={e => setNewProductName(e.target.value)}
            />
          </div>
          <div className={s.formGrid2}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Category</label>
              <select 
                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }}
                value={newProductCategory}
                onChange={e => setNewProductCategory(e.target.value)}
              >
                <option value="Electronics">Electronics</option>
                <option value="Audio">Audio</option>
                <option value="Home">Home</option>
                <option value="Fashion">Fashion</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Price ($)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} 
                value={newProductPrice}
                onChange={e => setNewProductPrice(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Product Images (Max 3)</label>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              {newProductImagePreviews.map((preview, index) => (
                <div key={index} style={{ position: "relative", width: 80, height: 80, borderRadius: 8, overflow: "hidden", border: "1px solid var(--neutral-200)" }}>
                  <img src={preview} alt={`preview-${index}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button 
                    onClick={() => removeImage(index)}
                    style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, background: "rgba(0,0,0,0.5)", color: "white", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", border: "none", cursor: "pointer" }}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {newProductImages.length < 3 && (
                <label style={{ width: 80, height: 80, borderRadius: 8, border: "2px dashed var(--neutral-300)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "var(--neutral-500)", cursor: "pointer", background: "var(--neutral-50)", transition: "all 0.2s" }}>
                  <Image size={20} style={{ marginBottom: 4 }} />
                  <span style={{ fontSize: 10, fontWeight: 600 }}>Upload</span>
                  <input type="file" multiple accept="image/*" onChange={handleImageSelect} style={{ display: "none" }} />
                </label>
              )}
            </div>
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button className={s.btnSecondary} onClick={() => setAddProductOpen(false)} disabled={isSubmittingProduct}>Cancel</button>
            <button className={s.btnPrimary} onClick={handleAddProduct} disabled={isSubmittingProduct}>
              {isSubmittingProduct ? "Adding..." : "Add Product"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={editProductId !== null} onClose={() => setEditProductId(null)} title="Edit Product">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Product Name</label>
            <input type="text" value={editProductName} onChange={(e) => setEditProductName(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Selling Price (₹)</label>
            <input type="number" min={0} value={editProductPrice} onChange={(e) => setEditProductPrice(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--neutral-700)" }}>
            <input type="checkbox" checked={editProductActive} onChange={(e) => setEditProductActive(e.target.checked)} />
            Listed / active
          </label>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 16 }}>
            <button className={s.btnSecondary} onClick={() => setEditProductId(null)} disabled={busy}>Cancel</button>
            <button className={s.btnPrimary} onClick={handleSaveProduct} disabled={busy}>{busy ? "Saving..." : "Save Changes"}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={deleteProductId !== null} onClose={() => setDeleteProductId(null)} title="Deactivate Product" width={400}>
        <div style={{ display: "flex", flexDirection: "column", gap: 16, alignItems: "center", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--red-50)", color: "var(--red-600)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Trash2 size={24} />
          </div>
          <div>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--neutral-900)", marginBottom: 8 }}>Deactivate this product?</h3>
            <p style={{ color: "var(--neutral-500)", fontSize: 14, margin: 0 }}>It will be hidden from the catalogue. Existing orders are kept.</p>
          </div>
          <div style={{ display: "flex", width: "100%", gap: 12, marginTop: 8 }}>
            <button className={s.btnSecondary} style={{ flex: 1, justifyContent: "center" }} onClick={() => setDeleteProductId(null)} disabled={busy}>Cancel</button>
            <button className={`${s.btnSecondary} ${s.btnDanger}`} style={{ flex: 1, justifyContent: "center", background: "var(--red-600)", color: "white", border: "none" }} onClick={handleDeleteProduct} disabled={busy}>{busy ? "Working..." : "Yes, Deactivate"}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={isEditShopOpen} onClose={() => setEditShopOpen(false)} title="Edit Shop">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Shop Name</label>
            <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Phone</label>
            <input type="tel" value={editPhone} onChange={(e) => setEditPhone(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>Address</label>
            <textarea value={editAddress} onChange={(e) => setEditAddress(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8, minHeight: 72 }} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 8, display: "block" }}>City</label>
            <input type="text" value={editCity} onChange={(e) => setEditCity(e.target.value)} style={{ width: "100%", padding: "10px 12px", border: "1px solid var(--neutral-300)", borderRadius: 8 }} />
          </div>
          {!verified && (
            <button className={s.btnSecondary} onClick={handleVerifyShop} disabled={busy}>Mark KYC + GST verified</button>
          )}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 12, marginTop: 8 }}>
            <button className={s.btnSecondary} onClick={() => setEditShopOpen(false)} disabled={busy}>Cancel</button>
            <button className={s.btnPrimary} onClick={handleSaveShop} disabled={busy}>{busy ? "Saving..." : "Save Changes"}</button>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
