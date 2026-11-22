"use client";

import type { FormEvent } from "react";
import { useState } from "react";
import { useRouter } from "next/navigation";

import styles from "@/components/auth.module.css";
import { createClient } from "@/lib/supabase/client";

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
      router.push("/");
      router.refresh();
    } catch {
      setError("Username atau password salah.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="email">Email perusahaan</label>
        <input id="email" autoComplete="email" type="email" value={email}
          onChange={(event) => setEmail(event.target.value)} required />
      </div>
      <div className={styles.field}>
        <label htmlFor="password">Kata sandi</label>
        <div className={styles.passwordRow}>
          <input id="password" autoComplete="current-password" type={showPassword ? "text" : "password"}
            value={password} onChange={(event) => setPassword(event.target.value)} required />
          <button className={styles.reveal} type="button" onClick={() => setShowPassword(!showPassword)}
            aria-pressed={showPassword}>{showPassword ? "Sembunyikan" : "Tampilkan"}</button>
        </div>
      </div>
      {error && <p className={styles.error} role="alert">{error}</p>}
      <button className={styles.submit} disabled={isLoading} type="submit">
        {isLoading ? "Memproses..." : "Masuk"}
      </button>
      <p className={styles.help}>Kesulitan masuk? Hubungi tim IT.</p>
    </form>
  );
}
