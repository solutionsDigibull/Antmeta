"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Icon } from "@/components/icons";
import type { SignupData } from "@/lib/types";

export default function SignupPage() {
  const router = useRouter();
  const { signup, loginError, setLoginError } = useAuth();
  const [data, setData] = useState<SignupData>({
    mobile: "", name: "", email: "", accountType: "individual", password: "", confirmPw: "",
  });

  const update = (field: keyof SignupData, value: string) => {
    setData(prev => ({ ...prev, [field]: value }));
    setLoginError("");
  };

  const handleSignup = () => {
    const ok = signup(data);
    if (ok) router.push("/verify-otp");
  };

  return (
    <div className="bg-am-login-card-bg border border-am-border-strong rounded-2xl p-8 backdrop-blur-md">
      <div className="text-center mb-6">
        <div className="font-poppins text-2xl font-bold text-am-primary tracking-wide">AntMeta</div>
        <div className="text-sm text-am-text-3 mt-1">Create your trading account</div>
      </div>

      <h2 className="font-poppins text-xl font-bold text-am-text mb-5">Sign Up</h2>

      {loginError && (
        <div className="bg-am-danger-light border border-am-danger/30 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm text-am-danger">
          <Icon name="warn" size={14} /> {loginError}
        </div>
      )}

      <div className="mb-4">
        <label className="block text-sm font-semibold text-am-text-4 mb-1 uppercase tracking-wide">Mobile Number</label>
        <div className="flex gap-2">
          <div className="bg-am-input-bg border border-am-border rounded-lg px-3 py-3 text-sm text-am-text-2 font-semibold shrink-0">+91</div>
          <input
            type="tel"
            value={data.mobile}
            onChange={e => update("mobile", e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="9876543210"
            className="flex-1 bg-am-input-bg border border-am-border rounded-lg px-3.5 py-3 text-base text-am-text placeholder:text-am-text-3 outline-none"
          />
        </div>
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-am-text-4 mb-1 uppercase tracking-wide">Full Name</label>
        <input
          type="text"
          value={data.name}
          onChange={e => update("name", e.target.value)}
          placeholder="Your full name"
          className="w-full bg-am-input-bg border border-am-border rounded-lg px-3.5 py-3 text-base text-am-text placeholder:text-am-text-3 outline-none"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-am-text-4 mb-1 uppercase tracking-wide">Email (Optional)</label>
        <input
          type="email"
          value={data.email}
          onChange={e => update("email", e.target.value)}
          placeholder="you@email.com"
          className="w-full bg-am-input-bg border border-am-border rounded-lg px-3.5 py-3 text-base text-am-text placeholder:text-am-text-3 outline-none"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-semibold text-am-text-4 mb-1 uppercase tracking-wide">Account Type</label>
        <div className="flex gap-2">
          {(["individual", "corporate"] as const).map(t => (
            <div
              key={t}
              onClick={() => update("accountType", t)}
              className={`flex-1 text-center py-2.5 rounded-lg border cursor-pointer transition-all ${
                data.accountType === t ? "border-am-primary bg-am-primary-light text-am-primary font-semibold" : "border-am-border text-am-text-3"
              }`}
            >
              <div className="text-sm font-semibold capitalize">{t}</div>
              <div className="text-xs text-am-text-3 mt-0.5">{t === "individual" ? "Personal trading" : "Company account"}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div>
          <label className="block text-sm font-semibold text-am-text-4 mb-1 uppercase tracking-wide">Password</label>
          <input
            type="password"
            value={data.password}
            onChange={e => update("password", e.target.value)}
            placeholder="Min 8 chars"
            className="w-full bg-am-input-bg border border-am-border rounded-lg px-3.5 py-3 text-base text-am-text placeholder:text-am-text-3 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-am-text-4 mb-1 uppercase tracking-wide">Confirm</label>
          <input
            type="password"
            value={data.confirmPw}
            onChange={e => update("confirmPw", e.target.value)}
            placeholder="Repeat password"
            className="w-full bg-am-input-bg border border-am-border rounded-lg px-3.5 py-3 text-base text-am-text placeholder:text-am-text-3 outline-none"
          />
        </div>
      </div>

      <button onClick={handleSignup} className="w-full py-3 bg-am-primary text-white border-none rounded-lg font-poppins text-base font-bold cursor-pointer shadow-[0_4px_14px_rgba(0,147,182,0.3)] hover:bg-am-primary-hover transition-colors">
        Create Account
      </button>

      <div className="text-center mt-4 text-sm text-am-text-3">
        Already have an account?{" "}
        <button onClick={() => router.push("/login")} className="text-am-primary font-semibold cursor-pointer bg-transparent border-none">Sign In</button>
      </div>
    </div>
  );
}
