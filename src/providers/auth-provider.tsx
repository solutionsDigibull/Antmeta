"use client";

import { createContext, useState, useCallback, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { User, SignupData } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

interface AuthContextValue {
  user: User | null;
  loginType: "admin" | "client";
  setLoginType: (t: "admin" | "client") => void;
  login: (id: string, pw: string) => void;
  signup: (data: SignupData) => boolean;
  verifyOtp: (code: string) => void;
  resendOtp: () => void;
  logout: () => void;
  signupData: SignupData;
  setSignupData: React.Dispatch<React.SetStateAction<SignupData>>;
  loginError: string;
  setLoginError: (e: string) => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<User | null>(null);
  const [loginType, setLoginType] = useState<"admin" | "client">("admin");
  const [loginError, setLoginError] = useState("");
  const [signupData, setSignupData] = useState<SignupData>({
    mobile: "", name: "", email: "", accountType: "individual", password: "", confirmPw: "",
  });

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        const role = (authUser.app_metadata?.role as string) || "client";
        const isAdmin = ["super_admin", "admin", "support"].includes(role);
        setUser({
          id: authUser.id,
          name: authUser.user_metadata?.name || authUser.email || "User",
          role: role.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
          type: isAdmin ? "admin" : "client",
        });
      }
    };
    restoreSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session?.user) {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (id: string, pw: string) => {
    setLoginError("");
    if (!id || !pw) { setLoginError("Please enter your credentials"); return; }
    if (loginType === "admin" && !id.includes("@")) { setLoginError("Admin login requires a valid email address"); return; }
    if (pw.length < 8) { setLoginError("Password must be at least 8 characters"); return; }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: id.includes("@") ? id : undefined,
      phone: !id.includes("@") ? `+91${id.replace(/\D/g, "").replace(/^91/, "")}` : undefined,
      password: pw,
    } as Parameters<typeof supabase.auth.signInWithPassword>[0]);

    if (error) {
      setLoginError(error.message);
      return;
    }

    if (data.user) {
      const role = (data.user.app_metadata?.role as string) || "client";
      const isAdmin = ["super_admin", "admin", "support"].includes(role);
      const u: User = {
        id: data.user.id,
        name: data.user.user_metadata?.name || data.user.email || "User",
        role: role.split("_").map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        type: isAdmin ? "admin" : "client",
      };
      setUser(u);
      toast.success(`Welcome back, ${u.name}`);
      router.push(isAdmin ? "/admin/dashboard" : "/client/dashboard");
    }
  }, [loginType, router, supabase]);

  const signup = useCallback((data: SignupData): boolean => {
    setLoginError("");
    if (!data.email || !data.email.includes("@")) { setLoginError("Enter a valid email address"); return false; }
    if (!data.name || data.name.length < 2) { setLoginError("Enter your full name"); return false; }
    if (!data.password || data.password.length < 8) { setLoginError("Password must be at least 8 characters"); return false; }
    if (data.password !== data.confirmPw) { setLoginError("Passwords do not match"); return false; }

    // Store data for OTP verification step
    setSignupData(data);

    // Trigger email OTP via Supabase
    (async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email: data.email,
        options: { shouldCreateUser: true },
      });
      if (error) {
        setLoginError(error.message);
        toast.error(error.message);
      } else {
        toast.success(`OTP sent to ${data.email}`);
      }
    })();

    return true;
  }, [supabase]);

  const verifyOtp = useCallback(async (code: string) => {
    setLoginError("");
    if (code.length < 6) { setLoginError("Enter the complete 6-digit OTP"); return; }

    const { data, error } = await supabase.auth.verifyOtp({
      email: signupData.email,
      token: code,
      type: "email",
    });

    if (error) {
      setLoginError(error.message);
      return;
    }

    if (data.user) {
      // Update auth user metadata
      await supabase.auth.updateUser({
        password: signupData.password,
        data: {
          name: signupData.name,
          account_type: signupData.accountType,
        },
      });

      // Create public.users + public.clients records via API
      const res = await fetch("/api/auth/complete-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: signupData.name,
          email: signupData.email,
          phone: signupData.mobile ? `+91${signupData.mobile.replace(/\D/g, "")}` : null,
          accountType: signupData.accountType,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to complete registration");
        return;
      }

      const u: User = {
        id: data.user.id,
        name: signupData.name,
        role: signupData.accountType === "individual" ? "Individual Client" : "Corporate Client",
        type: "client",
      };
      setUser(u);
      toast.success("Account created successfully!");
      router.push("/client/dashboard");
    }
  }, [signupData, router, supabase]);

  const resendOtp = useCallback(() => {
    if (!signupData.email) return;
    (async () => {
      const { error } = await supabase.auth.signInWithOtp({
        email: signupData.email,
        options: { shouldCreateUser: true },
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success(`OTP resent to ${signupData.email}`);
      }
    })();
  }, [signupData.email, supabase]);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setLoginError("");
    setSignupData({ mobile: "", name: "", email: "", accountType: "individual", password: "", confirmPw: "" });
    router.push("/login");
  }, [router, supabase]);

  return (
    <AuthContext.Provider value={{ user, loginType, setLoginType, login, signup, verifyOtp, resendOtp, logout, signupData, setSignupData, loginError, setLoginError }}>
      {children}
    </AuthContext.Provider>
  );
}
