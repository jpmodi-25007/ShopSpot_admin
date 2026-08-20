"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/AdminLayout/AdminLayout";
import {
  ChevronLeft, MapPin, ExternalLink, Image, Video,
  CheckCircle2, AlertTriangle, FileText, Check, MessageSquare, X
} from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/fetcher";
import { API_URL } from "@/config/constants";
import s from "../../../components/AdminLayout/shared.module.css";
import toast from "react-hot-toast";

export default function InfluencerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = React.use(params);
  const [isUpdating, setIsUpdating] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const { data: influencer, error, mutate } = useSWR(`${API_URL}/admin/influencers/${id}`, fetcher);

  const [status, setStatus] = useState("Pending Review");
  const [badgeClass, setBadgeClass] = useState(s.statusPending);

  const handleNotesSave = () => {
    toast.success("Admin notes saved successfully");
  };

  React.useEffect(() => {
    if (influencer?.verificationStatus) {
      if (influencer.verificationStatus === "VERIFIED") {
        setStatus("Verified");
        setBadgeClass(s.statusActive);
      } else if (influencer.verificationStatus === "REJECTED") {
        setStatus("Rejected");
        setBadgeClass(s.statusSuspended);
      } else {
        setStatus("Pending Review");
        setBadgeClass(s.statusPending);
      }
    }
  }, [influencer?.verificationStatus]);

  const handleVerify = async (newStatus: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      const res = await fetch(`${API_URL}/admin/influencers/${id}/verify`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        mutate();
        toast.success(`Application marked as ${newStatus}`);
      } else {
        const err = await res.json();
        toast.error(err.message || "Failed to update verification status");
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to update verification status");
      console.error(e);
    }
  };

  const handleApprove = () => handleVerify("VERIFIED");
  const handleReject = () => handleVerify("REJECTED");
  const handleRequestInfo = () => {
    setStatus("Info Requested");
    setBadgeClass(s.statusPending);
    // TODO: Send email endpoint integration
  };

  return (
    <AdminLayout>
      {/* Top Navigation */}
        <div className={s.pageHeader}>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button 
            onClick={() => router.push("/influencers")}
            style={{ background: "none", border: "none", color: "var(--neutral-500)", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, fontSize: 14, marginRight: 16 }}
          >
            <ChevronLeft size={16} />
            Back to Users
          </button>
          <h1 className={s.pageTitle} style={{ margin: 0 }}>Verification Approval</h1>
        </div>
        <span className={`${s.statusBadge} ${badgeClass}`}>
          {status}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr 300px", gap: 24 }}>
        
        {/* Left Panel: Profile */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className={s.card} style={{ textAlign: "center", padding: "32px 20px" }}>
            <div style={{ width: 100, height: 100, borderRadius: "50%", background: "var(--primary-100)", color: "var(--primary-600)", margin: "0 auto 16px auto", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 700, border: "2px solid var(--neutral-200)" }}>
              {influencer?.user?.name?.charAt(0) || "I"}
            </div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--neutral-900)", marginBottom: 4 }}>{influencer?.user?.name || "Loading..."}</h2>
            <div style={{ color: "var(--neutral-500)", fontSize: 14, marginBottom: 12 }}>{influencer?.socialPlatform} Handle</div>
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 6, color: "var(--neutral-500)", fontSize: 13, marginBottom: 24 }}>
              <MapPin size={14} /> Location Not Provided
            </div>
            <p style={{ fontSize: 14, color: "var(--neutral-700)", lineHeight: 1.6, textAlign: "center" }}>
              {influencer?.bio || "No bio provided."}
            </p>
          </div>

          <div className={s.card} style={{ padding: 24 }}>
            <h3 className={s.cardTitle} style={{ marginBottom: 16 }}>Linked Profiles</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {influencer?.instagramUrl && (
                <a href={influencer.instagramUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 8, background: "var(--neutral-50)", textDecoration: "none", color: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ background: "#E1306C15", color: "#E1306C", padding: 8, borderRadius: 8 }}>
                      <Image size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Instagram</div>
                      <div style={{ fontSize: 12, color: "var(--neutral-500)" }}>{influencer.followers?.toLocaleString() || "0"} Followers</div>
                    </div>
                  </div>
                  <ExternalLink size={14} color="var(--neutral-400)" />
                </a>
              )}
              {influencer?.youtubeUrl && (
                <a href={influencer.youtubeUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 8, background: "var(--neutral-50)", textDecoration: "none", color: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ background: "#FF000015", color: "#FF0000", padding: 8, borderRadius: 8 }}>
                      <Video size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>YouTube</div>
                      <div style={{ fontSize: 12, color: "var(--neutral-500)" }}>View Profile</div>
                    </div>
                  </div>
                  <ExternalLink size={14} color="var(--neutral-400)" />
                </a>
              )}
              {influencer?.facebookUrl && (
                <a href={influencer.facebookUrl} target="_blank" rel="noopener noreferrer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 12, borderRadius: 8, background: "var(--neutral-50)", textDecoration: "none", color: "inherit" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ background: "#1877F215", color: "#1877F2", padding: 8, borderRadius: 8 }}>
                      <Image size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600 }}>Facebook</div>
                      <div style={{ fontSize: 12, color: "var(--neutral-500)" }}>View Profile</div>
                    </div>
                  </div>
                  <ExternalLink size={14} color="var(--neutral-400)" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Center Panel: Verification */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className={s.card} style={{ padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 className={s.cardTitle}>Audience Verification</h3>
              <span style={{ fontSize: 12, color: "var(--neutral-500)" }}>API Sync: 2 hrs ago</span>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              {/* Followers Card */}
              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--neutral-200)", background: "var(--neutral-50)" }}>
                <div style={{ fontSize: 12, color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>Total Campaigns</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: "var(--neutral-900)" }}>{influencer?.assignments?.length || 0}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ display: "flex", alignItems: "center", gap: 4, color: "var(--teal-600)" }}><CheckCircle2 size={12} /> Platform Verified</span>
                </div>
              </div>

              {/* Engagement Card */}
              <div style={{ padding: 16, borderRadius: 12, border: "1px solid var(--neutral-200)", background: "var(--neutral-50)" }}>
                <div style={{ fontSize: 12, color: "var(--neutral-500)", fontWeight: 600, textTransform: "uppercase", marginBottom: 12 }}>Commission Rate</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 16 }}>
                  <span style={{ fontSize: 32, fontWeight: 700, color: "var(--neutral-900)" }}>{influencer?.commissionRate || 10}%</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span style={{ color: "var(--neutral-500)" }}>Standard Tier</span>
                </div>
              </div>
            </div>
          </div>

          <div className={s.card} style={{ padding: 24 }}>
            <h3 className={s.cardTitle} style={{ marginBottom: 16 }}>Submitted Proof</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
              <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--neutral-200)" }}>
                <img 
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=400&auto=format&fit=crop" 
                  alt="IG Insights" 
                  style={{ width: "100%", height: 160, objectFit: "cover" }}
                />
                <div style={{ padding: 12, background: "var(--white)", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--neutral-700)" }}>
                  <FileText size={16} color="var(--neutral-400)" /> IG_Insights_Oct.png
                </div>
              </div>
              <div style={{ borderRadius: 12, overflow: "hidden", border: "1px solid var(--neutral-200)" }}>
                <img 
                  src="https://images.unsplash.com/photo-1543286386-713bdd548da4?q=80&w=400&auto=format&fit=crop" 
                  alt="YT Demographics" 
                  style={{ width: "100%", height: 160, objectFit: "cover" }}
                />
                <div style={{ padding: 12, background: "var(--white)", display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--neutral-700)" }}>
                  <FileText size={16} color="var(--neutral-400)" /> YT_Demographics.pdf
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Panel: Decision */}
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div className={s.card} style={{ padding: 24 }}>
            <h3 className={s.cardTitle} style={{ marginBottom: 16 }}>Decision Panel</h3>
            
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "var(--neutral-600)" }}>Admin Notes (Internal)</span>
                <button 
                  onClick={handleNotesSave}
                  style={{ fontSize: 11, background: "none", border: "none", color: "var(--primary-600)", fontWeight: 600, cursor: "pointer" }}>
                  Save
                </button>
              </div>
              <textarea 
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Add observations about engagement discrepancy..." 
                style={{ width: "100%", height: 100, padding: 12, borderRadius: 8, border: "1px solid var(--neutral-300)", resize: "none", fontSize: 13, fontFamily: "inherit" }}
              />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <button className={s.btnPrimary} style={{ width: "100%", padding: "10px", justifyContent: "center" }} onClick={handleApprove}>
                <Check size={16} /> Approve Verification
              </button>
              <button className={s.btnSecondary} style={{ width: "100%", padding: "10px", justifyContent: "center" }} onClick={handleRequestInfo}>
                <MessageSquare size={16} /> Request More Info
              </button>
              <button className={`${s.btnSecondary} ${s.btnDanger}`} style={{ width: "100%", padding: "10px", justifyContent: "center" }} onClick={handleReject}>
                <X size={16} /> Reject Application
              </button>
            </div>
          </div>

          <div className={s.card} style={{ padding: 24 }}>
            <h3 className={s.cardTitle} style={{ marginBottom: 16 }}>Application History</h3>
            
            <div style={{ position: "relative", paddingLeft: 20, display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ position: "absolute", left: 7, top: 8, bottom: 8, width: 2, background: "var(--neutral-200)", zIndex: 0 }}></div>
              
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ position: "absolute", left: -20, top: 2, width: 16, height: 16, borderRadius: "50%", background: "var(--white)", border: "4px solid var(--amber-500)" }}></div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-900)", marginBottom: 4 }}>Under Review</div>
                <div style={{ fontSize: 12, color: "var(--neutral-500)" }}>Today, 09:42 AM</div>
              </div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ position: "absolute", left: -20, top: 2, width: 16, height: 16, borderRadius: "50%", background: "var(--white)", border: "4px solid var(--neutral-300)" }}></div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 4 }}>API Data Synced</div>
                <div style={{ fontSize: 12, color: "var(--neutral-500)" }}>Today, 09:40 AM</div>
              </div>

              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ position: "absolute", left: -20, top: 2, width: 16, height: 16, borderRadius: "50%", background: "var(--white)", border: "4px solid var(--neutral-300)" }}></div>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--neutral-700)", marginBottom: 4 }}>Application Submitted</div>
                <div style={{ fontSize: 12, color: "var(--neutral-500)" }}>Yesterday, 14:20 PM</div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
