"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import AdminLayout from "@/components/AdminLayout/AdminLayout";
import Modal from "@/components/Modal/Modal";
import { Plus, Trash2, Edit2, Image as ImageIcon, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./promotions.module.css";
import { API_URL } from "@/config/constants";

export default function PromotionsPage() {
  const { data, error, mutate } = useSWR(`${API_URL}/promotions/all`, fetcher);
  const banners = data?.data || [];

  const [isModalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [shopId, setShopId] = useState("");
  const [productId, setProductId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [displayOrder, setDisplayOrder] = useState("0");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setShopId("");
    setProductId("");
    setStartDate("");
    setEndDate("");
    setIsActive(true);
    setDisplayOrder("0");
    setImageFile(null);
    setImagePreview(null);
  };

  const handleOpenAdd = () => {
    resetForm();
    setModalOpen(true);
  };

  const handleOpenEdit = (banner: any) => {
    resetForm();
    setEditingId(banner.id);
    setTitle(banner.title || "");
    setShopId(banner.shopId || "");
    setProductId(banner.productId || "");
    setStartDate(banner.startDate ? new Date(banner.startDate).toISOString().split('T')[0] : "");
    setEndDate(banner.endDate ? new Date(banner.endDate).toISOString().split('T')[0] : "");
    setIsActive(banner.isActive);
    setDisplayOrder(banner.displayOrder.toString());
    setImagePreview(banner.imageUrl);
    setModalOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePreview && !imageFile) {
      toast.error("Please upload an image for the banner");
      return;
    }

    try {
      setIsSubmitting(true);
      const token = localStorage.getItem("accessToken");
      let imageUrl = imagePreview; // use existing if editing and no new file

      // Upload new image if selected
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        
        const uploadRes = await fetch(`${API_URL}/upload/image`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`
          },
          body: formData
        });
        
        if (!uploadRes.ok) {
          throw new Error("Failed to upload image");
        }
        
        const uploadData = await uploadRes.json();
        if (uploadData?.data?.url) {
          imageUrl = uploadData.data.url;
        } else {
          throw new Error("Invalid image upload response");
        }
      }

      const payload = {
        title,
        imageUrl,
        shopId: shopId || null,
        productId: productId || null,
        startDate: startDate ? new Date(startDate).toISOString() : null,
        endDate: endDate ? new Date(endDate).toISOString() : null,
        isActive,
        displayOrder: parseInt(displayOrder, 10) || 0
      };

      const url = editingId 
        ? `${API_URL}/promotions/${editingId}` 
        : `${API_URL}/promotions`;
        
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to save promotion banner");
      }

      toast.success(`Banner ${editingId ? 'updated' : 'created'} successfully`);
      setModalOpen(false);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Something went wrong");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this banner?")) return;

    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/promotions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!res.ok) throw new Error("Failed to delete banner");
      toast.success("Banner deleted");
      mutate();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete banner");
    }
  };

  return (
    <AdminLayout>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Promotions & Banners</h1>
          <p className={styles.subtitle}>Manage dynamic dashboard banners (Up to 5 active recommended)</p>
        </div>
        <button className={styles.addBtn} onClick={handleOpenAdd}>
          <Plus size={18} />
          Add Banner
        </button>
      </div>

      {error ? (
        <div style={{ color: "red" }}>Failed to load promotions.</div>
      ) : !data ? (
        <div>Loading banners...</div>
      ) : (
        <div className={styles.grid}>
          {banners.map((banner: any) => (
            <div key={banner.id} className={styles.card}>
              <div className={styles.imageContainer}>
                <img src={banner.imageUrl} alt={banner.title} className={styles.image} />
                <div className={`${styles.statusBadge} ${banner.isActive ? styles.active : styles.inactive}`}>
                  {banner.isActive ? "Active" : "Inactive"}
                </div>
              </div>
              <div className={styles.details}>
                <div className={styles.detailsTitle}>{banner.title || "Untitled Banner"}</div>
                
                {banner.shopId && (
                  <div className={styles.detailRow}>
                    <strong>Shop ID:</strong> {banner.shopId}
                  </div>
                )}
                {banner.productId && (
                  <div className={styles.detailRow}>
                    <strong>Product ID:</strong> {banner.productId}
                  </div>
                )}
                
                <div className={styles.detailRow}>
                  <Calendar size={14} />
                  <span>
                    {banner.startDate ? new Date(banner.startDate).toLocaleDateString() : "Always"} 
                    {" - "} 
                    {banner.endDate ? new Date(banner.endDate).toLocaleDateString() : "Forever"}
                  </span>
                </div>
                <div className={styles.detailRow}>
                  <strong>Order:</strong> {banner.displayOrder}
                </div>

                <div className={styles.actions}>
                  <button className={styles.actionBtn} onClick={() => handleOpenEdit(banner)}>
                    <Edit2 size={16} />
                  </button>
                  <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={() => handleDelete(banner.id)}>
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {banners.length === 0 && (
            <div style={{ color: "#666", padding: "20px" }}>No promotional banners found.</div>
          )}
        </div>
      )}

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => !isSubmitting && setModalOpen(false)}
          title={editingId ? "Edit Banner" : "Create New Banner"}
        >
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label>Banner Image *</label>
              <input
                type="file"
                accept="image/*"
                id="bannerImage"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />
              <label htmlFor="bannerImage" className={styles.imageUpload} style={{ display: 'block' }}>
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className={styles.imagePreview} />
                ) : (
                  <div>
                    <ImageIcon size={32} color="#9ca3af" style={{ margin: "0 auto 8px" }} />
                    <p style={{ color: "#6b7280", fontSize: 14 }}>Click to upload image (16:9 recommended)</p>
                  </div>
                )}
              </label>
            </div>

            <div className={styles.formGroup}>
              <label>Internal Title</label>
              <input
                type="text"
                className={styles.input}
                placeholder="e.g. Summer Sale 2026"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Shop ID (Optional)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Paste Shop UUID"
                  value={shopId}
                  onChange={(e) => setShopId(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>Product ID (Optional)</label>
                <input
                  type="text"
                  className={styles.input}
                  placeholder="Paste Product UUID"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Start Date</label>
                <input
                  type="date"
                  className={styles.input}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className={styles.formGroup}>
                <label>End Date</label>
                <input
                  type="date"
                  className={styles.input}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.formGroup}>
                <label>Display Order</label>
                <input
                  type="number"
                  className={styles.input}
                  min="0"
                  value={displayOrder}
                  onChange={(e) => setDisplayOrder(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  className={styles.checkbox}
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                />
                Active (Show to users)
              </label>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "24px" }}>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className={styles.addBtn}
                style={{ background: "#fff", color: "#000", border: "1px solid #d1d5db" }}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.addBtn}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Saving..." : "Save Banner"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminLayout>
  );
}
