"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/hooks/use-auth";
import { Icon } from "@/components/icons";
import { AlertBox } from "@/components/shared/alert-box";

export default function LoginPage() {
  const router = useRouter();
  const { loginType, setLoginType, loginError, setLoginError, loginOtpEmail, requestLoginOtp, verifyLoginOtp, resendLoginOtp } = useAuth();
  const [step, setStep] = useState<"email" | "otp">("email");
  const [emailInput, setEmailInput] = useState("");
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleSendOtp = async () => {
    const ok = await requestLoginOtp(emailInput);
    if (ok) setStep("otp");
  };

  const handleVerify = () => {
    verifyLoginOtp(otpCode.join(""));
  };

  const handleBack = () => {
    setStep("email");
    setOtpCode(["", "", "", "", "", ""]);
    setLoginError("");
  };

  const handleOtpInput = (idx: number, val: string) => {
    if (val.length > 1) val = val.slice(-1);
    if (val && !/^\d$/.test(val)) return;
    const newOtp = [...otpCode];
    newOtp[idx] = val;
    setOtpCode(newOtp);
    setLoginError("");
    if (val && idx < 5 && otpRefs.current[idx + 1]) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpCode[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
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
            role="button"
            tabIndex={0}
            aria-pressed={loginType === type}
            onClick={() => { setLoginType(type); setLoginError(""); handleBack(); }}
            onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { setLoginType(type); setLoginError(""); handleBack(); } }}
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
        {step === "email"
          ? loginType === "admin" ? "Access the management console" : "Access your trading dashboard"
          : `We sent a 6-digit code to ${loginOtpEmail}`}
      </p>

      {loginType === "admin" && step === "email" && (
        <AlertBox variant="i">Admin accounts are provisioned by the super-admin. Contact support if you need access.</AlertBox>
      )}

      {/* Error */}
      {loginError && (
        <div className="bg-am-danger-light border border-am-danger/30 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm text-am-danger">
          <Icon name="warn" size={14} /> {loginError}
        </div>
      )}

      {step === "email" ? (
        <>
          <div className="mb-4">
            <label className="block text-sm font-semibold text-am-text-4 mb-1 uppercase tracking-wide">Email</label>
            <input
              type="email"
              value={emailInput}
              onChange={e => setEmailInput(e.target.value)}
              placeholder={loginType === "admin" ? "admin@antmeta.ai" : "you@example.com"}
              onKeyDown={e => e.key === "Enter" && handleSendOtp()}
              className="w-full bg-am-input-bg border border-am-border rounded-lg px-3.5 py-3 text-base text-am-text placeholder:text-am-text-3 outline-none focus:border-am-primary"
            />
          </div>

          <button
            onClick={handleSendOtp}
            className="w-full py-3 bg-am-primary text-white border-none rounded-lg font-poppins text-base font-bold cursor-pointer shadow-[0_4px_14px_rgba(0,147,182,0.3)] hover:bg-am-primary-hover transition-colors mt-1"
          >
            Send OTP
          </button>
        </>
      ) : (
        <>
          <div className="flex justify-center gap-2.5 mb-6">
            {otpCode.map((digit, i) => (
              <input
                key={i}
                ref={el => { otpRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={e => handleOtpInput(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`w-11 h-[50px] text-center text-xl font-bold bg-am-input-bg border rounded-lg text-am-text outline-none ${
                  digit ? "border-am-primary" : "border-am-border"
                }`}
              />
            ))}
          </div>

          <button
            onClick={handleVerify}
            className="w-full py-3 bg-am-primary text-white border-none rounded-lg font-poppins text-base font-bold cursor-pointer shadow-[0_4px_14px_rgba(0,147,182,0.3)] hover:bg-am-primary-hover transition-colors"
          >
            Verify &amp; Sign In
          </button>

          <div className="flex items-center justify-center gap-4 mt-4">
            <button onClick={resendLoginOtp} className="text-sm text-am-primary font-semibold cursor-pointer bg-transparent border-none">
              Resend OTP
            </button>
            <button onClick={handleBack} className="text-sm text-am-text-3 font-semibold cursor-pointer bg-transparent border-none">
              Back
            </button>
          </div>
        </>
      )}

      {loginType === "client" && step === "email" && (
        <div className="text-center mt-5 text-sm text-am-text-3">
          New to AntMeta?{" "}
          <button onClick={() => router.push("/signup")} className="text-am-primary font-semibold cursor-pointer bg-transparent border-none">
            Create Account
          </button>
        </div>
      )}

      {loginType === "admin" && step === "email" && (
        <div className="text-center mt-4 text-xs text-am-text-3">
          Login attempts are logged for security audit
        </div>
      )}
    </div>
  );
}
