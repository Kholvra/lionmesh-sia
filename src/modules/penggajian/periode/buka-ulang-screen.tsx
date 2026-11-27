import { Suspense } from "react";

import { sesiPenggajian } from "@/modules/penggajian/akun/akun";
import { formatWaktu } from "@/modules/penggajian/karyawan/format";
import { reopenPeriode } from "@/modules/penggajian/periode/actions";
import { labelStatusPeriode } from "@/modules/penggajian/periode/rules";
import { semuaPeriode } from "@/modules/penggajian/periode/queries";
import { PageHeader } from "@/modules/penggajian/ui/page-header";
import { KartuBaca } from "@/modules/penggajian/shared/bidang-baca";
import { FormAksi } from "@/modules/penggajian/shared/form-aksi";
import { Keadaan, TidakBerwenang } from "@/modules/penggajian/shared/states";

async function Konten({ periodeId }: { periodeId?: string }) {
  const sesi = await sesiPenggajian();
  if (sesi.peran !== "HR") return <TidakBerwenang pesan="Buka ulang periode diajukan HR dengan otorisasi khusus Manajemen." />;
  const periode = periodeId ? (await semuaPeriode()).find((p) => p.id === periodeId) : undefined;
  if (!periode || periode.status !== "TERVALIDASI") {
    return <Keadaan judul="Periode tidak bisa dibuka ulang" pesan="Buka ulang hanya untuk periode berstatus Tervalidasi." />;
  }
  const otorisasi = periode.otorisasi.filter((o) => o.dipakaiPada === null).map((o) => ({ value: o.id, label: `${o.oleh} · ${formatWaktu(o.pada)}` }));
  return (
    <FormAksi
      aksi={reopenPeriode}
      atas={<KartuBaca bidang={[["Status", labelStatusPeriode(periode.status)], ["Periode", periode.nama]]} judul="Periode" />}
      batalHref={`/penggajian/rekap?periode=${periode.id}`}
      isian={[
        { name: "alasan", label: "Alasan", wajib: true, contoh: "Lembur Siti 18 Nov belum masuk rekap" },
        {
          name: "otorisasiId",
          label: "Otorisasi Manajemen",
          jenis: "pilihan",
          wajib: true,
          pilihan: otorisasi,
          bantuan: otorisasi.length === 0 ? "Belum ada otorisasi. Minta Manajemen memberi otorisasi di halaman Periode penggajian." : undefined,
        },
      ]}
      judul="Permintaan"
      kirimLabel="Buka ulang ke Rekap"
      petunjuk="Periode kembali ke Rekap dan setiap departemen memvalidasi ulang. Tidak bisa dilakukan setelah draft disetujui Direksi."
      tersembunyi={{ periodeId: periode.id }}
    />
  );
}

export function BukaUlangScreen({ periodeId }: { periodeId?: string }) {
  return (
    <>
      <PageHeader
        back={{ href: `/penggajian/rekap${periodeId ? `?periode=${periodeId}` : ""}`, label: "Rekap presensi & lembur" }}
        item="GJ-003 Memvalidasi presensi dan lembur"
        title="Buka ulang periode"
      />
      <Suspense fallback={null}>
        <Konten periodeId={periodeId} />
      </Suspense>
    </>
  );
}
