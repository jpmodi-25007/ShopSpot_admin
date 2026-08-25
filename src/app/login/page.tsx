"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, Mail, Lock, Eye, EyeOff, ArrowRight, ShieldCheck } from "lucide-react";
import styles from "./login.module.css";
import { API_URL } from "@/config/constants";

export default function LoginScreen() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("admin@findivo.com");
  const [password, setPassword] = useState("password");

  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        throw new Error("Invalid credentials");
      }
      const data = await res.json();
      localStorage.setItem("accessToken", data.tokens.accessToken);
      localStorage.setItem("userRole", data.user.role);
      router.push("/dashboard");
    } catch (err: unknown) {
      setError((err as Error).message);
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

        <form className={styles.form} onSubmit={handleLogin}>
          <div className={styles.inputGroup}>
            <label className={styles.label}>Email Address</label>
            <div className={styles.inputWrapper}>
              <Mail size={20} className={styles.inputIcon} />
              <input
                type="email"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@findivo.com"
                required
              />
            </div>
          </div>

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
            <label className={styles.checkboxLabel}>
              <input type="checkbox" className={styles.checkbox} />
              Stay logged in
            </label>
            <a href="#" className={styles.forgotLink}>
              Forgot Password?
            </a>
          </div>

          <button type="submit" className={styles.submitBtn}>
            Sign in
            <ArrowRight size={18} />
          </button>
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
