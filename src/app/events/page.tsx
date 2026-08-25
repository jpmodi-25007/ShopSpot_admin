"use client";

import React, { useState } from "react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import AdminLayout from "@/components/AdminLayout/AdminLayout";
import Modal from "@/components/Modal/Modal";
import { Plus, Trash2, Edit2, Calendar } from "lucide-react";
import toast from "react-hot-toast";
import styles from "./events.module.css";
import { API_URL } from "@/config/constants";

export default function EventsPage() {
  const { data, error, mutate } = useSWR(`${API_URL}/events/all`, fetcher);
  const events = data?.data || [];

  const [isModalOpen, setModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setEditingId(null);
    setTitle("");
    setDescription("");
    setLocation("");
    setStartDate("");
    setEndDate("");
    setIsActive(true);
  };

  const handleOpenModal = (event?: any) => {
    resetForm();
    if (event) {
      setEditingId(event.id);
      setTitle(event.title || "");
      setDescription(event.description || "");
      setLocation(event.location || "");
      setStartDate(event.startDate ? new Date(event.startDate).toISOString().slice(0, 16) : "");
      setEndDate(event.endDate ? new Date(event.endDate).toISOString().slice(0, 16) : "");
      setIsActive(event.isActive ?? true);
    }
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !startDate || !endDate) {
      toast.error("Please fill in title and dates");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        title,
        description,
        location,
        startDate,
        endDate,
        isActive,
      };

      const res = await fetch(`${API_URL}/events${editingId ? `/${editingId}` : ''}`, {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.message || 'Failed to save event');
      }

      toast.success(editingId ? "Event updated" : "Event created");
      setModalOpen(false);
      mutate();
    } catch (err: any) {
      toast.error(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this event?")) return;
    
    try {
      const res = await fetch(`${API_URL}/events/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Delete failed");
      
      toast.success("Event deleted");
      mutate();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <AdminLayout>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Events Management</h1>
          <p className={styles.subtitle}>Manage local and global Findivo events</p>
        </div>
        <button onClick={() => handleOpenModal()} className={styles.addBtn}>
          <Plus size={18} /> Add Event
        </button>
      </div>

      <div className={styles.tableContainer}>
        {error && <div className="text-red-500 mb-4">Error loading events.</div>}
        
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Location</th>
              <th>Status</th>
              <th align="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {!events.length && (
              <tr>
                <td colSpan={5} className="text-center py-8 text-neutral-500">
                  No events found.
                </td>
              </tr>
            )}
            {events.map((event: any) => (
              <tr key={event.id}>
                <td>
                  <div className="font-medium text-neutral-900">{event.title}</div>
                </td>
                <td>
                  <div className="flex items-center gap-1.5 text-neutral-600">
                    <Calendar size={14} />
                    {new Date(event.startDate).toLocaleDateString()}
                  </div>
                </td>
                <td>{event.location || "-"}</td>
                <td>
                  <span className={event.isActive ? 'badge-success' : 'badge-error'}>
                    {event.isActive ? 'Active' : 'Draft'}
                  </span>
                </td>
                <td>
                  <div className={styles.actions}>
                    <button onClick={() => handleOpenModal(event)} className={styles.iconBtn}>
                      <Edit2 size={16} />
                    </button>
                    <button onClick={() => handleDelete(event.id)} className={`${styles.iconBtn} ${styles.danger}`}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setModalOpen(false)} title={editingId ? "Edit Event" : "Create Event"}>
        <form onSubmit={handleSubmit} className={styles.form}>
          
          <div className={styles.formGroup}>
            <label>Title</label>
            <input 
              type="text" 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              className={styles.input} 
              placeholder="Summer Expo" 
            />
          </div>

          <div className={styles.formGroup}>
            <label>Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              className={styles.input} 
              rows={3} 
            />
          </div>

          <div className={styles.formGroup}>
            <label>Location</label>
            <input 
              type="text" 
              value={location} 
              onChange={e => setLocation(e.target.value)} 
              className={styles.input} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className={styles.formGroup}>
              <label>Start Date</label>
              <input 
                type="datetime-local" 
                value={startDate} 
                onChange={e => setStartDate(e.target.value)} 
                className={styles.input} 
              />
            </div>
            
            <div className={styles.formGroup}>
              <label>End Date</label>
              <input 
                type="datetime-local" 
                value={endDate} 
                onChange={e => setEndDate(e.target.value)} 
                className={styles.input} 
              />
            </div>
          </div>

          <div className={styles.checkboxGroup}>
            <input 
              type="checkbox" 
              id="isActive" 
              checked={isActive} 
              onChange={e => setIsActive(e.target.checked)} 
            />
            <label htmlFor="isActive">Active (Visible in app)</label>
          </div>

          <div className={styles.modalActions}>
            <button type="button" onClick={() => setModalOpen(false)} className={styles.cancelBtn}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className={styles.submitBtn}>
              {isSubmitting ? "Saving..." : "Save Event"}
            </button>
          </div>
        </form>
      </Modal>
    </AdminLayout>
  );
}
