import Link from "next/link";
import { Suspense } from "react";
import type { ReactNode } from "react";

import { StatusBadge } from "@/components/ui";
import { addGajiPokok } from "@/modules/penggajian/karyawan/actions";
import { GajiPokokForm } from "@/modules/penggajian/karyawan/components/gaji-pokok-form";
import { KaryawanTidakDitemukan, TidakBerwenang } from "@/modules/penggajian/karyawan/components/states";
import { formatRupiah, formatTanggal, formatWaktu } from "@/modules/penggajian/karyawan/format";
import { getKaryawan, type DetailKaryawan } from "@/modules/penggajian/karyawan/queries";
import { aksesSesi } from "@/modules/penggajian/karyawan/sesi";
import { KEADAAN_GAJI, STATUS_KARYAWAN } from "@/modules/penggajian/karyawan/status";
import { Notice } from "@/modules/penggajian/shell/notice";
import { PageHeader } from "@/modules/penggajian/shell/page-header";
import ui from "@/modules/penggajian/shell/ui.module.css";

const ITEM = "GJ-001 Mengelola data karyawan";
const KEMBALI = { href: "/penggajian/karyawan", label: "Data karyawan" };

const PESAN: Record<string, string> = {
  dibuat: "Karyawan tersimpan.",
  diubah: "Perubahan data karyawan tersimpan.",
  gaji: "Gaji pokok baru tersimpan. Entri lama tetap ada di riwayat.",
  nonaktif: "Karyawan dinonaktifkan. Data dan riwayatnya tetap tersimpan.",
};

function Fakta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={ui.fact}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function KartuIdentitas({ karyawan }: { karyawan: DetailKaryawan }) {
  return (
    <section className={ui.card}>
      <h2 className={ui.cardTitle}>Identitas</h2>
      <dl className={ui.facts}>
        {karyawan.nik ? <Fakta label="NIK"><span className={ui.numeric}>{karyawan.nik}</span></Fakta> : null}
        <Fakta label="Nama">{karyawan.nama}</Fakta>
        {karyawan.departemen ? <Fakta label="Departemen">{karyawan.departemen}</Fakta> : null}
        {karyawan.jabatan ? <Fakta label="Jabatan">{karyawan.jabatan}</Fakta> : null}
        {karyawan.tipe ? <Fakta label="Tipe">{karyawan.tipe}</Fakta> : null}
        {karyawan.tanggalMasuk ? <Fakta label="Tanggal masuk">{formatTanggal(karyawan.tanggalMasuk)}</Fakta> : null}
        <Fakta label="Status"><StatusBadge status={karyawan.status} statuses={STATUS_KARYAWAN} /></Fakta>
        {karyawan.tanggalKeluar ? <Fakta label="Tanggal keluar">{formatTanggal(karyawan.tanggalKeluar)}</Fakta> : null}
      </dl>
    </section>
  );
}

function KartuPajakRekening({ karyawan }: { karyawan: DetailKaryawan }) {
  if (!karyawan.ptkpKode && !karyawan.rekening) return null;
  return (
    <section className={ui.card}>
      <h2 className={ui.cardTitle}>{karyawan.ptkpKode ? "Pajak dan rekening" : "Rekening"}</h2>
      <dl className={ui.facts}>
        {karyawan.ptkpKode ? <Fakta label="Status PTKP">{karyawan.ptkpKode}</Fakta> : null}
        {karyawan.rekening ? (
          <Fakta label="Rekening">
            {karyawan.rekening.namaBank} · <span className={ui.numeric}>{karyawan.rekening.nomor}</span> · a.n.{" "}
            {karyawan.rekening.namaPemilik}
          </Fakta>
        ) : null}
      </dl>
    </section>
  );
}

function KartuGaji({ karyawan, bolehTambah }: { karyawan: DetailKaryawan; bolehTambah: boolean }) {
  if (!karyawan.gajiPokok) return null;
  return (
    <section className={ui.card}>
      <h2 className={ui.cardTitle}>Riwayat gaji pokok</h2>
      <table className={ui.table}>
        <caption className="sr-only">Riwayat gaji pokok {karyawan.nama}</caption>
        <thead>
          <tr>
            <th scope="col">Berlaku sejak</th>
            <th className={ui.right} scope="col">Gaji pokok</th>
            <th scope="col">Keadaan</th>
            <th scope="col">Dicatat</th>
          </tr>
        </thead>
        <tbody>
          {karyawan.gajiPokok.map((entri) => (
            <tr key={entri.id}>
              <td>{formatTanggal(entri.tanggalBerlaku)}</td>
              <td className={`${ui.right} ${ui.numeric}`}>{formatRupiah(entri.nominal)}</td>
              <td><StatusBadge status={entri.keadaan} statuses={KEADAAN_GAJI} /></td>
              <td>{entri.oleh} · {formatWaktu(entri.pada)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {bolehTambah ? <GajiPokokForm aksi={addGajiPokok.bind(null, karyawan.id)} /> : null}
    </section>
  );
}

function RiwayatPerubahan({ karyawan }: { karyawan: DetailKaryawan }) {
  if (!karyawan.riwayat) return null;
  return (
    <aside className={ui.card}>
      <h2 className={ui.cardTitle}>Riwayat perubahan</h2>
      <ol className={ui.timeline}>
        {karyawan.riwayat.map((catatan) => (
          <li key={catatan.id}>
            <span>{catatan.keterangan}</span>
            <span className={ui.timelineMeta}>{catatan.oleh} · {formatWaktu(catatan.pada)}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}

async function DetailKonten({ id, pesan }: { id: string; pesan?: string }) {
  const akses = await aksesSesi();
  if (!akses.bolehMembaca) {
    return (<><PageHeader back={KEMBALI} item={ITEM} title="Detail karyawan" /><TidakBerwenang /></>);
  }
  const karyawan = await getKaryawan(id, akses);
  if (!karyawan) {
    return (<><PageHeader back={KEMBALI} item={ITEM} title="Detail karyawan" /><KaryawanTidakDitemukan /></>);
  }

  const bolehUbah = akses.bolehMengubah && karyawan.status === "AKTIF";
  return (
    <>
      <PageHeader
        actions={
          bolehUbah ? (
            <>
              <Link className={`${ui.button} ${ui.primary}`} href={`/penggajian/karyawan/${id}/ubah`}>Ubah data</Link>
              <Link className={`${ui.button} ${ui.danger}`} href={`/penggajian/karyawan/${id}/status`}>Nonaktifkan</Link>
            </>
          ) : null
        }
        back={KEMBALI}
        description={
          karyawan.gajiPokok
            ? "Riwayat gaji pokok tidak pernah ditimpa; perubahan menambah entri baru."
            : undefined
        }
        item={ITEM}
        title={`Detail karyawan / ${karyawan.nama}`}
      />
      <div className={ui.stack}>
        {pesan && PESAN[pesan] ? <Notice title={PESAN[pesan]} tone="success" /> : null}
        <div className={ui.grid}>
          <div className={`${ui.span8} ${ui.stack}`}>
            <KartuIdentitas karyawan={karyawan} />
            <KartuPajakRekening karyawan={karyawan} />
            <KartuGaji bolehTambah={bolehUbah} karyawan={karyawan} />
          </div>
          <div className={ui.span4}>
            <RiwayatPerubahan karyawan={karyawan} />
          </div>
        </div>
      </div>
    </>
  );
}

export function KaryawanDetailScreen({ id, pesan }: { id: string; pesan?: string }) {
  return (
    <Suspense fallback={<PageHeader back={KEMBALI} description="Memuat data karyawan…" item={ITEM} title="Detail karyawan" />}>
      <DetailKonten id={id} pesan={pesan} />
    </Suspense>
  );
}
