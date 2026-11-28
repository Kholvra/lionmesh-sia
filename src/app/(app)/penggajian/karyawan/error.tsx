"use client";

import { ErrorState } from "@/components/ui/states";
import type { RouteErrorProps } from "@/lib/route-error-props";

export default function KaryawanError({ reset }: RouteErrorProps) {
  return (
    <ErrorState
      judul="Data karyawan gagal dimuat"
      teks="Tidak ada data yang berubah. Coba muat ulang halaman ini."
      onRetry={reset}
      variant="compact"
    />
  );
}
