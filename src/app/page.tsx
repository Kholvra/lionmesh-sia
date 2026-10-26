import Link from "next/link";

import { SignOutButton } from "@/components/sign-out-button";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

async function getCurrentUser() {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export default async function Home() {
  const user = await getCurrentUser();
  const configured = isSupabaseConfigured();

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-[70vh] max-w-6xl flex-col justify-center px-6 py-20 sm:px-10">
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold tracking-[0.28em] text-cyan-300">
            LIONMESH SIA
          </span>
          {user ? <SignOutButton /> : null}
        </div>

        <div className="mt-20 max-w-3xl">
          <p className="mb-5 text-sm uppercase tracking-[0.2em] text-slate-400">
            academic information system
          </p>
          <h1 className="text-5xl font-semibold tracking-tight sm:text-7xl">
            satu fondasi untuk data akademik yang rapi.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Starter project Next.js dengan database PostgreSQL dan autentikasi
            Supabase yang sudah disiapkan untuk dikembangkan.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            {user ? (
              <div className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm text-emerald-200">
                masuk sebagai {user.email}
              </div>
            ) : (
              <Link
                className="rounded-full bg-cyan-300 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200"
                href="/login"
              >
                coba auth Supabase
              </Link>
            )}
            <span className="text-sm text-slate-500">
              {configured
                ? "Supabase env terdeteksi"
                : "salin .env.example untuk mengaktifkan Supabase"}
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 sm:grid-cols-3 sm:px-10">
        {[
          ["Next.js", "App Router + TypeScript"],
          ["Supabase Auth", "SSR cookie flow + PKCE"],
          ["Postgres", "profiles table + RLS migration"],
        ].map(([title, description]) => (
          <div
            className="rounded-2xl border border-white/10 bg-white/5 p-6"
            key={title}
          >
            <h2 className="font-medium">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-slate-400">
              {description}
            </p>
          </div>
        ))}
      </section>
    </main>
  );
}
