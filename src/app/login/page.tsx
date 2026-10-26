import Link from "next/link";
import { Suspense } from "react";

import { AuthError } from "@/components/auth-error";
import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 py-12 text-white">
      <div className="mb-8 w-full max-w-md">
        <Link className="text-sm text-cyan-300 hover:text-cyan-200" href="/">
          ← kembali ke home
        </Link>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight">
          masuk ke lionmesh sia
        </h1>
        <p className="mt-2 text-slate-400">
          auth sudah terhubung ke Supabase. isi env lokal dulu sebelum submit.
        </p>
      </div>

      <Suspense fallback={null}>
        <AuthError />
      </Suspense>
      <AuthForm />
    </main>
  );
}
