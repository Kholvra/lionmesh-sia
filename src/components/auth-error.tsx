"use client";

import { useSearchParams } from "next/navigation";

import styles from "@/components/auth.module.css";

export function AuthError() {
  const searchParams = useSearchParams();
  if (!searchParams.get("error")) return null;
  return <p className={styles.error} role="alert">Sesi Anda sudah berakhir. Silakan masuk lagi.</p>;
}
