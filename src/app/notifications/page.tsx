"use client";

import React, { useState } from 'react';
import { Bell, ShieldCheck, UserPlus, AlertTriangle, ArrowUpRight } from 'lucide-react';
import sharedStyles from '../../components/AdminLayout/shared.module.css';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';
import { API_URL } from '@/config/constants';
import toast from 'react-hot-toast';

export default function NotificationsPage() {
  const { data: notificationsData, error, mutate } = useSWR(`${API_URL}/admin/notifications`, fetcher);
  const [isMarking, setIsMarking] = useState(false);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastData, setBroadcastData] = useState({ title: '', body: '', targetRole: 'ALL' });

  const handleMarkAllRead = async () => {
    if (!notificationsData?.length) return;
    try {
      setIsMarking(true);
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/admin/notifications/mark-read`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        }
      });
      if (!res.ok) throw new Error("Failed to mark notifications as read");
      mutate();
      toast.success("All notifications marked as read");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsMarking(false);
    }
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastData.title || !broadcastData.body) return toast.error("Title and body are required");
    try {
      setIsBroadcasting(true);
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/notifications/broadcast`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(broadcastData)
      });
      if (!res.ok) throw new Error("Failed to broadcast notification");
      toast.success("Notification broadcasted successfully!");
      setShowBroadcastModal(false);
      setBroadcastData({ title: '', body: '', targetRole: 'ALL' });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const notifications = notificationsData || [];

  return (
    <div className={sharedStyles.container}>
      <header className={sharedStyles.header}>
        <div className={sharedStyles.headerLeft}>
          <h1 className={sharedStyles.pageTitle}>Notifications</h1>
          <p className={sharedStyles.pageSubtitle}>Manage your system alerts and notifications</p>
        </div>
        <div className={sharedStyles.headerActions}>
          <button className={sharedStyles.secondaryBtn} onClick={() => setShowBroadcastModal(true)}>
            <Bell size={18} />
            <span>Broadcast</span>
          </button>
          <button className={sharedStyles.primaryBtn} onClick={handleMarkAllRead} disabled={isMarking}>
            <ShieldCheck size={18} />
            <span>{isMarking ? 'Marking...' : 'Mark All Read'}</span>
          </button>
        </div>
      </header>

      <div className={sharedStyles.card}>
        <div className={sharedStyles.cardHeader}>
          <h2 className={sharedStyles.cardTitle}>Recent Notifications</h2>
        </div>
        <div style={{ padding: '0 24px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '24px 0', textAlign: 'center', color: '#6B7280' }}>
                No notifications found.
              </div>
            ) : null}
            {notifications.map((notif: any) => (
              <div
                key={notif.id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  padding: '16px',
                  borderRadius: '12px',
                  backgroundColor: notif.isRead ? '#FFFFFF' : '#F9FAFB',
                  border: `1px solid ${notif.isRead ? '#F3F4F6' : '#E5E7EB'}`,
                  transition: 'all 0.2s',
                }}
              >
                <div
                  style={{
                    backgroundColor: notif.type === 'SYSTEM' ? '#FFF7ED' : '#F0FDFA',
                    padding: '12px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {notif.type === 'SYSTEM' ? <AlertTriangle size={20} color="#F97316" /> : <ShieldCheck size={20} color="#10B981" />}
                </div>
                <div style={{ marginLeft: '16px', flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <h4 style={{ margin: 0, fontSize: '15px', color: '#111827', fontWeight: 600 }}>
                      {notif.title}
                    </h4>
                    <span style={{ fontSize: '12px', color: '#6B7280' }}>
                      {new Date(notif.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p style={{ margin: 0, fontSize: '14px', color: '#4B5563', lineHeight: '1.5' }}>
                    {notif.body || notif.message}
                  </p>
                </div>
                {!notif.isRead && (
                  <div style={{ marginLeft: '16px', marginTop: '8px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#0F766E' }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {showBroadcastModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '12px', width: '400px', maxWidth: '90%' }}>
            <h2 style={{ marginTop: 0, marginBottom: '16px', fontSize: '18px', fontWeight: 600 }}>Broadcast Notification</h2>
            <form onSubmit={handleBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Target Audience</label>
                <select 
                  value={broadcastData.targetRole}
                  onChange={e => setBroadcastData(prev => ({ ...prev, targetRole: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                >
                  <option value="ALL">Everyone</option>
                  <option value="SHOPKEEPER">Shopkeepers</option>
                  <option value="CUSTOMER">Customers</option>
                  <option value="INFLUENCER">Influencers</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Title</label>
                <input 
                  required
                  type="text" 
                  value={broadcastData.title}
                  onChange={e => setBroadcastData(prev => ({ ...prev, title: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                  placeholder="Notification title..."
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Message Body</label>
                <textarea 
                  required
                  value={broadcastData.body}
                  onChange={e => setBroadcastData(prev => ({ ...prev, body: e.target.value }))}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB', minHeight: '100px' }}
                  placeholder="What do you want to say?"
                />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setShowBroadcastModal(false)} style={{ padding: '10px 16px', borderRadius: '8px', border: '1px solid #D1D5DB', backgroundColor: 'white', cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="submit" disabled={isBroadcasting} style={{ padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0F766E', color: 'white', cursor: 'pointer', fontWeight: 500 }}>
                  {isBroadcasting ? 'Sending...' : 'Send Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
