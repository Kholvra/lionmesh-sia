"use client";

import { ErrorState } from "@/components/ui/states";

type PemasokErrorProps = {
  reset: () => void;
};

export default function PemasokError({ reset }: PemasokErrorProps) {
  return (
    <ErrorState
      judul="Data pemasok gagal dimuat"
      reset={reset}
      teks="Terjadi kesalahan saat memuat master pemasok. Coba muat ulang halaman ini."
    />
  );
}
