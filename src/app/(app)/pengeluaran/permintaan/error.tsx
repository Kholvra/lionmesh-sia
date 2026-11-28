"use client";

import { ErrorState } from "@/components/ui/states";
import type { RouteErrorProps } from "@/lib/route-error-props";

export default function PermintaanError({ reset }: RouteErrorProps) {
  return (
    <ErrorState
      judul="Permintaan gagal dimuat"
      reset={reset}
      teks="Terjadi kesalahan saat memuat permintaan pembelian. Coba muat ulang."
    />
  );
}
