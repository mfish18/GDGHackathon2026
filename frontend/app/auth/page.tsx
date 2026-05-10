"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/authContext";

type Tab = "login" | "register";

const STRENGTH_COLORS: Record<string, string> = {
  Weak: "text-rose-400",
  Fair: "text-amber-400",
  Good: "text-emerald-400",
  Strong: "text-emerald-300",
};

function passwordStrength(pw: string): { bars: number; label: string } {
  if (!pw) return { bars: 0, label: "" };
  if (pw.length < 6) return { bars: 1, label: "Weak" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (score <= 1) return { bars: 1, label: "Weak" };
  if (score === 2) return { bars: 2, label: "Fair" };
  if (score === 3) return { bars: 3, label: "Good" };
  return { bars: 4, label: "Strong" };
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const { bars, label } = passwordStrength(password);
  if (!password) return null;
  return (
    <div className="pw-strength">
      <div className="pw-strength__bars">
        {[1, 2, 3, 4].map(n => (
          <div key={n} className={`pw-strength__bar${n <= bars ? ` pw-bar--${label.toLowerCase()}` : ""}`} />
        ))}
      </div>
      <span className={`pw-strength__label ${STRENGTH_COLORS[label] ?? ""}`}>{label}</span>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

export default function AuthPage() {
  const router = useRouter();
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, user, loading, forgotPassword } = useAuth();

  const [tab, setTab] = useState<Tab>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  useEffect(() => {
    if (!loading && user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  function friendlyError(code: string): string {
    switch (code) {
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password.";
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/weak-password":
        return "Password must be at least 6 characters.";
      case "auth/invalid-email":
        return "Please enter a valid email address.";
      case "auth/popup-closed-by-user":
        return "Sign-in popup was closed. Try again.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      if (tab === "login") {
        await signInWithEmail(email, password);
      } else {
        if (!displayName.trim()) { setError("Please enter your name."); setBusy(false); return; }
        if (password !== confirmPassword) { setError("Passwords do not match."); setBusy(false); return; }
        await signUpWithEmail(email, password, displayName.trim());
      }
      router.replace("/");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(friendlyError(code));
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
      router.replace("/");
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? "";
      setError(friendlyError(code));
    } finally {
      setBusy(false);
    }
  }

  function handleForgotPassword() {
    setError(null);
    setResetEmail("");
    setShowResetModal(true);
  }

  return (
    <main className="page--centered">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Header */}
        <div className="auth-header">
          <h1 className="auth-title">Travel DNA</h1>
          <p className="auth-subtitle">Discover your travel personality</p>
        </div>

        {/* Tab switcher */}
        <div className="auth-tabs">
          <button
            className={`auth-tab${tab === "login" ? " auth-tab--active" : ""}`}
            onClick={() => { setTab("login"); setError(null); }}
          >
            Sign in
          </button>
          <button
            className={`auth-tab${tab === "register" ? " auth-tab--active" : ""}`}
            onClick={() => { setTab("register"); setError(null); }}
          >
            Create account
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form">
          <AnimatePresence mode="wait">
            {tab === "register" && (
              <motion.div
                key="name-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="auth-field">
                  <label className="auth-label" htmlFor="displayName">Name</label>
                  <input
                    id="displayName"
                    type="text"
                    className="auth-input"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    autoComplete="name"
                    disabled={busy}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="auth-field">
            <label className="auth-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="auth-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
              disabled={busy}
            />
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className="auth-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              required
              disabled={busy}
            />
            {tab === "register" && <PasswordStrengthMeter password={password} />}
          </div>

          {tab === "login" && (
            <button
              type="button"
              onClick={() => {
                setResetEmail("");
                setShowResetModal(true);
                setError(null);
              }}
              className="text-xs text-emerald-400 hover:text-emerald-300 mt-2 font-mono"
              disabled={busy}
            >
              Forgot password?
            </button>
          )}
          
    <AnimatePresence>
      {showResetModal && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center bg-black z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* IMPORTANT: stop click from closing accidentally if you later add backdrop click */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="auth-card w-full max-w-sm"
          >
            <h2 className="auth-title text-lg mb-2 text-center">
              Reset Password
            </h2>

            <p className="auth-subtitle text-sm mb-4 text-center">
              Enter your email and we'll send you a reset link.
            </p>

            <input
              type="email"
              className="auth-input mb-3"
              placeholder="you@example.com"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              disabled={busy}
            />

            {error && (
              <p className="text-xs text-rose-400 mb-2 font-mono">{error}</p>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                className="auth-submit flex-1"
                onClick={async () => {
                  setError("");

                  if (!resetEmail) {
                    setError("Please enter your email.");
                    return;
                  }

                  try {
                    setBusy(true);
                    await forgotPassword(resetEmail);
                    setShowResetModal(false);
                    setResetEmail("");
                  } catch (err: unknown) {
                    const code = (err as { code?: string }).code ?? "";
                    setError(friendlyError(code));
                  } finally {
                    setBusy(false);
                  }
                }}
                disabled={busy}
              >
                Send link
              </button>

              <button
                type="button"
                className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-4 py-2 rounded-md transition"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

          <AnimatePresence>
            {tab === "register" && (
              <motion.div
                key="confirm-field"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="auth-field">
                  <label className="auth-label" htmlFor="confirmPassword">Confirm Password</label>
                  <input
                    id="confirmPassword"
                    type="password"
                    className="auth-input"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    disabled={busy}
                  />
                  {confirmPassword && password !== confirmPassword && (
                    <p className="font-mono text-xs text-rose-400 mt-1.5">Passwords do not match</p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <motion.p
              className="auth-error"
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {error}
            </motion.p>
          )}

          <button type="submit" className="auth-submit" disabled={busy}>
            {busy ? "Please wait…" : tab === "login" ? "Sign in" : "Create account"}
          </button>
        </form>

        {/* Divider */}
        <div className="auth-divider">
          <span className="auth-divider__line" />
          <span className="auth-divider__text">or</span>
          <span className="auth-divider__line" />
        </div>

        {/* Google */}
        <button className="auth-google" onClick={handleGoogle} disabled={busy} type="button">
          <GoogleIcon />
          Continue with Google
        </button>
      </motion.div>
    </main>
  );
}