"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

export function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<{
    email?: string;
    password?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const isEmailValid =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|co\.id|id|net|org|io|ac\.id|go\.id)$/i.test(
      email.trim(),
    );
  const isPasswordReady = password.length >= 6;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const nextErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      nextErrors.email = "Email perusahaan wajib diisi.";
    } else if (!isEmailValid) {
      nextErrors.email =
        "Format email tidak valid. Gunakan email seperti direksi@lionmesh.com.";
    }

    if (!password) {
      nextErrors.password = "Kata sandi wajib diisi.";
    } else if (password.length < 6) {
      nextErrors.password = "Kata sandi minimal terdiri dari 6 karakter.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setIsLoading(true);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
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
      <form className="space-y-6" noValidate onSubmit={handleSubmit}>
        {/* Input Email Perusahaan */}
        <div className="relative">
          <label
            className="block text-xs font-semibold text-[#111827]"
            htmlFor="email"
          >
            Email perusahaan
          </label>
          <div className="group relative mt-2">
            {/* Icon Amplop dengan Spring Pop */}
            <div
              className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                fieldErrors.email
                  ? "text-rose-500"
                  : isEmailValid
                    ? "scale-110 -rotate-6 text-[#ED8B00]"
                    : "text-[#9CA3AF] group-focus-within:scale-110 group-focus-within:-rotate-6 group-focus-within:text-[#ED8B00]"
              }`}
            >
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
              className={`w-full rounded-lg border bg-white py-3 pl-10 pr-10 text-sm text-[#111827] outline-none transition-all duration-200 placeholder:text-[#9CA3AF] ${
                fieldErrors.email
                  ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  : "border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#ED8B00] focus:ring-2 focus:ring-[#ED8B00]/20"
              }`}
              id="email"
              onChange={(event) => {
                setEmail(event.target.value);
                if (fieldErrors.email) {
                  setFieldErrors((prev) => ({ ...prev, email: undefined }));
                }
              }}
              placeholder="direksi@lionmesh.com"
              type="email"
              value={email}
            />

            {/* Badge Centang Pop-In saat Format Email Valid */}
            <div
              className={`pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                isEmailValid
                  ? "scale-100 rotate-0 opacity-100"
                  : "scale-0 -rotate-45 opacity-0"
              }`}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600">
                <svg
                  className="h-3 w-3"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.75"
                  viewBox="0 0 24 24"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
            </div>
          </div>

          {/* Pesan Error Responsif: Mobile Flow & Desktop Absolute */}
          {fieldErrors.email ? (
            <p className="animate-fade-in mt-1.5 flex items-start gap-1.5 text-xs font-medium text-rose-600 sm:pointer-events-none sm:absolute sm:left-0 sm:top-full sm:mt-1 sm:items-center">
              <svg
                className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <span>{fieldErrors.email}</span>
            </p>
          ) : null}
        </div>

        {/* Input Kata Sandi */}
        <div className="relative">
          <label
            className="block text-xs font-semibold text-[#111827]"
            htmlFor="password"
          >
            Kata sandi
          </label>
          <div className="group relative mt-2">
            {/* Icon Gembok dengan Spring Pop */}
            <div
              className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                fieldErrors.password
                  ? "text-rose-500"
                  : isPasswordReady
                    ? "scale-110 rotate-6 text-[#ED8B00]"
                    : "text-[#9CA3AF] group-focus-within:scale-110 group-focus-within:rotate-6 group-focus-within:text-[#ED8B00]"
              }`}
            >
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
              className={`w-full rounded-lg border bg-white py-3 pl-10 pr-11 text-sm text-[#111827] outline-none transition-all duration-200 placeholder:text-[#9CA3AF] ${
                fieldErrors.password
                  ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  : "border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#ED8B00] focus:ring-2 focus:ring-[#ED8B00]/20"
              }`}
              id="password"
              onChange={(event) => {
                setPassword(event.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: undefined }));
                }
              }}
              placeholder="••••••••••••"
              type={showPassword ? "text" : "password"}
              value={password}
            />

            {/* Smooth Eye Toggle */}
            <button
              aria-label={
                showPassword
                  ? "Sembunyikan kata sandi"
                  : "Tampilkan kata sandi"
              }
              className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#9CA3AF] transition-colors duration-200 hover:text-[#ED8B00] active:scale-75"
              onClick={() => setShowPassword((prev) => !prev)}
              type="button"
            >
              {/* Mata Terbuka (Show) */}
              <svg
                className={`absolute h-4 w-4 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  showPassword
                    ? "scale-100 rotate-0 text-[#ED8B00] opacity-100"
                    : "scale-50 -rotate-45 opacity-0"
                }`}
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

              {/* Mata Tertutup (Hide) */}
              <svg
                className={`absolute h-4 w-4 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  !showPassword
                    ? "scale-100 rotate-0 opacity-100"
                    : "scale-50 rotate-45 opacity-0"
                }`}
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
            </button>
          </div>

          {/* Pesan Error Responsif: Mobile Flow & Desktop Absolute */}
          {fieldErrors.password ? (
            <p className="animate-fade-in mt-1.5 flex items-start gap-1.5 text-xs font-medium text-rose-600 sm:pointer-events-none sm:absolute sm:left-0 sm:top-full sm:mt-1 sm:items-center">
              <svg
                className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" x2="12" y1="8" y2="12" />
                <line x1="12" x2="12.01" y1="16" y2="16" />
              </svg>
              <span>{fieldErrors.password}</span>
            </p>
          ) : null}
        </div>

        {/* Row: Ingat Saya & Lupa Kata Sandi */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="group inline-flex cursor-pointer items-center gap-2 select-none">
            <input
              checked={rememberMe}
              className="peer sr-only"
              onChange={(event) => setRememberMe(event.target.checked)}
              type="checkbox"
            />
            <span className="flex h-4 w-4 items-center justify-center rounded border border-[#D1D5DB] bg-white text-white transition-all duration-200 group-hover:border-[#ED8B00] peer-checked:border-[#ED8B00] peer-checked:bg-[#ED8B00]">
              <svg
                className={`h-3 w-3 transition-transform duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  rememberMe ? "scale-100 rotate-0" : "scale-0 -rotate-45"
                }`}
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
            <span className="text-xs font-medium text-[#374151] transition-colors group-hover:text-[#111827]">
              Ingat saya
            </span>
          </label>

          <Link
            className="text-xs font-semibold text-[#ED8B00] transition-colors hover:text-[#B45309] hover:underline"
            href="/lupa-kata-sandi"
          >
            Lupa kata sandi?
          </Link>
        </div>

        {/* Pesan Error dari Supabase */}
        {error ? (
          <div className="animate-fade-in rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {error}
          </div>
        ) : null}

        {/* Tombol Submit Utama */}
        <button
          className="group flex w-full items-center justify-center rounded-lg bg-[#ED8B00] px-4 py-3 text-sm font-semibold text-white shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#D97F00] hover:shadow-md hover:shadow-[#ED8B00]/20 focus:outline-none focus:ring-2 focus:ring-[#ED8B00]/40 active:translate-y-0 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
          disabled={isLoading}
          type="submit"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <path
                  className="opacity-75"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  fill="currentColor"
                />
              </svg>
              <span>Memproses...</span>
            </span>
          ) : (
            <span className="flex items-center gap-2 transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1">
              <svg
                className="h-4 w-4 shrink-0"
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
            </span>
          )}
        </button>
      </form>

      {/* Banner Info Keamanan Internal */}
      <div className="mt-5 flex items-center gap-3 rounded-lg bg-[#EEF1F5] px-4 py-3.5 text-xs text-[#6B7280] transition-colors hover:bg-[#E7EBF0]">
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

      {/* Catatan Bantuan Bawah */}
      <p className="mt-5 text-xs text-[#6B7280]">
        Tidak dapat masuk? Hubungi administrator sistem.
      </p>
    </div>
  );
}