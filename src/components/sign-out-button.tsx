"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import styles from "@/components/auth.module.css";
import { signOutAction } from "@/lib/auth/server";

export function SignOutButton({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  async function signOut() {
    setError(null);
    try {
      const result = await signOutAction();
      if (!result.ok) {
        setError(result.message);
        return;
      }
      router.push("/login");
      router.refresh();
    } catch {
      setError("Gagal keluar. Silakan coba lagi.");
    }
  }

  return (
    <>
      <button
        className={
          variant === "light"
            ? styles.signOutLight
            : "rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:border-white/30 hover:bg-white/10"
        }
        onClick={signOut}
        type="button"
      >
        {variant === "light" ? "Keluar" : "keluar"}
      </button>
      {error && <p className={styles.error} role="alert">{error}</p>}
    </>
  );
}
