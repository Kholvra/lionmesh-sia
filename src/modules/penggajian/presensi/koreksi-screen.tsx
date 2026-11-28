import { Suspense } from "react";

import { sesiPenggajian } from "@/modules/penggajian/akun/akun";
import { formatWaktu } from "@/modules/penggajian/karyawan/format";
import { listPeriodeTerbaru } from "@/modules/penggajian/periode/queries";
import { correctClosedPresensi } from "@/modules/penggajian/presensi/koreksi-actions";
import { listKaryawanAktifUntukCatat } from "@/modules/penggajian/presensi/queries";
import { LABEL_KEHADIRAN } from "@/modules/penggajian/presensi/status";
import { KEHADIRAN } from "@/modules/penggajian/presensi/types";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { FormAksi } from "@/modules/penggajian/shared/form-aksi";
import { Keadaan, TidakBerwenang } from "@/modules/penggajian/shared/states";

async function Konten() {
  const sesi = await sesiPenggajian();
  if (sesi.peran !== "HR") return <TidakBerwenang pesan="Koreksi periode tertutup diajukan HR dengan otorisasi khusus Manajemen." />;
  const tertutup = (await listPeriodeTerbaru()).filter((p) => p.status === "REKAP");
  if (tertutup.length === 0) {
    return <Keadaan judul="Tidak ada periode berstatus Rekap" pesan="Koreksi ini hanya untuk periode yang sudah direkap. Periode Terbuka diperbaiki lewat Presensi atas nama." />;
  }
  const otorisasi = tertutup.flatMap((p) =>
    p.otorisasi.filter((o) => o.dipakaiPada === null).map((o) => ({ value: o.id, label: `${p.nama} · ${o.oleh} · ${formatWaktu(o.pada)}` })),
  );
  return (
    <>
      {tertutup.map((p) => (
        <Notice key={p.id} title={`Periode ${p.nama} sudah Rekap`} tone="warning">
          <p>Entri biasa ditolak. Koreksi hanya oleh HR dengan otorisasi khusus Manajemen; periode kembali Terbuka dan rekap perlu disimpan ulang.</p>
        </Notice>
      ))}
      <FormAksi
        aksi={correctClosedPresensi}
        batalHref="/penggajian/presensi"
        isian={[
          { name: "karyawanId", label: "Karyawan", jenis: "pilihan", wajib: true, pilihan: (await listKaryawanAktifUntukCatat(sesi)).map((o) => ({ value: o.id, label: `${o.nama} · ${o.nik}` })) },
          { name: "tanggal", label: "Tanggal", jenis: "date", wajib: true },
          { name: "kehadiran", label: "Status baru", jenis: "pilihan", wajib: true, pilihan: KEHADIRAN.map((k) => ({ value: k, label: LABEL_KEHADIRAN[k] })) },
          {
            name: "otorisasiId",
            label: "Otorisasi Manajemen",
            jenis: "pilihan",
            wajib: true,
            pilihan: otorisasi,
            bantuan: otorisasi.length === 0 ? "Belum ada otorisasi. Minta Manajemen memberi otorisasi di halaman Periode penggajian." : undefined,
          },
          { name: "alasan", label: "Alasan", wajib: true, contoh: "Cuti tahunan sudah disetujui tetapi tercatat Alpha" },
          { name: "jamMasuk", label: "Jam masuk", jenis: "time", bantuan: "Wajib bila status baru Hadir." },
          { name: "jamPulang", label: "Jam pulang", jenis: "time" },
        ]}
        judul="Koreksi"
        kirimLabel="Simpan koreksi"
      />
    </>
  );
}

export function KoreksiPresensiScreen() {
  return (
    <>
      <PageHeader back={{ href: "/penggajian/presensi", label: "Presensi & lembur" }} breadcrumb={[{ label: "Siklus Penggajian", accent: true }, "GJ-002 Mencatat presensi dan lembur"]} title="Koreksi presensi periode tertutup" variant="page" />
      <Suspense fallback={null}>
        <Konten />
      </Suspense>
    </>
  );
}
