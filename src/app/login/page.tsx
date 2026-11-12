"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import styles from "./login.module.css";
import { API_URL } from "@/config/constants";
import { messageFromBody } from "@/lib/api";
import toast from "react-hot-toast";

export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot-password flow: "login" -> "request" (enter email) -> "reset" (code + new password)
  const [mode, setMode] = useState<"login" | "request" | "reset">("login");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");

  const post = async (path: string, body: unknown) => {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const fallback = res.status === 429 ? "Too many attempts. Please wait a minute and try again." : "Something went wrong";
      throw new Error(messageFromBody(data, fallback));
    }
    return data;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await post("/auth/login", { email: email.trim(), password, role: "ADMIN" });
      localStorage.setItem("accessToken", data.tokens.accessToken);
      if (data.tokens.refreshToken) localStorage.setItem("refreshToken", data.tokens.refreshToken);
      localStorage.setItem("userRole", data.user.role);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await post("/auth/forgot-password", { emailOrPhone: email.trim() });
      toast.success("If that account exists, a 6-digit code has been emailed.");
      setMode("reset");
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await post("/auth/reset-password", { emailOrPhone: email.trim(), code: code.trim(), newPassword });
      toast.success("Password updated. Please sign in.");
      setPassword("");
      setCode("");
      setNewPassword("");
      setMode("login");
    } catch (err: unknown) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.loginCard}>
        <div className={styles.logoContainer}>
          <Store size={48} className={styles.logoIcon} />
          <h1 className={styles.title}>Findivo Admin</h1>
          <p className={styles.subtitle}>Super Admin Portal</p>
        </div>

        {error && (
          <div style={{ padding: 12, background: '#fef2f2', color: '#b91c1c', borderRadius: 8, marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <form className={styles.form} onSubmit={mode === "login" ? handleLogin : mode === "request" ? handleRequestCode : handleReset}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <div className={styles.inputWrapper}>
              <Mail size={20} className={styles.inputIcon} />
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                required
              />
            </div>
          </div>

          {mode === "login" && (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={20} className={styles.inputIcon} />
                  <input
                    type={showPassword ? "text" : "password"}
                    className={styles.input}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className={styles.formOptions}>
                <span />
                <button
                  type="button"
                  className={styles.forgotLink}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  onClick={() => { setError(""); setMode("request"); }}
                >
                  Forgot Password?
                </button>
              </div>
            </>
          )}

          {mode === "reset" && (
            <>
              <div className={styles.inputGroup}>
                <label className={styles.label}>6-digit code</label>
                <div className={styles.inputWrapper}>
                  <ShieldCheck size={20} className={styles.inputIcon} />
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="\d{6}"
                    maxLength={6}
                    className={styles.input}
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    required
                  />
                </div>
              </div>
              <div className={styles.inputGroup}>
                <label className={styles.label}>New password</label>
                <div className={styles.inputWrapper}>
                  <Lock size={20} className={styles.inputIcon} />
                  <input
                    type="password"
                    className={styles.input}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    required
                  />
                </div>
              </div>
            </>
          )}

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading
              ? "Please wait..."
              : mode === "login" ? "Sign in" : mode === "request" ? "Send reset code" : "Update password"}
            <ArrowRight size={18} />
          </button>

          {mode !== "login" && (
            <button
              type="button"
              className={styles.forgotLink}
              style={{ background: "none", border: "none", cursor: "pointer", marginTop: 12, width: "100%", textAlign: "center" }}
              onClick={() => { setError(""); setMode("login"); }}
            >
              Back to sign in
            </button>
          )}
        </form>

        <div className={styles.footer}>
          <div className={styles.badge}>
            <ShieldCheck size={14} />
            Super User Access
          </div>
          <p className={styles.footerText}>
            Restricted to administrators. Unauthorized access is strictly prohibited.
          </p>
        </div>
      </div>
    </div>
  );
}
