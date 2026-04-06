"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";
import { Icon } from "@/components/icons";
import { toast } from "sonner";

export default function VerifyOtpPage() {
  const router = useRouter();
  const { verifyOtp, resendOtp, signupData, loginError, setLoginError } = useAuth();

  useEffect(() => {
    if (!signupData.email) {
      router.replace("/signup");
    }
  }, [signupData.email, router]);

  if (!signupData.email) return null;
  const [otpCode, setOtpCode] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

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

  const handleVerify = () => {
    verifyOtp(otpCode.join(""));
  };

  return (
    <div className="bg-am-login-card-bg border border-am-border-strong rounded-2xl p-8 backdrop-blur-md">
      <div className="text-center mb-6">
        <div className="font-poppins text-2xl font-bold text-am-primary tracking-wide">AntMeta</div>
        <div className="text-sm text-am-text-3 mt-1">Verify your email address</div>
      </div>

      <h2 className="font-poppins text-xl font-bold text-am-text mb-2 text-center">Enter OTP</h2>
      <p className="text-sm text-am-text-3 text-center mb-6">
        We sent a 6-digit code to {signupData.email || "your email"}
      </p>

      {loginError && (
        <div className="bg-am-danger-light border border-am-danger/30 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm text-am-danger">
          <Icon name="warn" size={14} /> {loginError}
        </div>
      )}

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

      <button onClick={handleVerify} className="w-full py-3 bg-am-primary text-white border-none rounded-lg font-poppins text-base font-bold cursor-pointer shadow-[0_4px_14px_rgba(0,147,182,0.3)] hover:bg-am-primary-hover transition-colors">
        Verify & Continue
      </button>

      <div className="flex items-center justify-center gap-4 mt-4">
        <button onClick={resendOtp} className="text-sm text-am-primary font-semibold cursor-pointer bg-transparent border-none">
          Resend OTP
        </button>
        <button onClick={() => router.push("/signup")} className="text-sm text-am-text-3 font-semibold cursor-pointer bg-transparent border-none">
          Back
        </button>
      </div>
    </div>
  );
}
