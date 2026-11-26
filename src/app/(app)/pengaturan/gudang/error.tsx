"use client";

import { MasterError } from "@/modules/core/master/components/master-error";

type MasterErrorProps = {
  reset: () => void;
};

export default function Error({ reset }: MasterErrorProps) {
  return (
    <MasterError
      judul="Master gagal dimuat"
      reset={reset}
      teks="Terjadi kesalahan saat memuat data master. Coba muat ulang halaman ini."
    />
  );
}
