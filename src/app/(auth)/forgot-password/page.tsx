"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const handleReset = async () => {
    if (!email) return;
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Reset link sent! Check your email inbox.");
    router.push("/login");
  };

  return (
    <div className="bg-am-login-card-bg border border-am-border-strong rounded-2xl p-8 backdrop-blur-md">
      <div className="text-center mb-6">
        <div className="font-poppins text-2xl font-bold text-am-primary tracking-wide">AntMeta</div>
        <div className="text-sm text-am-text-3 mt-1">Reset your password</div>
      </div>

      <h2 className="font-poppins text-xl font-bold text-am-text mb-2">Forgot Password</h2>
      <p className="text-sm text-am-text-3 mb-5">Enter your email address to receive a password reset link.</p>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-am-text-4 mb-1 uppercase tracking-wide">Email Address</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          onKeyDown={e => e.key === "Enter" && handleReset()}
          className="w-full bg-am-input-bg border border-am-border rounded-lg px-3.5 py-3 text-base text-am-text placeholder:text-am-text-3 outline-none"
        />
      </div>

      <button onClick={handleReset} className="w-full py-3 bg-am-primary text-white border-none rounded-lg font-poppins text-base font-bold cursor-pointer shadow-[0_4px_14px_rgba(0,147,182,0.3)] hover:bg-am-primary-hover transition-colors">
        Send Reset Link
      </button>

      <div className="text-center mt-4">
        <button onClick={() => router.push("/login")} className="text-sm text-am-primary font-semibold cursor-pointer bg-transparent border-none">
          Back to Sign In
        </button>
      </div>
    </div>
  );
}
