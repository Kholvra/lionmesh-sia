"use client";

import ui from "@/modules/penggajian/shell/ui.module.css";

export function KaryawanGagalDimuat({ onRetry }: { onRetry: () => void }) {
  return (
    <section className={`${ui.card} ${ui.empty}`} role="alert">
      <h2 className={ui.cardTitle}>Data karyawan gagal dimuat</h2>
      <p>Tidak ada data yang berubah. Coba muat ulang halaman ini.</p>
      <button className={ui.button} onClick={onRetry} type="button">
        Coba lagi
      </button>
    </section>
  );
}
