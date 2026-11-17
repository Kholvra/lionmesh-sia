"use client";

import Link from "next/link";
import type { FormEvent } from "react";
import { useState } from "react";

const BUSINESS_CYCLES = [
  {
    title: "Pendapatan",
    description: "Pesanan hingga penerimaan kas",
    icon: (
      <svg
        className="h-5 w-5 text-[#F59E0B] transition-transform duration-300 group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1" />
        <path d="M12 6v2m0 8v2" />
      </svg>
    ),
  },
  {
    title: "Pengeluaran",
    description: "Pembelian hingga pembayaran",
    icon: (
      <svg
        className="h-5 w-5 text-[#F59E0B] transition-transform duration-300 group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
      >
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
      </svg>
    ),
  },
  {
    title: "Produksi",
    description: "Perencanaan hingga hasil produksi",
    icon: (
      <svg
        className="h-5 w-5 text-[#F59E0B] transition-transform duration-300 group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
      >
        <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M17 18h1" />
        <path d="M12 18h1" />
        <path d="M7 18h1" />
      </svg>
    ),
  },
  {
    title: "Penggajian",
    description: "Kehadiran hingga rilis payroll",
    icon: (
      <svg
        className="h-5 w-5 text-[#F59E0B] transition-transform duration-300 group-hover:scale-110"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.75"
        viewBox="0 0 24 24"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
];

const SECURITY_TIPS = [
  "Tautan pemulihan berlaku selama 30 menit.",
  "Periksa folder spam jika email belum diterima.",
  "Jangan bagikan tautan kepada siapa pun.",
];

export default function LupaKataSandiPage() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const isEmailValid =
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.(com|co\.id|id|net|org|io|ac\.id|go\.id)$/i.test(
      email.trim(),
    );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitted(false);

    if (!email.trim()) {
      setEmailError("Email perusahaan wajib diisi.");
      return;
    }

    if (!isEmailValid) {
      setEmailError(
        "Format email tidak valid. Gunakan email seperti direksi@lionmesh.com.",
      );
      return;
    }

    setEmailError(null);
    setIsLoading(true);

    try {
      // Simulasi proses pengiriman tautan pemulihan (bisa diganti dengan supabase.auth.resetPasswordForEmail)
      await new Promise((resolve) => setTimeout(resolve, 700));
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      {/* Panel Kiri: Branding & Informasi Siklus Bisnis */}
      <aside className="relative flex w-full flex-col justify-between overflow-hidden bg-[#1C2530] px-8 py-8 text-white lg:w-[29%] lg:min-w-[360px] lg:max-w-[430px] lg:px-10 lg:py-10">
        {/* Subtle Ambient Glow */}
        <div className="pointer-events-none absolute -top-24 -left-24 h-64 w-64 rounded-full bg-[#ED8B00]/[0.06] blur-3xl" />

        {/* Brand Header */}
        <div className="animate-fade-up relative z-10">
          <div className="text-[28px] font-bold tracking-tight text-white">
            Lionmesh
          </div>
          <p className="mt-0.5 text-xs font-medium text-[#8B95A5]">
            PT Lionmesh Prima Tbk
          </p>
        </div>

        {/* Konten Utama Sidebar */}
        <div className="relative z-10 my-12 lg:my-0">
          <div className="animate-fade-up" style={{ animationDelay: "60ms" }}>
            <span className="inline-block rounded-full bg-[#FFF4D5] px-3 py-1 text-[12px] font-semibold uppercase tracking-normal text-[#A8740D]">
              SISTEM INFORMASI BISNIS
            </span>

            <h2 className="mt-4 text-[32px] font-bold leading-[1.2] tracking-tight text-white">
              Empat siklus.
              <br />
              Satu kendali bisnis.
            </h2>

            <p className="mt-3.5 text-[13.5px] leading-relaxed text-[#9CA3AF]">
              Pantau pendapatan, pengeluaran, produksi, dan penggajian dalam satu
              sistem yang terintegrasi.
            </p>
          </div>

          {/* Daftar Card 4 Siklus */}
          <div className="mt-7 space-y-3">
            {BUSINESS_CYCLES.map((cycle, index) => (
              <div
                key={cycle.title}
                style={{ animationDelay: `${140 + index * 70}ms` }}
                className="animate-fade-up group flex items-center gap-3.5 rounded-xl border border-white/[0.06] bg-[#263342] px-4 py-3.5 transition-all duration-200 hover:translate-x-1 hover:border-[#F59E0B]/30 hover:bg-[#2B394A]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#2C3542] transition-colors duration-200 group-hover:bg-[#333E4D]">
                  {cycle.icon}
                </div>
                <div>
                  <h3 className="text-[13.5px] font-semibold text-white transition-colors group-hover:text-[#FDE68A]">
                    {cycle.title}
                  </h3>
                  <p className="mt-0.5 text-[11.5px] text-[#8B95A5]">
                    {cycle.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Kiri */}
        <div
          style={{ animationDelay: "420ms" }}
          className="animate-fade-up relative z-10 text-[11px] text-[#6B7280]"
        >
          Akses internal • Aman dan terintegrasi
        </div>
      </aside>

      {/* Panel Kanan: Form Lupa Kata Sandi */}
      <main className="flex flex-1 flex-col justify-between bg-[#F9FAFB] px-6 py-8 sm:px-12 lg:px-16 lg:py-10">
        {/* Top Bar Help Link */}
        <div className="animate-fade-up flex w-full justify-end">
          <a
            href="#bantuan-it"
            className="group inline-flex items-center gap-1.5 text-xs font-medium text-[#6B7280] transition-colors hover:text-[#111827]"
          >
            <svg
              className="h-4 w-4 text-[#6B7280] transition-transform duration-200 group-hover:rotate-12 group-hover:text-[#ED8B00]"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.75"
              viewBox="0 0 24 24"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <path d="M12 17h.01" />
            </svg>
            <span>Butuh bantuan? Hubungi IT</span>
          </a>
        </div>

        {/* Container Tengah */}
        <div className="mx-auto my-auto w-full max-w-[680px] py-10">
          {/* Link Kembali ke Login (#ED8B00) */}
          <div className="animate-fade-up" style={{ animationDelay: "40ms" }}>
            <Link
              href="/login"
              className="group inline-flex items-center gap-2 text-xs font-semibold text-[#ED8B00] transition-opacity hover:opacity-85"
            >
              <svg
                className="h-3.5 w-3.5 transition-transform duration-200 group-hover:-translate-x-1"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2.25"
                viewBox="0 0 24 24"
              >
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
              </svg>
              <span>Kembali ke login</span>
            </Link>
          </div>

          {/* Icon Kunci Kotak Kuning (Statis saat Interaksi) */}
          <div
            style={{ animationDelay: "90ms" }}
            className="animate-fade-up mt-6 flex h-13 w-13 items-center justify-center rounded-xl bg-[#FFF4D5]"
          >
            <svg
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 29 29"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M1.6315 21.4544C1.13132 21.9544 0.850249 22.6327 0.850098 23.3399V26.2362C0.850098 26.5898 0.990586 26.929 1.24066 27.1791C1.49073 27.4291 1.82989 27.5696 2.18355 27.5696H6.1839C6.53755 27.5696 6.87672 27.4291 7.12679 27.1791C7.37686 26.929 7.51735 26.5898 7.51735 26.2362V24.9027C7.51735 24.5491 7.65784 24.2099 7.90791 23.9598C8.15798 23.7097 8.49715 23.5693 8.8508 23.5693H10.1842C10.5379 23.5693 10.8771 23.4288 11.1271 23.1787C11.3772 22.9286 11.5177 22.5895 11.5177 22.2358V20.9024C11.5177 20.5487 11.6582 20.2095 11.9083 19.9595C12.1583 19.7094 12.4975 19.5689 12.8511 19.5689H13.0805C13.7877 19.5688 14.466 19.2877 14.966 18.7875L16.0514 17.7021C17.9047 18.3477 19.9222 18.3452 21.7739 17.6951C23.6256 17.045 25.2018 15.7857 26.2448 14.1233C27.2878 12.4608 27.7357 10.4937 27.5152 8.5436C27.2948 6.59351 26.4192 4.77595 25.0315 3.38825C23.6438 2.00056 21.8262 1.12487 19.8761 0.904461C17.926 0.68405 15.9589 1.13196 14.2964 2.17491C12.634 3.21786 11.3747 4.79411 10.7246 6.6458C10.0745 8.4975 10.072 10.515 10.7176 12.3683L1.6315 21.4544ZM20.8518 8.23437C20.8518 8.60259 20.5533 8.9011 20.1851 8.9011C19.8169 8.9011 19.5184 8.60259 19.5184 8.23437C19.5184 7.86615 19.8169 7.56765 20.1851 7.56765C20.5533 7.56765 20.8518 7.86615 20.8518 8.23437Z"
                stroke="#ED8B00"
                strokeLinecap="round"
                strokeWidth="1.7"
              />
            </svg>
          </div>

          {/* Heading & Subheading */}
          <div
            style={{ animationDelay: "140ms" }}
            className="animate-fade-up mt-5 mb-7"
          >
            <h1 className="text-[28px] font-bold tracking-tight text-[#202938] sm:text-[32px]">
              Lupa kata sandi?
            </h1>

            <p className="mt-1.5 text-sm text-[#6B7280]">
              Masukkan email perusahaan yang terdaftar. Kami akan mengirimkan
              tautan untuk mengatur ulang kata sandi Anda.
            </p>
          </div>

          {/* Form Kirim Tautan Pemulihan */}
          <form
            noValidate
            style={{ animationDelay: "190ms" }}
            className="animate-fade-up space-y-6"
            onSubmit={handleSubmit}
          >
            <div className="relative">
              <label
                className="block text-xs font-semibold text-[#111827]"
                htmlFor="recovery-email"
              >
                Email perusahaan
              </label>
              <div className="group relative mt-2">
                {/* Icon Amplop dengan Spring Pop */}
                <div
                  className={`pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    emailError
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
                  className={`w-full rounded-lg border bg-white py-3 pl-10 pr-10 text-sm text-[#111827] outline-none transition-all duration-200 placeholder:text-[#9CA3AF] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-[#6B7280] ${
                    emailError
                      ? "border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                      : "border-[#E5E7EB] hover:border-[#D1D5DB] focus:border-[#ED8B00] focus:ring-2 focus:ring-[#ED8B00]/20"
                  }`}
                  disabled={isLoading}
                  id="recovery-email"
                  onChange={(event) => {
                    setEmail(event.target.value);
                    if (emailError) setEmailError(null);
                    if (isSubmitted) setIsSubmitted(false);
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

              {/* Smooth Alert Inline: Responsif Mobile (Anti-Tabrak) & Desktop (Zero Layout Shift) */}
              {emailError ? (
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
                  <span>{emailError}</span>
                </p>
              ) : null}

              {isSubmitted && !emailError ? (
                <p className="animate-fade-in mt-1.5 flex items-start gap-1.5 text-xs font-medium text-emerald-600 sm:pointer-events-none sm:absolute sm:left-0 sm:top-full sm:mt-1 sm:items-center">
                  <svg
                    className="mt-0.5 h-3.5 w-3.5 shrink-0 sm:mt-0"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>
                    Tautan pemulihan telah dikirim ke{" "}
                    <span className="font-semibold">{email.trim()}</span>.
                  </span>
                </p>
              ) : null}
            </div>

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
                  <span>Mengirim tautan...</span>
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
                    <path d="M14.536 21.686a.5.5 0 0 0 .937-.024l6.5-19a.496.496 0 0 0-.635-.635l-19 6.5a.5.5 0 0 0-.024.937l7.93 3.18a2 2 0 0 1 1.112 1.11z" />
                    <path d="m21.854 2.147-10.94 10.939" />
                  </svg>
                  <span>Kirim Tautan Pemulihan</span>
                </span>
              )}
            </button>
          </form>

          {/* Box Info: Memulihkan akses dengan aman */}
          <div
            style={{ animationDelay: "240ms" }}
            className="animate-fade-up mt-5 rounded-xl bg-[#EEF1F5] p-5 transition-colors hover:bg-[#E7EBF0]"
          >
            <h2 className="text-xs font-bold text-[#111827]">
              Memulihkan akses dengan aman
            </h2>
            <ul className="mt-3 space-y-2.5">
              {SECURITY_TIPS.map((tip) => (
                <li
                  key={tip}
                  className="flex items-center gap-2.5 text-xs text-[#6B7280]"
                >
                  <svg
                    className="h-3.5 w-3.5 shrink-0 text-[#10B981]"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Catatan Bantuan Bawah */}
          <p
            style={{ animationDelay: "280ms" }}
            className="animate-fade-up mt-5 text-xs text-[#6B7280]"
          >
            Email Anda tidak terdaftar? Hubungi administrator IT untuk
            memverifikasi akses akun perusahaan.
          </p>
        </div>

        {/* Footer Kanan */}
        <footer
          style={{ animationDelay: "320ms" }}
          className="animate-fade-up mx-auto w-full max-w-[680px] text-[11.5px] text-[#9CA3AF]"
        >
          © 2026 PT Lionmesh Prima Tbk. Seluruh hak dilindungi.
        </footer>
      </main>
    </div>
  );
}