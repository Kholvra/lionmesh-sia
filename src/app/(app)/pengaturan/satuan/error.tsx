"use client";

import { ErrorState } from "@/components/ui/states";
import type { RouteErrorProps } from "@/lib/route-error-props";

export default function Error({ reset }: RouteErrorProps) {
  return (
    <ErrorState
      judul="Master gagal dimuat"
      reset={reset}
      teks="Terjadi kesalahan saat memuat data master. Coba muat ulang halaman ini."
    />
  );
}
