"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "../actions/auth";
import { Mail, KeyRound, ArrowRight, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await loginAdmin(formData);

    if (result.success) {
      // เมื่อผ่านประตูสำเร็จ ส่งแอดมินไปที่หน้าควบคุมหลักทันที
      router.push("/admin");
      router.refresh();
    } else {
      setError(result.error || "สิทธิ์การเข้าถึงไม่ถูกต้อง");
      setIsLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0B0C0E] text-[#E4E6EB] font-sans flex items-center justify-center px-4 selection:bg-amber-500/20 antialiased">
      {/* Background Decorative Glow (Subtle & Elegant) */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-sm relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Logo / Brand Header */}
        <div className="text-center mb-8">
          <p className="text-[10px] tracking-[0.3em] text-zinc-600 uppercase font-medium">SECURE PORTAL</p>
          <h1 className="text-2xl font-light text-zinc-200 mt-2 tracking-widest">MANAGEMENT</h1>
        </div>

        {/* Login Card */}
        <div className="bg-[#121418] border border-zinc-900/80 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/50">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Input Email */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-medium">Email Address</label>
              <div className="relative group">
                <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-400 transition-colors" strokeWidth={1.5} />
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="admin@example.com"
                  className="w-full bg-[#0F1115] border border-zinc-900 rounded-xl pl-11 pr-4 py-3 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/10 transition-all"
                />
              </div>
            </div>

            {/* Input Password */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase text-zinc-500 tracking-wider font-medium">Password</label>
              <div className="relative group">
                <KeyRound size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-amber-400 transition-colors" strokeWidth={1.5} />
                <input
                  type="password"
                  name="password"
                  required
                  placeholder="••••••••••••"
                  className="w-full bg-[#0F1115] border border-zinc-900 rounded-xl pl-11 pr-4 py-3 text-xs text-zinc-200 placeholder:text-zinc-700 focus:outline-none focus:border-amber-400/40 focus:ring-1 focus:ring-amber-400/10 transition-all"
                />
              </div>
            </div>

            {/* Error Message Box */}
            {error && (
              <div className="text-[11px] text-rose-400 bg-rose-500/5 border border-rose-500/10 rounded-lg p-3 text-center animate-in fade-in zoom-in-95 duration-200">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-zinc-100 hover:bg-white disabled:bg-zinc-800 text-black disabled:text-zinc-500 font-medium py-3 px-4 rounded-xl text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 group border border-transparent shadow-lg shadow-black/20"
            >
              {isLoading ? (
                <Loader2 size={14} className="animate-spin text-zinc-500" />
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={12} className="transform group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Back Link */}
        <div className="text-center mt-6">
          <a href="/" className="text-[10px] tracking-wider uppercase text-zinc-600 hover:text-zinc-400 transition-colors">
            ← กลับไปหน้าหลัก
          </a>
        </div>
      </div>
    </div>
  );
}