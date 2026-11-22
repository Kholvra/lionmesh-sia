import { Suspense } from "react";

import { AuthError } from "@/components/auth-error";
import { AuthForm } from "@/components/auth-form";

const CYCLES = [
  { title: "Pendapatan", description: "Pesanan hingga penerimaan kas", icon: "income" },
  { title: "Pengeluaran", description: "Pembelian hingga pembayaran", icon: "wallet" },
  { title: "Produksi", description: "Perencanaan hingga hasil produksi", icon: "factory" },
  { title: "Penggajian", description: "Kehadiran hingga rilis gaji", icon: "people" },
] as const;

function CycleIcon({ name }: { name: (typeof CYCLES)[number]["icon"] }) {
  const iconClass = "h-[var(--space-5)] w-[var(--space-5)]";
  const iconProps = {
    "aria-hidden": true as const,
    className: iconClass,
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.75,
    viewBox: "0 0 24 24",
  };

  if (name === "income") {
    return (
      <svg {...iconProps}>
        <circle cx="12" cy="12" r="9" />
        <path d="M14.8 9A2 2 0 0 0 13 8h-2a2 2 0 0 0 0 4h2a2 2 0 0 1 0 4h-2a2 2 0 0 1-1.8-1" />
        <path d="M12 6v2m0 8v2" />
      </svg>
    );
  }

  if (name === "wallet") {
    return (
      <svg {...iconProps}>
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
      </svg>
    );
  }

  if (name === "factory") {
    return (
      <svg {...iconProps}>
        <path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z" />
        <path d="M17 18h1m-6 0h1m-6 0h1" />
      </svg>
    );
  }

  return (
    <svg {...iconProps}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg aria-hidden="true" className="h-[var(--space-4)] w-[var(--space-4)] shrink-0 text-[color:var(--ink-400)]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3m.1 4h.01" />
    </svg>
  );
}

function SecurityIcon() {
  return (
    <svg aria-hidden="true" className="h-[var(--space-4)] w-[var(--space-4)] shrink-0 text-[color:var(--ink-500)]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function BrandPanel() {
  return (
    <aside className="flex min-h-screen w-[27.5%] min-w-[calc(var(--space-16)*5.5)] shrink-0 flex-col justify-between bg-[var(--bg-sidebar)] px-[var(--space-8)] py-[var(--space-12)] text-[color:var(--text-inverse)]">
      <header>
        <p className="m-0 text-[calc(var(--font-size-display)+var(--space-1))] font-bold leading-[calc(var(--line-height-display)+var(--space-1))]">Lionmesh</p>
        <p className="mt-[var(--space-1)] mb-0 text-[length:var(--font-size-body-sm)] leading-[var(--line-height-body-sm)] text-[color:var(--ink-200)]">PT Lionmesh Prima Tbk</p>
      </header>

      <div className="w-full max-w-[calc(var(--space-16)*6)]">
        <div>
          <span className="inline-flex min-h-[var(--button-sm-height)] items-center rounded-[var(--radius-full)] bg-[var(--brand-50)] px-[var(--space-3)] text-[length:var(--font-size-label)] font-semibold uppercase tracking-[var(--letter-spacing-caption)] text-[color:var(--brand-700)]">
            Sistem Informasi Bisnis
          </span>
          <h2 className="mt-[var(--space-4)] mb-0 text-[calc(var(--font-size-display)+var(--space-2))] font-bold leading-[1.2] tracking-[-0.02em] text-[color:var(--text-inverse)]">
            Empat siklus.<br />Satu kendali bisnis.
          </h2>
          <p className="mt-[var(--space-3)] mb-0 text-[length:var(--font-size-body)] leading-[var(--line-height-body)] text-[color:var(--ink-200)]">
            Pantau pendapatan, pengeluaran, produksi, dan penggajian dalam satu sistem yang terintegrasi.
          </p>
        </div>

        <ul aria-label="Siklus bisnis Lionmesh" className="mt-[var(--space-6)] mb-0 flex list-none flex-col gap-[var(--space-3)] p-0">
          {CYCLES.map((cycle) => (
            <li className="flex min-h-[calc(var(--table-row-height)+var(--space-6))] items-center gap-[var(--space-3)] rounded-[var(--radius-lg)] border border-[var(--ink-700)] bg-[var(--ink-800)] px-[var(--space-4)] py-[var(--space-3)]" key={cycle.title}>
              <span className="inline-flex h-[calc(var(--control-height)+var(--space-1))] w-[calc(var(--control-height)+var(--space-1))] shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--ink-700)] text-[color:var(--brand-500)]">
                <CycleIcon name={cycle.icon} />
              </span>
              <span className="flex min-w-0 flex-col gap-[var(--space-1)]">
                <span className="text-[length:var(--font-size-body)] font-semibold leading-[var(--line-height-body)] text-[color:var(--text-inverse)]">{cycle.title}</span>
                <span className="text-[length:var(--font-size-body-sm)] leading-[var(--line-height-body-sm)] text-[color:var(--ink-200)]">{cycle.description}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>

      <p className="m-0 text-[length:var(--font-size-body-sm)] leading-[var(--line-height-body-sm)] text-[color:var(--ink-200)]">Akses internal · Aman dan terintegrasi</p>
    </aside>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen min-w-[calc(var(--layout-content-max)-var(--space-16)*2-var(--space-8))] bg-[var(--bg-app)] text-[color:var(--text-primary)]">
      <BrandPanel />
      <main className="flex min-h-screen min-w-0 flex-1 flex-col justify-between bg-[var(--bg-app)] px-[var(--space-12)] py-[var(--space-10)]">
        <div className="flex items-center justify-end gap-[var(--space-2)] text-[length:var(--font-size-body-sm)] leading-[var(--line-height-body-sm)] text-[color:var(--text-secondary)]">
          <HelpIcon />
          <span>Butuh bantuan? Hubungi IT</span>
        </div>

        <section aria-labelledby="login-title" className="my-auto w-full max-w-[calc(var(--dialog-form-width)+var(--space-5)*2)] self-center">
          <header className="mb-[var(--space-8)]">
            <span className="inline-flex min-h-[var(--button-sm-height)] items-center rounded-[var(--radius-full)] bg-[var(--brand-50)] px-[var(--space-3)] text-[length:var(--font-size-label)] font-semibold uppercase tracking-[var(--letter-spacing-caption)] text-[color:var(--brand-700)]">Portal internal</span>
            <h1 className="mt-[var(--space-4)] mb-0 text-[calc(var(--font-size-display)+var(--space-1))] font-bold leading-[calc(var(--line-height-display)+var(--space-1))] tracking-[-0.02em] text-[color:var(--text-primary)]" id="login-title">Selamat datang kembali</h1>
            <p className="mt-[var(--space-2)] mb-0 text-[length:var(--font-size-body)] leading-[var(--line-height-body)] text-[color:var(--text-secondary)]">Masuk untuk melanjutkan pekerjaan Anda di Lionmesh SIA.</p>
          </header>

          <Suspense fallback={null}>
            <AuthError />
          </Suspense>
          <AuthForm />

          <div className="mt-[var(--space-5)] flex items-center gap-[var(--space-3)] rounded-[var(--radius-md)] bg-[var(--bg-subtle)] px-[var(--space-4)] py-[var(--space-3)] text-[length:var(--font-size-body-sm)] leading-[var(--line-height-body-sm)] text-[color:var(--text-secondary)]">
            <SecurityIcon />
            <span>Gunakan akun perusahaan Anda. Akses dan aktivitas dicatat untuk menjaga keamanan data bisnis.</span>
          </div>
          <p className="mt-[var(--space-5)] mb-0 text-[length:var(--font-size-body-sm)] leading-[var(--line-height-body-sm)] text-[color:var(--text-secondary)]">Tidak dapat masuk? Hubungi administrator sistem.</p>
        </section>

        <footer className="w-full max-w-[calc(var(--dialog-form-width)+var(--space-5)*2)] self-center text-[length:var(--font-size-body-sm)] leading-[var(--line-height-body-sm)] text-[color:var(--text-muted)]">
          © 2026 PT Lionmesh Prima Tbk. Seluruh hak dilindungi.
        </footer>
      </main>
    </div>
  );
}
