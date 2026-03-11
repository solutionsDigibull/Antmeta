"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { Icon } from "@/components/icons";
import { AlertBox } from "@/components/shared/alert-box";

export default function LoginPage() {
  const router = useRouter();
  const { loginType, setLoginType, login, loginError, setLoginError } = useAuth();
  const [loginId, setLoginId] = useState("");
  const [loginPw, setLoginPw] = useState("");

  const handleLogin = () => {
    login(loginId, loginPw);
  };

  return (
    <div className="bg-am-login-card-bg border border-am-border-strong rounded-2xl p-8 backdrop-blur-md">
      {/* Logo */}
      <div className="flex flex-col items-center mb-6">
        <Image src="/am_logo.png" alt="AntMeta" width={220} height={60} className="h-16 w-auto" />
        <div className="text-sm text-am-text-3 mt-1">Algorithmic Trading Platform</div>
      </div>

      {/* Portal toggle */}
      <div className="flex gap-1 bg-black/20 border border-am-border rounded-[10px] p-1 mb-6">
        {(["admin", "client"] as const).map(type => (
          <div
            key={type}
            onClick={() => { setLoginType(type); setLoginError(""); }}
            className={`flex-1 text-center py-2 rounded-[7px] text-sm font-semibold cursor-pointer transition-all capitalize ${
              loginType === type ? "bg-am-primary text-white" : "text-am-text-3"
            }`}
          >
            {type} Portal
          </div>
        ))}
      </div>

      <h2 className="font-poppins text-xl font-bold text-am-text mb-1">
        {loginType === "admin" ? "Admin Sign In" : "Client Sign In"}
      </h2>
      <p className="text-sm text-am-text-3 mb-5">
        {loginType === "admin" ? "Access the management console" : "Access your trading dashboard"}
      </p>

      {loginType === "admin" && (
        <AlertBox variant="i">Admin accounts are provisioned by the super-admin. Contact support if you need access.</AlertBox>
      )}

      {/* Error */}
      {loginError && (
        <div className="bg-am-danger-light border border-am-danger/30 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm text-am-danger">
          <Icon name="warn" size={14} /> {loginError}
        </div>
      )}

      {/* Form */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-am-text-4 mb-1 uppercase tracking-wide">Email or Mobile</label>
        <input
          type="text"
          value={loginId}
          onChange={e => setLoginId(e.target.value)}
          placeholder={loginType === "admin" ? "admin@antmeta.ai" : "+91 9876543210"}
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          className="w-full bg-am-input-bg border border-am-border rounded-lg px-3.5 py-3 text-base text-am-text placeholder:text-am-text-3 outline-none focus:border-am-primary"
        />
      </div>
      <div className="mb-4">
        <div className="flex items-center justify-between mb-1">
          <label className="text-sm font-semibold text-am-text-4 uppercase tracking-wide">Password</label>
          <button onClick={() => router.push("/forgot-password")} className="text-sm text-am-primary font-semibold cursor-pointer bg-transparent border-none">
            Forgot Password?
          </button>
        </div>
        <input
          type="password"
          value={loginPw}
          onChange={e => setLoginPw(e.target.value)}
          placeholder="Enter password"
          onKeyDown={e => e.key === "Enter" && handleLogin()}
          className="w-full bg-am-input-bg border border-am-border rounded-lg px-3.5 py-3 text-base text-am-text placeholder:text-am-text-3 outline-none focus:border-am-primary"
        />
      </div>

      <button
        onClick={handleLogin}
        className="w-full py-3 bg-am-primary text-white border-none rounded-lg font-poppins text-base font-bold cursor-pointer shadow-[0_4px_14px_rgba(0,147,182,0.3)] hover:bg-am-primary-hover transition-colors mt-1"
      >
        Sign In
      </button>

      {loginType === "client" && (
        <div className="text-center mt-5 text-sm text-am-text-3">
          New to AntMeta?{" "}
          <button onClick={() => router.push("/signup")} className="text-am-primary font-semibold cursor-pointer bg-transparent border-none">
            Create Account
          </button>
        </div>
      )}

      {loginType === "admin" && (
        <div className="text-center mt-4 text-xs text-am-text-3">
          Login attempts are logged for security audit
        </div>
      )}
    </div>
  );
}
