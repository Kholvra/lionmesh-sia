import { Suspense } from "react";

import { sesiPenggajian } from "@/modules/penggajian/akun/akun";
import { formatRupiah, formatWaktu } from "@/modules/penggajian/karyawan/format";
import { overrideKomponen } from "@/modules/penggajian/payroll/actions";
import { cariDraft } from "@/modules/penggajian/payroll/store";
import { getBarisGaji } from "@/modules/penggajian/payroll/queries";
import type { Komponen } from "@/modules/penggajian/payroll/types";
import { Notice } from "@/modules/penggajian/ui/notice";
import { PageHeader } from "@/modules/penggajian/ui/page-header";
import { ui } from "@/modules/penggajian/ui/kelas";
import { FormAksi } from "@/modules/penggajian/shared/form-aksi";
import { Keadaan } from "@/modules/penggajian/shared/states";

function Baris({ k }: { k: Komponen }) {
  return (
    <tr>
      <td>
        {k.label}
        {k.koreksi ? <div className={ui.timelineMeta}>Dikoreksi {k.koreksi.oleh} · {formatWaktu(k.koreksi.pada)} · semula {formatRupiah(k.koreksi.nilaiSemula)} · {k.koreksi.alasan}</div> : null}
      </td>
      <td>{k.dasar}</td>
      <td>{k.versiTarif ?? "Histori gaji pokok"}</td>
      <td className={`${ui.right} ${ui.numeric}`}>{k.jenis === "kurang" ? "−" : ""}{formatRupiah(k.nilai)}</td>
    </tr>
  );
}

async function Konten({ periodeId, karyawanId, pesan }: { periodeId: string; karyawanId: string; pesan?: string }) {
  const sesi = await sesiPenggajian();
  const baris = getBarisGaji(sesi, periodeId, karyawanId);
  if (!baris) return <Keadaan judul="Rincian tidak tersedia" pesan="Rincian per karyawan hanya untuk HR dan Accounting, dan hanya bila draft sudah dihitung." peringatan />;
  const draft = cariDraft(periodeId);
  const bisaKoreksi = sesi.peran === "HR" && (draft?.status === "DRAFT_TERHITUNG" || draft?.status === "REVISI");
  return (
    <div className={ui.stack}>
      {pesan === "dikoreksi" ? <Notice title="Koreksi tersimpan dengan alasan, pelaku, dan waktu." tone="success" /> : null}
      {baris.perluPenyesuaianTahunan ? (
        <Notice title="PPh 21 masa pajak terakhir: perlu penyesuaian tahunan" tone="warning">
          <p>Nilai di bawah masih dari TER. Isi nilai manual hasil penyesuaian tahunan dengan alasan lewat koreksi komponen PPh 21.</p>
        </Notice>
      ) : null}
      <section className={ui.card}>
        <h2 className={ui.cardTitle}>{baris.nama} · {baris.nik} · {baris.departemen}</h2>
        <table className={ui.table}>
          <caption className="sr-only">Komponen gaji {baris.nama}</caption>
          <thead>
            <tr><th scope="col">Komponen</th><th scope="col">Dasar hitung</th><th scope="col">Versi tarif</th><th className={ui.right} scope="col">Nilai</th></tr>
          </thead>
          <tbody>
            {baris.komponen.map((k) => <Baris k={k} key={k.kode} />)}
            <tr><td><strong>Gaji bersih</strong></td><td>Penambah {formatRupiah(baris.totalTambah)} − potongan {formatRupiah(baris.totalKurang)}</td><td>—</td><td className={`${ui.right} ${ui.numeric}`}><strong>{formatRupiah(baris.neto)}</strong></td></tr>
            <tr><td>Selisih pembulatan</td><td>Hitungan mentah dikurangi hasil pembulatan per komponen</td><td>—</td><td className={`${ui.right} ${ui.numeric}`}>{baris.selisihPembulatan.toLocaleString("id-ID")}</td></tr>
          </tbody>
        </table>
      </section>
      {bisaKoreksi ? (
        <FormAksi
          aksi={overrideKomponen.bind(null, periodeId, karyawanId)}
          isian={[
            { name: "kode", label: "Komponen", jenis: "pilihan", wajib: true, pilihan: baris.komponen.map((k) => ({ value: k.kode, label: k.label })) },
            { name: "nilai", label: "Nilai baru (rupiah)", wajib: true, contoh: "350000" },
            { name: "alasan", label: "Alasan koreksi", wajib: true, lebar: true },
          ]}
          judul="Koreksi manual komponen"
          kirimLabel="Simpan koreksi"
        />
      ) : null}
    </div>
  );
}

export function RincianGajiScreen({ periodeId, karyawanId, pesan }: { periodeId: string; karyawanId: string; pesan?: string }) {
  return (
    <>
      <PageHeader back={{ href: `/penggajian/payroll?periode=${periodeId}`, label: "Draft payroll" }} item="GJ-004 Menghitung payroll" title="Rincian gaji karyawan" />
      <Suspense fallback={null}>
        <Konten karyawanId={karyawanId} periodeId={periodeId} pesan={pesan} />
      </Suspense>
    </>
  );
}
