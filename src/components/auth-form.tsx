"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      router.push("/");
      router.refresh();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Terjadi kesalahan saat mencoba masuk.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full">
      <form className="space-y-5" onSubmit={handleSubmit}>
        {/* Input Email Perusahaan */}
        <div>
          <label
            className="block text-xs font-semibold text-[#111827]"
            htmlFor="email"
          >
            Email perusahaan
          </label>
          <div className="relative mt-2">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9CA3AF]">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
              >
                <rect height="16" rx="2" width="20" x="2" y="4" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <input
              autoComplete="email"
              className="w-full rounded-lg border border-[#E5E7EB] bg-white py-3 pl-10 pr-4 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#E68A00] focus:ring-2 focus:ring-[#E68A00]/20"
              id="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="direksi@lionmesh.com"
              required
              type="email"
              value={email}
            />
          </div>
        </div>

        {/* Input Kata Sandi */}
        <div>
          <label
            className="block text-xs font-semibold text-[#111827]"
            htmlFor="password"
          >
            Kata sandi
          </label>
          <div className="relative mt-2">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9CA3AF]">
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.75"
                viewBox="0 0 24 24"
              >
                <rect height="11" rx="2" ry="2" width="18" x="3" y="11" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
            </div>
            <input
              autoComplete="current-password"
              className="w-full rounded-lg border border-[#E5E7EB] bg-white py-3 pl-10 pr-11 text-sm text-[#111827] outline-none transition placeholder:text-[#9CA3AF] focus:border-[#E68A00] focus:ring-2 focus:ring-[#E68A00]/20"
              id="password"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••••••"
              required
              type={showPassword ? "text" : "password"}
              value={password}
            />
            <button
              aria-label={
                showPassword
                  ? "Sembunyikan kata sandi"
                  : "Tampilkan kata sandi"
              }
              className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#9CA3AF] transition-colors hover:text-[#4B5563]"
              onClick={() => setShowPassword((prev) => !prev)}
              type="button"
            >
              {showPassword ? (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                  viewBox="0 0 24 24"
                >
                  <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              ) : (
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.75"
                  viewBox="0 0 24 24"
                >
                  <path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49" />
                  <path d="M14.084 14.158a3 3 0 0 1-4.242-4.242" />
                  <path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143" />
                  <path d="m2 2 20 20" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Row: Ingat Saya & Lupa Kata Sandi */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="inline-flex cursor-pointer items-center gap-2 select-none">
            <input
              checked={rememberMe}
              className="peer sr-only"
              onChange={(event) => setRememberMe(event.target.checked)}
              type="checkbox"
            />
            <span className="flex h-4 w-4 items-center justify-center rounded border border-[#D1D5DB] bg-white text-white transition peer-checked:border-[#E68A00] peer-checked:bg-[#E68A00]">
              <svg
                className="h-3 w-3"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="3"
                viewBox="0 0 24 24"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
            <span className="text-xs font-medium text-[#374151]">
              Ingat saya
            </span>
          </label>

          <Link
            className="text-xs font-semibold text-[#D97706] transition-colors hover:text-[#B45309]"
            href="/lupa-kata-sandi"
          >
            Lupa kata sandi?
          </Link>
        </div>

        {/* Pesan Error dari Supabase */}
        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {error}
          </div>
        ) : null}

        {/* Tombol Submit Utama */}
        <button
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E68A00] px-4 py-3 text-sm font-semibold text-white shadow-xs transition hover:bg-[#D47F00] focus:outline-none focus:ring-2 focus:ring-[#E68A00]/40 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? (
            <span>Memproses...</span>
          ) : (
            <>
              <svg
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M5 12h14" />
                <path d="m12 5 7 7-7 7" />
              </svg>
              <span>Masuk ke Dashboard</span>
            </>
          )}
        </button>
      </form>

      {/* Banner Info Keamanan Internal */}
      <div className="mt-5 flex items-center gap-3 rounded-lg bg-[#EEF1F5] px-4 py-3.5 text-xs text-[#6B7280]">
        <svg
          className="h-4 w-4 shrink-0 text-[#6B7280]"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.75"
          viewBox="0 0 24 24"
        >
          <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="m9 12 2 2 4-4" />
        </svg>
        <span>
          Gunakan akun perusahaan Anda. Akses dan aktivitas dicatat untuk menjaga
          keamanan data bisnis.
        </span>
      </div>

      {/* Bantuan */}
      <p className="mt-5 text-xs text-[#6B7280]">
        Tidak dapat masuk? Hubungi administrator sistem.
      </p>
    </div>
  );
}