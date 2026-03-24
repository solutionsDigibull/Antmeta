"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleReset = async () => {
    if (!newPw || newPw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    if (newPw !== confirmPw) { toast.error("Passwords do not match"); return; }
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPw });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated! Please sign in.");
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div className="bg-am-login-card-bg border border-am-border-strong rounded-2xl p-8 backdrop-blur-md">
      <div className="text-center mb-6">
        <div className="font-poppins text-2xl font-bold text-am-primary tracking-wide">AntMeta</div>
        <div className="text-sm text-am-text-3 mt-1">Set a new password</div>
      </div>

      {!ready ? (
        <>
          <h2 className="font-poppins text-xl font-bold text-am-text mb-2">Check Your Email</h2>
          <p className="text-sm text-am-text-3 mb-6">
            Click the reset link we sent to your email to continue. This page will update automatically.
          </p>
          <div className="flex items-center justify-center gap-2 text-am-text-3 py-4">
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 12a9 9 0 1 1-6.219-8.56" strokeLinecap="round" />
            </svg>
            <span className="text-sm">Waiting for recovery link…</span>
          </div>
          <div className="text-center mt-4">
            <button
              onClick={() => router.push("/forgot-password")}
              className="text-sm text-am-primary font-semibold cursor-pointer bg-transparent border-none"
            >
              Resend Reset Email
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="font-poppins text-xl font-bold text-am-text mb-2">Set New Password</h2>
          <p className="text-sm text-am-text-3 mb-5">Choose a strong password for your account.</p>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-am-text-4 mb-1 uppercase tracking-wide">New Password</label>
            <input
              type="password"
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              placeholder="Min 8 characters"
              onKeyDown={e => e.key === "Enter" && handleReset()}
              className="w-full bg-am-input-bg border border-am-border rounded-lg px-3.5 py-3 text-base text-am-text placeholder:text-am-text-3 outline-none focus:border-am-primary"
            />
          </div>

          <div className="mb-5">
            <label className="block text-sm font-semibold text-am-text-4 mb-1 uppercase tracking-wide">Confirm Password</label>
            <input
              type="password"
              value={confirmPw}
              onChange={e => setConfirmPw(e.target.value)}
              placeholder="Repeat password"
              onKeyDown={e => e.key === "Enter" && handleReset()}
              className="w-full bg-am-input-bg border border-am-border rounded-lg px-3.5 py-3 text-base text-am-text placeholder:text-am-text-3 outline-none focus:border-am-primary"
            />
          </div>

          <button
            onClick={handleReset}
            disabled={saving}
            className="w-full py-3 bg-am-primary text-white border-none rounded-lg font-poppins text-base font-bold cursor-pointer shadow-[0_4px_14px_rgba(0,147,182,0.3)] hover:bg-am-primary-hover transition-colors disabled:opacity-50"
          >
            {saving ? "Updating…" : "Update Password"}
          </button>
        </>
      )}
    </div>
  );
}
