"use client";

import React, { useState } from 'react';
import { Bell, ShieldCheck, UserPlus, AlertTriangle, ArrowUpRight, BellOff } from 'lucide-react';
import sharedStyles from '../../components/AdminLayout/shared.module.css';
import styles from './notifications.module.css';
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
          <p className={sharedStyles.pageSubtitle}>Manage your system alerts and broadcast messages across Findivo.</p>
        </div>
        <div className={sharedStyles.headerActions}>
          <button className={sharedStyles.secondaryBtn} onClick={() => setShowBroadcastModal(true)}>
            <Bell size={18} />
            <span>Broadcast</span>
          </button>
          <button className={sharedStyles.primaryBtn} onClick={handleMarkAllRead} disabled={isMarking || notifications.length === 0}>
            <ShieldCheck size={18} />
            <span>{isMarking ? 'Marking...' : 'Mark All Read'}</span>
          </button>
        </div>
      </header>

      <div className={styles.notificationsContainer}>
        {notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <BellOff size={32} />
            </div>
            <h3 className={styles.emptyTitle}>You're all caught up!</h3>
            <p className={styles.emptyDesc}>There are no new notifications at this time. Check back later for updates.</p>
          </div>
        ) : (
          <div className={styles.notificationList}>
            {notifications.map((notif: any, index: number) => (
              <div
                key={notif.id}
                className={`${styles.notificationCard} ${!notif.isRead ? styles.unread : ''}`}
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={`${styles.iconWrapper} ${notif.type === 'SYSTEM' ? styles.system : styles.success}`}>
                  {notif.type === 'SYSTEM' ? <AlertTriangle size={22} /> : <ShieldCheck size={22} />}
                </div>
                
                <div className={styles.contentWrapper}>
                  <div className={styles.headerRow}>
                    <h4 className={styles.title}>{notif.title}</h4>
                    <span className={styles.date}>
                      {new Date(notif.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <p className={styles.bodyText}>
                    {notif.body || notif.message}
                  </p>
                </div>

                {!notif.isRead && (
                  <div className={styles.unreadDot} />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showBroadcastModal && (
        <div className={styles.modalBackdrop}>
          <div className={styles.modalContent}>
            <h2 className={styles.modalTitle}>Broadcast Message</h2>
            <form onSubmit={handleBroadcast}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Target Audience</label>
                <select 
                  className={styles.formSelect}
                  value={broadcastData.targetRole}
                  onChange={e => setBroadcastData(prev => ({ ...prev, targetRole: e.target.value }))}
                >
                  <option value="ALL">Everyone on Findivo</option>
                  <option value="SHOPKEEPER">All Retailers</option>
                  <option value="CUSTOMER">All Customers</option>
                  <option value="INFLUENCER">All Influencers</option>
                </select>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Notification Title</label>
                <input 
                  required
                  type="text" 
                  className={styles.formInput}
                  value={broadcastData.title}
                  onChange={e => setBroadcastData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Scheduled Maintenance Update"
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Message Content</label>
                <textarea 
                  required
                  className={styles.formTextarea}
                  value={broadcastData.body}
                  onChange={e => setBroadcastData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Type the message you want to broadcast..."
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" onClick={() => setShowBroadcastModal(false)} className={styles.cancelBtn}>
                  Cancel
                </button>
                <button type="submit" disabled={isBroadcasting} className={styles.submitBtn}>
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
