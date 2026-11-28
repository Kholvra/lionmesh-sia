import Link from "next/link";
import { Suspense } from "react";

import { StatusBadge } from "@/components/ui";
import { sesiPenggajian } from "@/modules/penggajian/akun/akun";
import { formatRupiah, formatWaktu, samarkanRekening } from "@/modules/penggajian/karyawan/format";
import { recordDanaKurang, sendBatch } from "@/modules/penggajian/pembayaran/actions";
import { aksesPembayaran, getPembayaran } from "@/modules/penggajian/pembayaran/queries";
import type { BarisPembayaran, PembayaranView } from "@/modules/penggajian/pembayaran/queries";
import { BUKTI_TIPE } from "@/modules/penggajian/pembayaran/rules";
import { HASIL_TRANSFER, STATUS_TRANSFER } from "@/modules/penggajian/pembayaran/status";
import { KartuAngka } from "@/modules/penggajian/shared/kartu-angka";
import { STATUS_DRAFT } from "@/modules/penggajian/payroll/status";
import { PilihPeriode } from "@/modules/penggajian/presensi/components/pilih-periode";
import { getPeriodeDipilih, listPeriode } from "@/modules/penggajian/presensi/queries";
import { Notice } from "@/modules/penggajian/ui/notice";
import { PageHeader } from "@/modules/penggajian/ui/page-header";
import { ui } from "@/modules/penggajian/ui/kelas";
import { FormAksi } from "@/modules/penggajian/shared/form-aksi";
import type { IsianForm } from "@/modules/penggajian/shared/form-aksi";
import { Keadaan, TidakBerwenang } from "@/modules/penggajian/shared/states";
import { TabelData, TabelMemuat } from "@/modules/penggajian/shared/tabel-data";
import type { KolomTabel } from "@/modules/penggajian/shared/tabel-data";

const PESAN: Record<string, string> = {
  batch: "Batch transfer tercatat. Status per karyawan sudah diperbarui.",
  ulang: "Percobaan ulang tercatat dengan alasan.",
  dana: "Batch tidak diproses karena dana tidak cukup. Status draft tetap Disetujui.",
};

function kolom(view: PembayaranView, rekening: boolean, nominal: boolean): KolomTabel[] {
  return [
    { id: "karyawan", header: "Karyawan", urut: true },
    ...(rekening ? [{ id: "rekening", header: "Rekening tersamarkan" }] : []),
    ...(nominal ? [{ id: "nominal", header: "Neto", align: "right" as const }] : []),
    { id: "status", header: "Status" },
    { id: "jejak", header: "Percobaan" },
    ...(view.statusDraft ? [{ id: "aksi", header: "Aksi", align: "right" as const }] : []),
  ];
}

function sel(b: BarisPembayaran, periodeId: string, bayar: boolean) {
  const terakhir = b.percobaan.at(-1);
  return {
    karyawan: `${b.nama} · ${b.nik}`,
    rekening: b.rekening ? `${b.rekening.namaBank || "—"} · ${samarkanRekening(b.rekening.nomor)}` : "—",
    nominal: b.nominal !== undefined ? <span className={ui.numeric}>{formatRupiah(b.nominal)}</span> : "—",
    status: <StatusBadge status={b.status} statuses={STATUS_TRANSFER} />,
    jejak: terakhir ? `${b.percobaan.length}× · ref ${terakhir.referensi || "—"} · ${formatWaktu(terakhir.pada)}` : b.masalahRekening ?? "—",
    aksi: bayar && b.status === "GAGAL_TRANSFER"
      ? <Link className={ui.buttonSmall} href={`/penggajian/pembayaran/${periodeId}/${b.karyawanId}/ulang`}>Coba ulang</Link>
      : null,
  };
}

function FormBatch({ periodeId, view }: { periodeId: string; view: PembayaranView }) {
  const masuk = view.baris.filter((b) => b.status === "BELUM");
  if (masuk.length === 0 || !view.statusDraft || !["DISETUJUI", "GAGAL_TRANSFER"].includes(view.statusDraft)) return null;
  const isian: IsianForm[] = [
    { name: "bukti", label: "Bukti transfer batch", jenis: "file", wajib: true, terima: BUKTI_TIPE.join(","), lebar: true, bantuan: "PDF, PNG, atau JPG, paling besar 10 MB." },
    ...masuk.flatMap((b): IsianForm[] => [
      { name: `hasil_${b.karyawanId}`, label: `Hasil transfer ${b.nama}`, jenis: "pilihan", wajib: true, pilihan: [...HASIL_TRANSFER] },
      { name: `ref_${b.karyawanId}`, label: `Referensi bank ${b.nama}`, contoh: "TRF-20261125-001" },
    ]),
  ];
  return <FormAksi aksi={sendBatch} isian={isian} judul={`Konfirmasi hasil transfer (${masuk.length} karyawan)`} kirimLabel="Konfirmasi pembayaran" petunjuk="Cocokkan hasil bank sebelum mengonfirmasi. Karyawan yang gagal diproses ulang terpisah dengan alasan." tersembunyi={{ periodeId }} />;
}

async function Konten({ periodeId, pesan }: { periodeId?: string; pesan?: string }) {
  const sesi = await sesiPenggajian();
  const akses = aksesPembayaran(sesi);
  if (!akses.membaca) return <TidakBerwenang pesan="Pembayaran gaji dibuka Finance, Accounting, HR, dan Direksi (ringkasan)." />;
  const periode = await getPeriodeDipilih(periodeId);
  if (!periode) return <Keadaan judul="Belum ada periode penggajian" pesan="Periode dibuat HR lebih dulu." />;
  const view = await getPembayaran(sesi, periode.id);
  if (!view) return null;
  const masalah = view.baris.filter((b) => b.masalahRekening && b.status === "DITUNDA");
  const total = view.baris.reduce((t, b) => t + (b.nominal ?? 0), 0);
  const STATUS_TEKS: Record<string, string> = {
    DISETUJUI: "Payroll disetujui Direksi. Status: belum dibayar.",
    GAGAL_TRANSFER: "Ada transfer gagal. Proses ulang hanya karyawan yang gagal; transfer berhasil tidak diulang.",
    DIBAYAR: "Semua transfer terkonfirmasi.",
  };
  return (
    <div className={ui.stack}>
      {pesan && PESAN[pesan] ? <Notice title={PESAN[pesan]} tone={pesan === "dana" ? "warning" : "success"} /> : null}
      <div className={ui.cardHeader}>
        <PilihPeriode action="/penggajian/pembayaran" dipilih={periode.id} periode={await listPeriode()} />
        <StatusBadge status={view.statusDraft ?? "BELUM"} statuses={STATUS_DRAFT} />
      </div>
      {!view.statusDraft ? <Keadaan judul="Belum ada payroll untuk periode ini" pesan="Pembayaran dibuka setelah payroll disetujui Direksi." /> : null}
      {view.statusDraft && STATUS_TEKS[view.statusDraft] ? <Notice title={STATUS_TEKS[view.statusDraft]} tone={view.statusDraft === "GAGAL_TRANSFER" ? "danger" : view.statusDraft === "DIBAYAR" ? "success" : "warning"} /> : null}
      {view.statusDraft && !["DISETUJUI", "GAGAL_TRANSFER", "DIBAYAR", "DIPOSTING"].includes(view.statusDraft) ? (
        <Notice title="Payroll belum disetujui Direksi. Batch transfer baru bisa dicatat setelah persetujuan." tone="info" />
      ) : null}
      {view.statusDraft ? (
        <KartuAngka
          isi={[
            ["Penerima", String(view.baris.length || view.jumlah.dibayar + view.jumlah.gagal + view.jumlah.belum)],
            ...(akses.nominal ? [["Total transfer", formatRupiah(total)] as [string, string]] : [["Dibayar", String(view.jumlah.dibayar)] as [string, string]]),
            ["Periode", periode.nama],
          ]}
        />
      ) : null}
      {view.catatanDana.map((c) => <Notice key={c.pada} title={`Batch tidak diproses · ${formatWaktu(c.pada)}`} tone="warning"><p>{c.catatan} — dicatat {c.oleh}</p></Notice>)}
      {akses.perKaryawan && view.baris.length > 0 ? (
        <section className={ui.card}>
          <h2 className={ui.cardTitle}>Daftar transfer</h2>
          <TabelData
            baris={view.baris.map((b) => ({ key: b.karyawanId, nilaiUrut: { karyawan: b.nama }, cells: sel(b, periode.id, akses.bayar) }))}
            caption={`Pembayaran ${periode.nama}`}
            kolom={kolom(view, akses.rekening, akses.nominal)}
            pesanKosong="Belum ada karyawan."
          />
        </section>
      ) : null}
      {view.batch.length > 0 ? (
        <section className={ui.card}>
          <h2 className={ui.cardTitle}>Bukti pembayaran</h2>
          <ol className={ui.timeline}>
            {[...view.batch].reverse().map((b) => (
              <li key={b.id}>
                <span>{b.ulang ? "Transfer ulang" : "Batch"} · {b.jumlahKaryawan} karyawan · {b.bukti.nama} ({Math.ceil(b.bukti.ukuran / 1024)} KB)</span>
                <span className={ui.timelineMeta}>{b.oleh} · {formatWaktu(b.pada)}</span>
              </li>
            ))}
          </ol>
          <p className={ui.cardHint}>Sistem tidak terhubung ke bank; bukti diunggah Finance dari hasil transfer.</p>
        </section>
      ) : null}
      {akses.bayar ? <FormBatch periodeId={periode.id} view={view} /> : null}
      {akses.bayar && view.statusDraft === "DISETUJUI" && view.jumlah.dibayar === 0 ? (
        <FormAksi aksi={recordDanaKurang} isian={[{ name: "catatan", label: "Catatan", contoh: "Saldo rekening operasional kurang" }]} judul="Dana tidak cukup" kirimLabel="Catat dana tidak cukup" tersembunyi={{ periodeId: periode.id }} />
      ) : null}
      {akses.rekening && view.statusDraft ? (
        <section className={ui.card}>
          <h2 className={ui.cardTitle}>Rekening bermasalah</h2>
          {masalah.length === 0 ? (
            <p className={ui.cardHint}>Tidak ada rekening bermasalah. Karyawan dengan rekening tidak lengkap ditunda dan tidak masuk batch.</p>
          ) : (
            <table className={ui.table}>
              <caption className="sr-only">Rekening bermasalah</caption>
              <thead><tr><th scope="col">Karyawan</th><th scope="col">Masalah</th><th scope="col">Tindak lanjut</th></tr></thead>
              <tbody>
                {masalah.map((b) => (
                  <tr key={b.karyawanId}><td>{b.nama} · {b.nik}</td><td>{b.masalahRekening}</td><td><Link href={`/penggajian/karyawan/${b.karyawanId}/ubah`}>Perbaiki di data karyawan →</Link></td></tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ) : null}
    </div>
  );
}

export function PembayaranScreen({ periodeId, pesan }: { periodeId?: string; pesan?: string }) {
  return (
    <>
      <PageHeader description="Cocokkan hasil bank sebelum mengonfirmasi pembayaran. Satu batch per periode; karyawan yang sudah dibayar tidak masuk batch lagi." item="GJ-006 Membayar gaji dan menerbitkan slip" title="Pembayaran gaji" />
      <Suspense fallback={<TabelMemuat caption="Memuat pembayaran" kolom={[{ id: "k", header: "Karyawan" }, { id: "s", header: "Status" }]} />}>
        <Konten periodeId={periodeId} pesan={pesan} />
      </Suspense>
    </>
  );
}
