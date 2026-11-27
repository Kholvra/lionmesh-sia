"use client";

import { ErrorState } from "@/components/ui/states";

type ErrorProps = {
  reset: () => void;
};

export default function Error({ reset }: ErrorProps) {
  return (
    <ErrorState
      judul="Master gagal dimuat"
      reset={reset}
      teks="Terjadi kesalahan saat memuat data master. Coba muat ulang halaman ini."
    />
  );
}
