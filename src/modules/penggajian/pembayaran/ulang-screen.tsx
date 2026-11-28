import { Suspense } from "react";

import { StatusBadge } from "@/components/ui";
import { sesiPenggajian } from "@/modules/penggajian/akun/akun";
import { formatRupiah } from "@/modules/penggajian/karyawan/format";
import { retryTransfer } from "@/modules/penggajian/pembayaran/actions";
import { getPembayaran } from "@/modules/penggajian/pembayaran/queries";
import { BUKTI_TIPE } from "@/modules/penggajian/pembayaran/rules";
import { HASIL_TRANSFER, STATUS_TRANSFER } from "@/modules/penggajian/pembayaran/status";
import { Notice } from "@/modules/penggajian/ui/notice";
import { PageHeader } from "@/modules/penggajian/ui/page-header";
import { ui } from "@/modules/penggajian/ui/kelas";
import { FormAksi } from "@/modules/penggajian/shared/form-aksi";
import { Keadaan, TidakBerwenang } from "@/modules/penggajian/shared/states";

const ITEM = "GJ-006 Membayar gaji";
const TINDAKAN: Record<string, string> = { DIBAYAR: "Jangan transfer ulang", GAGAL_TRANSFER: "Periksa rekening", BELUM: "Menunggu batch", DITUNDA: "Perbaiki rekening" };

async function Konten({ periodeId, karyawanId }: { periodeId: string; karyawanId: string }) {
  const sesi = await sesiPenggajian();
  const view = await getPembayaran(sesi, periodeId);
  const baris = view?.baris.find((b) => b.karyawanId === karyawanId);
  const judul = <PageHeader item={ITEM} title="Periksa transfer gagal" />;
  if (sesi.peran !== "Finance") return <>{judul}<TidakBerwenang pesan="Transfer ulang dicatat Finance." /></>;
  if (!view || !baris) return <>{judul}<Keadaan judul="Data transfer tidak ditemukan" pesan="Tautannya mungkin salah." /></>;
  return (
    <>
      <PageHeader
        back={{ href: `/penggajian/pembayaran?periode=${periodeId}`, label: "Pembayaran gaji" }}
        description="Hanya penerima yang gagal yang diproses ulang. Transfer berhasil tidak diulang."
        item={ITEM}
        title={`Periksa transfer gagal / ${baris.nama}`}
      />
      <div className={ui.stack}>
        <Notice title={`Transfer ${baris.nama} tercatat gagal (${baris.percobaan.length} percobaan). Periksa rekening dan cocokkan bukti transfer ulang.`} tone="danger" />
        <section className={ui.card}>
          <h2 className={ui.cardTitle}>Hasil transfer</h2>
          <table className={ui.table}>
            <caption className="sr-only">Hasil transfer per karyawan</caption>
            <thead><tr><th scope="col">Karyawan</th><th className={ui.right} scope="col">Neto</th><th scope="col">Hasil</th><th scope="col">Tindakan</th></tr></thead>
            <tbody>
              {view.baris.map((b) => (
                <tr key={b.karyawanId}>
                  <td>{b.nama}</td>
                  <td className={`${ui.right} ${ui.numeric}`}>{b.nominal !== undefined ? formatRupiah(b.nominal) : "—"}</td>
                  <td><StatusBadge status={b.status} statuses={STATUS_TRANSFER} /></td>
                  <td>{TINDAKAN[b.status]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <FormAksi
          aksi={retryTransfer.bind(null, periodeId, karyawanId)}
          batalHref={`/penggajian/pembayaran?periode=${periodeId}`}
          isian={[
            { name: "alasan", label: "Alasan transfer ulang", wajib: true, contoh: "Rekening diperbaiki HR: nomor tertukar satu digit" },
            { name: "bukti", label: "Bukti transfer", jenis: "file", wajib: true, terima: BUKTI_TIPE.join(",") },
            { name: "hasil", label: "Hasil transfer ulang", jenis: "pilihan", wajib: true, pilihan: [...HASIL_TRANSFER] },
            { name: "referensi", label: "Referensi bank" },
          ]}
          judul={`Transfer ulang ${baris.nama}`}
          kirimLabel="Konfirmasi hasil transfer ulang"
        />
      </div>
    </>
  );
}

export function UlangTransferScreen({ periodeId, karyawanId }: { periodeId: string; karyawanId: string }) {
  return (
    <Suspense fallback={<PageHeader item={ITEM} title="Periksa transfer gagal" />}>
      <Konten karyawanId={karyawanId} periodeId={periodeId} />
    </Suspense>
  );
}
