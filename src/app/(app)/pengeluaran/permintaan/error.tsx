"use client";

import { ErrorState } from "@/components/ui/states";

type Props = { reset: () => void };

export default function PermintaanError({ reset }: Props) {
  return (
    <ErrorState
      judul="Permintaan gagal dimuat"
      reset={reset}
      teks="Terjadi kesalahan saat memuat permintaan pembelian. Coba muat ulang."
    />
  );
}
