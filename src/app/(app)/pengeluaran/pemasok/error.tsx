"use client";

import { ErrorState } from "@/components/ui/states";
import type { RouteErrorProps } from "@/lib/route-error-props";

export default function PemasokError({ reset }: RouteErrorProps) {
  return (
    <ErrorState
      judul="Data pemasok gagal dimuat"
      reset={reset}
      teks="Terjadi kesalahan saat memuat master pemasok. Coba muat ulang halaman ini."
    />
  );
}
