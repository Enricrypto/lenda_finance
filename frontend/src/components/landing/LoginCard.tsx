"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Icon } from "@iconify/react";
import Link from "next/link";

const DEMO_EMAIL = "demo@lenda.com";
const DEMO_PASSWORD = "password123";

export default function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("Invalid email or password");
    } else {
      router.push("/overview");
    }
  };

  const fillDemo = () => {
    setError("");
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl relative">
        {/* Top gradient line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-80" />

        {/* Form content */}
        <div className="p-8">
          {/* Registration success banner */}
          {registered && (
            <div className="mb-6 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
              <Icon icon="solar:check-circle-linear" className="text-green-400 shrink-0" width={20} />
              <p className="text-xs text-green-300">Account created! Sign in to continue.</p>
            </div>
          )}

          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-white tracking-tight">
              Welcome back
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Enter your credentials to access the pipeline.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 ml-1">
                Email
              </label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Icon
                    icon="solar:letter-linear"
                    className="text-slate-500 group-focus-within/input:text-cyan-400 transition-colors"
                  />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="dark-input block w-full bg-[#050505] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-300 placeholder:text-slate-700 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-medium text-slate-300">
                  Password
                </label>
                <span className="text-xs text-cyan-400">Forgot password?</span>
              </div>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Icon
                    icon="solar:lock-password-linear"
                    className="text-slate-500 group-focus-within/input:text-cyan-400 transition-colors"
                  />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="dark-input block w-full bg-[#050505] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-300 placeholder:text-slate-700 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Sign In button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-semibold py-2.5 rounded-lg hover:bg-slate-200 focus:ring-2 focus:ring-white/20 transition-all shadow-lg shadow-white/5 flex items-center justify-center gap-2 relative overflow-hidden cursor-pointer disabled:opacity-70"
            >
              {loading ? (
                <Icon
                  icon="solar:spinner-linear"
                  className="animate-spin"
                  width={20}
                />
              ) : (
                <>
                  <span>Sign In</span>
                  <Icon
                    icon="solar:login-2-linear"
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </>
              )}
            </button>

            {/* Demo button */}
            <button
              type="button"
              onClick={fillDemo}
              className="w-full bg-white/5 border border-white/10 text-slate-300 font-medium py-2.5 rounded-lg hover:bg-white/10 hover:border-white/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Icon icon="solar:user-id-linear" className="text-cyan-400" />
              <span>Try Demo Account</span>
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 relative flex items-center justify-center">
            <div className="absolute inset-x-0 h-px bg-white/10" />
            <span className="relative bg-[#0A0A0A] px-3 text-[10px] uppercase tracking-wider text-slate-600 font-[family-name:var(--font-mono)]">
              Or continue with
            </span>
          </div>

          {/* Signup link */}
          <div className="text-center">
            <p className="text-sm text-slate-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-white font-medium hover:underline decoration-cyan-500/50 underline-offset-4 transition-all"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#050505] border-t border-white/5 py-3 px-8">
          <p className="text-[10px] text-center text-slate-600 font-[family-name:var(--font-mono)]">
            &copy; 2026 Lenda Finance — Built by Enrique Ibarra
          </p>
        </div>
      </div>

      {/* Error toast */}
      <div
        className={`mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-3 transition-all duration-300 ${
          error ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      >
        <Icon
          icon="solar:danger-circle-linear"
          className="text-red-400 shrink-0"
          width={20}
        />
        <div className="text-xs">
          <span className="block text-red-200 font-medium">
            Invalid credentials
          </span>
          <span className="block text-red-400/80">
            Please check your email and password.
          </span>
        </div>
      </div>
    </div>
  );
}
