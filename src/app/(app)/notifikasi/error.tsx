"use client";

import { ErrorState } from "@/components/ui/states";
import type { RouteErrorProps } from "@/lib/route-error-props";

export default function NotifikasiError({ reset }: RouteErrorProps) {
  return (
    <ErrorState
      judul="Notifikasi gagal dimuat"
      reset={reset}
      teks="Terjadi kesalahan saat memuat daftar notifikasi. Coba muat ulang halaman ini."
    />
  );
}
