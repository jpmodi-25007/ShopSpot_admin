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

  const notifications = notificationsData || [];

  return (
    <div className={sharedStyles.container}>
      <header className={sharedStyles.header}>
        <div className={sharedStyles.headerLeft}>
          <h1 className={sharedStyles.pageTitle}>Notifications</h1>
          <p className={sharedStyles.pageSubtitle}>Manage your system alerts and notifications</p>
        </div>
        <div className={sharedStyles.headerActions}>
          <button className={sharedStyles.primaryBtn} onClick={handleMarkAllRead} disabled={isMarking}>
            <Bell size={18} />
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
    </div>
  );
}
