import { Suspense } from "react";

import { sesiPenggajian } from "@/modules/penggajian/akun/akun";
import { formatTanggal } from "@/modules/penggajian/karyawan/format";
import { getLembur } from "@/modules/penggajian/presensi/queries";
import { fixLembur } from "@/modules/penggajian/rekap/actions";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { ui } from "@/modules/penggajian/ui/kelas";
import { KartuBaca } from "@/modules/penggajian/shared/bidang-baca";
import { FormAksi } from "@/modules/penggajian/shared/form-aksi";
import { Keadaan, TidakBerwenang } from "@/modules/penggajian/shared/states";
import { ALUR_REKAP, langkahRekap, Stepper } from "@/modules/penggajian/shared/stepper";
import { formatDurasi } from "@/modules/penggajian/shared/waktu";

const ITEM = "GJ-003 Merekap presensi dan lembur";

async function Konten({ id }: { id: string }) {
  const sesi = await sesiPenggajian();
  const judul = <PageHeader breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]} title="Perbaiki lembur" variant="page" />;
  if (sesi.peran !== "HR") return <>{judul}<TidakBerwenang pesan="Hanya HR yang memperbaiki lembur atas nama karyawan." /></>;
  const lembur = await getLembur(sesi, id);
  if (!lembur) return <>{judul}<Keadaan judul="Pengajuan lembur tidak ditemukan" pesan="Tautannya mungkin salah." /></>;
  const jam = lembur.menit % 60 === 0 ? String(lembur.menit / 60) : `${Math.floor(lembur.menit / 60)}:${String(lembur.menit % 60).padStart(2, "0")}`;
  return (
    <>
      <PageHeader
        back={{ href: `/penggajian/lembur/${id}`, label: "Detail lembur" }}
        description="Periode Terbuka setelah rekap dikembalikan, jadi HR bisa memperbaiki entri atas nama karyawan."
        breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]}
        variant="page"
        title={`Perbaiki lembur ${lembur.orang.nama}`}
      />
      <div className={ui.stack}>
        {lembur.periode ? <Stepper aktif={langkahRekap(lembur.periode.status)} langkah={ALUR_REKAP} /> : null}
        <Notice title={`Perbaikan tercatat sebagai input HR atas nama ${lembur.orang.nama}, lengkap dengan alasan, di riwayat status.`} tone="warning" />
        <FormAksi
          aksi={fixLembur.bind(null, id)}
          atas={
            <KartuBaca
              bidang={[
                ["Karyawan", `${lembur.orang.nama} · ${lembur.orang.nik}`],
                ["Tanggal lembur", formatTanggal(lembur.tanggal)],
                ["Sebelumnya", `${formatDurasi(lembur.menit)} · ${lembur.nomorSpl}`],
                ["Rekap", lembur.periode ? `${lembur.periode.nama} · Departemen ${lembur.orang.departemen}` : "—"],
              ]}
              judul="Sebelum perbaikan"
            />
          }
          batalHref={`/penggajian/lembur/${id}`}
          isian={[
            { name: "durasi", label: "Jumlah jam lembur", wajib: true, awal: jam },
            { name: "nomorSpl", label: "Nomor SPL", wajib: true, awal: lembur.nomorSpl },
            { name: "alasan", label: "Alasan perbaikan", wajib: true, lebar: true, contoh: "Menyesuaikan jam lembur dengan SPL sesuai pengembalian Supervisor" },
          ]}
          judul="Catatan perbaikan"
          kirimLabel="Simpan perbaikan"
        />
      </div>
    </>
  );
}

export function PerbaikiLemburScreen({ id }: { id: string }) {
  return (
    <Suspense fallback={<PageHeader breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]} title="Perbaiki lembur" variant="page" />}>
      <Konten id={id} />
    </Suspense>
  );
}
