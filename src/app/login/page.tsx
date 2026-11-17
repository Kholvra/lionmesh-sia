import { Suspense } from "react";

import { AuthError } from "@/components/auth-error";
import { AuthForm } from "@/components/auth-form";

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

export default function LoginPage() {
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

      {/* Panel Kanan: Form Login */}
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

        {/* Form Container Tengah */}
        <div className="mx-auto my-auto w-full max-w-[680px] py-10">
          <div
            style={{ animationDelay: "80ms" }}
            className="animate-fade-up mb-7"
          >
            <span className="inline-block rounded-full bg-[#FFF4D5] px-3 py-1 text-[12px] font-semibold uppercase tracking-normal text-[#A8740D]">
              PORTAL DIREKSI
            </span>

            <h1 className="mt-3.5 text-[28px] font-bold tracking-tight text-[#202938] sm:text-[32px]">
              Selamat datang kembali
            </h1>

            <p className="mt-1.5 text-sm text-[#6B7280]">
              Masuk untuk memantau kinerja bisnis dan menindaklanjuti
              persetujuan operasional Lionmesh.
            </p>
          </div>

          <Suspense fallback={null}>
            <AuthError />
          </Suspense>

          <div
            style={{ animationDelay: "160ms" }}
            className="animate-fade-up"
          >
            <AuthForm />
          </div>
        </div>

        {/* Footer Kanan */}
        <footer
          style={{ animationDelay: "240ms" }}
          className="animate-fade-up mx-auto w-full max-w-[680px] text-[11.5px] text-[#9CA3AF]"
        >
          © 2026 PT Lionmesh Prima Tbk. Seluruh hak dilindungi.
        </footer>
      </main>
    </div>
  );
}