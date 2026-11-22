"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import styles from "@/components/auth.module.css";
import { createClient } from "@/lib/supabase/client";

function MailIcon() {
  return (
    <svg aria-hidden="true" className="h-full w-full" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
      <rect height="16" rx="2" width="20" x="2" y="4" />
      <path d="m22 7-10 6L2 7" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" className="h-full w-full" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
      <rect height="11" rx="2" width="18" x="3" y="11" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4m-5 4v3" />
    </svg>
  );
}

function VisibilityIcon({ visible }: { visible: boolean }) {
  return visible ? (
    <svg aria-hidden="true" className="h-[var(--space-4)] w-[var(--space-4)]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg aria-hidden="true" className="h-[var(--space-4)] w-[var(--space-4)]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24">
      <path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.2A10.5 10.5 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-3.1 3.9M6.2 6.2C3.5 8 2 12 2 12s3.6 7 10 7c1.2 0 2.3-.3 3.3-.7" />
    </svg>
  );
}

export function AuthForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const result = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error || !result.data.user) throw new Error();

      const { data: profile, error: profileError } = await supabase
        .from("profiles").select("aktif").eq("id", result.data.user.id).single();
      if (profileError || !profile?.aktif) {
        await supabase.auth.signOut();
        throw new Error();
      }
      router.push("/pengaturan");
      router.refresh();
    } catch {
      setError("Username atau password salah.");
    } finally {
      setIsLoading(false);
    }
  }

  const inputClass = "h-[calc(var(--control-height)+var(--space-3))] w-full rounded-[var(--radius-md)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] py-0 pr-[var(--space-4)] pl-[var(--space-10)] text-[length:var(--font-size-body)] leading-[var(--line-height-body)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-muted)] hover:border-[var(--border-strong)] focus-visible:border-[var(--border-focus)] focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-[var(--focus-ring-offset)]";

  return (
    <form className="m-0 flex flex-col gap-[var(--space-6)]" onSubmit={handleSubmit}>
      <div className="flex flex-col gap-[var(--space-2)]">
        <label className="text-[length:var(--font-size-label)] leading-[var(--line-height-label)] font-semibold text-[color:var(--text-primary)]" htmlFor="email">Email perusahaan</label>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-[var(--space-3)] inline-flex h-[var(--space-4)] w-[var(--space-4)] text-[color:var(--ink-300)]"><MailIcon /></span>
          <input autoComplete="email" className={inputClass} id="email" onChange={(event) => setEmail(event.target.value)} placeholder="nama@lionmesh.com" required type="email" value={email} />
        </div>
      </div>

      <div className="flex flex-col gap-[var(--space-2)]">
        <label className="text-[length:var(--font-size-label)] leading-[var(--line-height-label)] font-semibold text-[color:var(--text-primary)]" htmlFor="password">Kata sandi</label>
        <div className="relative flex items-center">
          <span className="pointer-events-none absolute left-[var(--space-3)] inline-flex h-[var(--space-4)] w-[var(--space-4)] text-[color:var(--ink-300)]"><LockIcon /></span>
          <input autoComplete="current-password" className={`${inputClass} pr-[var(--icon-target-size)]`} id="password" onChange={(event) => setPassword(event.target.value)} required type={showPassword ? "text" : "password"} value={password} />
          <button aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"} aria-pressed={showPassword} className="absolute right-0 inline-flex h-[var(--icon-target-size)] w-[var(--icon-target-size)] cursor-pointer items-center justify-center rounded-[var(--radius-md)] border-0 bg-transparent text-[color:var(--ink-400)] hover:text-[color:var(--text-primary)] focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-[calc(var(--focus-ring-offset)*-1)]" onClick={() => setShowPassword(!showPassword)} type="button">
            <VisibilityIcon visible={showPassword} />
          </button>
        </div>
      </div>

      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className="flex min-h-[calc(var(--button-lg-height)+var(--space-2))] cursor-pointer items-center justify-center gap-[var(--space-2)] rounded-[var(--radius-md)] border-0 bg-[var(--brand-500)] px-[var(--space-4)] text-[length:var(--font-size-body)] font-semibold text-[color:var(--text-on-brand)] transition-colors duration-[var(--motion-fast)] hover:bg-[var(--brand-600)] focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-[var(--focus-ring-offset)] disabled:cursor-wait disabled:opacity-70" disabled={isLoading} type="submit">
        {isLoading ? "Memproses..." : "Masuk ke SIA"}
        {!isLoading && <svg aria-hidden="true" className="h-[var(--space-4)] w-[var(--space-4)]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M5 12h14m-7-7 7 7-7 7" /></svg>}
      </button>
    </form>
  );
}
