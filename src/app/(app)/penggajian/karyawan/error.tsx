"use client";

import { ErrorState } from "@/components/ui/states";

export default function KaryawanError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      judul="Data karyawan gagal dimuat"
      teks="Tidak ada data yang berubah. Coba muat ulang halaman ini."
      onRetry={reset}
      variant="compact"
    />
  );
}
