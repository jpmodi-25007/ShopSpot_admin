"use client";

import React, { useState, useEffect } from "react";
import AdminLayout from "@/components/AdminLayout/AdminLayout";
import { CreditCard, ShieldCheck } from "lucide-react";
import styles from "./settings.module.css";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { API_URL } from "@/config/constants";
import toast from "react-hot-toast";

export default function SettingsScreen() {
  const { data: initialSettings, error, mutate } = useSWR(`${API_URL}/admin/settings`, fetcher);
  
  const [settings, setSettings] = useState({
    subscriptionFee: 0,
    transactionFee: 5.0,
    require2FA: true,
    sessionTimeout: 120,
    paymentGateway: 'stripe_live',
    payoutSchedule: 'weekly'
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialSettings) {
      setSettings(initialSettings);
    }
  }, [initialSettings]);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/admin/settings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      if (!res.ok) throw new Error("Failed to save settings");
      mutate(settings);
      toast.success("Settings saved successfully");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (!initialSettings && !error) {
    return (
      <AdminLayout>
        <div style={{ padding: 40, textAlign: 'center' }}>Loading settings...</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className={styles.container}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>System Settings</h1>
            <p className={styles.subtitle}>Manage core platform configurations, fees, and security protocols.</p>
          </div>
          <button className={styles.btnPrimary} onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        <div className={styles.card}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <CreditCard size={20} className={styles.sectionIcon} />
              Platform Fees & Pricing
            </h3>
            
            <div className={styles.grid3}>
              <div className={styles.tierCard}>
                <div className={styles.tierHeader}>
                  <span className={styles.tierName}>Platform Fees</span>
                </div>
                
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Subscription Fee (Monthly)</label>
                  <div className={styles.inputWrapper}>
                    <span className={styles.prefix}>₹</span>
                    <input 
                      type="number" 
                      className={`${styles.input} ${styles.inputWithPrefix}`} 
                      value={settings.subscriptionFee} 
                      onChange={(e) => setSettings({...settings, subscriptionFee: parseFloat(e.target.value) || 0})}
                    />
                  </div>
                </div>
                
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Transaction Fee (%)</label>
                  <div className={styles.inputWrapper}>
                    <input 
                      type="number" 
                      step="0.1"
                      className={`${styles.input} ${styles.inputWithSuffix}`} 
                      value={settings.transactionFee} 
                      onChange={(e) => setSettings({...settings, transactionFee: parseFloat(e.target.value) || 0})}
                    />
                    <span className={styles.suffix}>%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className={styles.divider} />
          
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>
              <ShieldCheck size={20} className={styles.sectionIcon} />
              Authentication & Security
            </h3>
            
            <div className={styles.grid2}>
              <div>
                <h4 className={styles.label} style={{ marginBottom: '16px' }}>Session Management</h4>
                
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Idle Timeout</label>
                  <div className={styles.inputWrapper}>
                    <select 
                      className={styles.input} 
                      value={settings.sessionTimeout}
                      onChange={(e) => setSettings({...settings, sessionTimeout: parseInt(e.target.value, 10) || 120})}
                    >
                      <option value="15">15 Minutes</option>
                      <option value="30">30 Minutes</option>
                      <option value="60">1 Hour</option>
                      <option value="120">2 Hours</option>
                    </select>
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--neutral-500)', marginTop: '4px' }}>
                    Force logout after inactivity
                  </p>
                </div>

                <div className={styles.toggleWrapper} style={{ marginTop: '24px' }}>
                  <div className={styles.toggleLabel}>
                    <span className={styles.toggleTitle}>Require 2FA for Admins</span>
                    <span className={styles.toggleDesc}>Mandatory two-factor auth via SMS/Email</span>
                  </div>
                  <div 
                    className={`${styles.toggle} ${!settings.require2FA ? styles.off : ''}`}
                    onClick={() => setSettings({...settings, require2FA: !settings.require2FA})}
                  >
                    <div className={styles.toggleKnob}></div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className={styles.label} style={{ marginBottom: '16px' }}>Payment Gateway</h4>
                
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Active Gateway Provider</label>
                  <select 
                    className={styles.input}
                    value={settings.paymentGateway}
                    onChange={(e) => setSettings({...settings, paymentGateway: e.target.value})}
                  >
                    <option value="stripe_live">Stripe (Live)</option>
                    <option value="stripe_test">Stripe (Test)</option>
                    <option value="razorpay">Razorpay</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
                
                <div className={styles.inputGroup}>
                  <label className={styles.label}>Default Payout Schedule</label>
                  <select 
                    className={styles.input}
                    value={settings.payoutSchedule}
                    onChange={(e) => setSettings({...settings, payoutSchedule: e.target.value})}
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly (Monday)</option>
                    <option value="biweekly">Bi-weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
