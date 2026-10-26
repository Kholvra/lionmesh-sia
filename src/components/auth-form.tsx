"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import { createClient } from "@/lib/supabase/client";

type Mode = "sign-in" | "sign-up";

export function AuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback`;
      const result =
        mode === "sign-in"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              options: { emailRedirectTo: redirectTo },
            });

      if (result.error) {
        throw result.error;
      }

      if (mode === "sign-up" && !result.data.session) {
        setMessage("cek email kamu untuk konfirmasi akun.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "terjadi kesalahan yang tidak diketahui.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur">
      <div className="mb-6 flex gap-2 rounded-xl bg-black/20 p-1 text-sm">
        {(["sign-in", "sign-up"] as const).map((nextMode) => (
          <button
            className={`flex-1 rounded-lg px-3 py-2 transition ${
              mode === nextMode
                ? "bg-white text-slate-950"
                : "text-slate-300 hover:bg-white/10"
            }`}
            key={nextMode}
            onClick={() => {
              setMode(nextMode);
              setError(null);
              setMessage(null);
            }}
            type="button"
          >
            {nextMode === "sign-in" ? "masuk" : "daftar"}
          </button>
        ))}
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm text-slate-300">
          email
          <input
            autoComplete="email"
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            required
            type="email"
            value={email}
          />
        </label>

        <label className="block text-sm text-slate-300">
          password
          <input
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            className="mt-2 w-full rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-300"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="minimal 6 karakter"
            required
            type="password"
            value={password}
          />
        </label>

        {error ? (
          <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-200">
            {message}
          </p>
        ) : null}

        <button
          className="w-full rounded-xl bg-cyan-300 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          type="submit"
        >
          {isLoading
            ? "memproses..."
            : mode === "sign-in"
              ? "masuk"
              : "buat akun"}
        </button>
      </form>
    </div>
  );
}
