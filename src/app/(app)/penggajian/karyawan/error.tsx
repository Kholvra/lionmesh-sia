"use client";

import { KaryawanGagalDimuat } from "@/modules/penggajian/karyawan/components/gagal-dimuat";

export default function KaryawanError({ reset }: { error: Error; reset: () => void }) {
  return <KaryawanGagalDimuat onRetry={reset} />;
}
