"use client";

import { ErrorState } from "@/components/ui/states";

type NotifikasiErrorProps = {
  reset: () => void;
};

export default function NotifikasiError({ reset }: NotifikasiErrorProps) {
  return (
    <ErrorState
      judul="Notifikasi gagal dimuat"
      reset={reset}
      teks="Terjadi kesalahan saat memuat daftar notifikasi. Coba muat ulang halaman ini."
    />
  );
}
