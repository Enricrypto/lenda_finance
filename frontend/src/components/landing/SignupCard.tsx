"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react";
import Link from "next/link";
import api from "@/lib/api";

export default function SignupCard() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setError("");

    if (!name || !email || !password) {
      setError("All fields are required");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      await api.post("/auth/register", { name, email, password }, { timeout: 30000 });
      router.push("/login?registered=true");
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as Record<string, unknown>).response === "object"
      ) {
        const response = (err as { response: { data?: { detail?: string } } }).response;
        setError(response.data?.detail || "Registration failed");
      } else {
        setError("Registration failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl relative">
        {/* Top gradient line */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-80" />

        {/* Form content */}
        <div className="p-8">
          {/* Header */}
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-semibold text-white tracking-tight">
              Create your account
            </h2>
            <p className="text-sm text-slate-500 mt-2">
              Start managing your assets and loans today.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 ml-1">
                Full Name
              </label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Icon
                    icon="solar:user-linear"
                    className="text-slate-500 group-focus-within/input:text-cyan-400 transition-colors"
                  />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="dark-input block w-full bg-[#050505] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-300 placeholder:text-slate-700 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

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
              <label className="text-xs font-medium text-slate-300 ml-1">
                Password
              </label>
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

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-300 ml-1">
                Confirm Password
              </label>
              <div className="relative group/input">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Icon
                    icon="solar:lock-password-linear"
                    className="text-slate-500 group-focus-within/input:text-cyan-400 transition-colors"
                  />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="dark-input block w-full bg-[#050505] border border-white/10 rounded-lg py-2.5 pl-10 pr-4 text-sm text-slate-300 placeholder:text-slate-700 focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 focus:outline-none transition-all"
                  required
                />
              </div>
            </div>

            {/* Sign Up button */}
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
                  <span>Create Account</span>
                  <Icon
                    icon="solar:user-plus-linear"
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="my-6 relative flex items-center justify-center">
            <div className="absolute inset-x-0 h-px bg-white/10" />
            <span className="relative bg-[#0A0A0A] px-3 text-[10px] uppercase tracking-wider text-slate-600 font-[family-name:var(--font-mono)]">
              Already registered?
            </span>
          </div>

          {/* Login link */}
          <div className="text-center">
            <p className="text-sm text-slate-500">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-white font-medium hover:underline decoration-cyan-500/50 underline-offset-4 transition-all"
              >
                Sign in
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
            Registration failed
          </span>
          <span className="block text-red-400/80">{error}</span>
        </div>
      </div>
    </div>
  );
}
