"use client";

import { useRouter } from "next/navigation";

import styles from "@/components/auth.module.css";
import { createClient } from "@/lib/supabase/client";

export function SignOutButton({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
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
  );
}
