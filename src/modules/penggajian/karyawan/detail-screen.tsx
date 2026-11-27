import Link from "next/link";
import { Suspense } from "react";
import type { ReactNode } from "react";

import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { StatusBadge } from "@/components/ui/status-badge";
import { addGajiPokok } from "@/modules/penggajian/karyawan/actions";
import { GajiPokokForm } from "@/modules/penggajian/karyawan/components/gaji-pokok-form";
import { PATH_KARYAWAN, pathKaryawanStatus, pathKaryawanUbah } from "@/modules/penggajian/karyawan/constants";
import { formatRupiah, formatTanggal, formatWaktu } from "@/modules/penggajian/karyawan/format";
import { getKaryawan, type DetailKaryawan } from "@/modules/penggajian/karyawan/queries";
import { aksesSesi } from "@/modules/penggajian/karyawan/sesi";
import { KEADAAN_GAJI, STATUS_KARYAWAN } from "@/modules/penggajian/karyawan/status";
import { ui } from "@/modules/penggajian/ui/kelas";

const ITEM = "GJ-001 Mengelola data karyawan";
const KEMBALI = { href: PATH_KARYAWAN, label: "Data karyawan" };
const BREADCRUMB = [
  { label: "Siklus Penggajian", accent: true },
  ITEM,
] as const;

const PESAN = {
  dibuat: "Karyawan tersimpan.",
  diubah: "Perubahan data karyawan tersimpan.",
  gaji: "Gaji pokok baru tersimpan. Entri lama tetap ada di riwayat.",
  nonaktif: "Karyawan dinonaktifkan. Data dan riwayatnya tetap tersimpan.",
} as const satisfies Record<string, string>;

type PesanKaryawan = keyof typeof PESAN;

function pesanDikenal(pesan: string | undefined): pesan is PesanKaryawan {
  return typeof pesan === "string" && Object.hasOwn(PESAN, pesan);
}

function Fakta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={ui.fact}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

function Bidang({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={ui.bidangBaca}>
      <span className={ui.bidangLabel}>{label}</span>
      <div className={ui.bidangNilai}>{children}</div>
    </div>
  );
}

function KartuIdentitas({ karyawan }: { karyawan: DetailKaryawan }) {
  return (
    <section className={ui.card}>
      <h2 className={ui.cardTitle}>Identitas tersimpan</h2>
      <div className={ui.formGrid}>
        {karyawan.nik ? <Bidang label="NIK"><span className={ui.numeric}>{karyawan.nik}</span></Bidang> : null}
        <Bidang label="Nama">{karyawan.nama}</Bidang>
        {karyawan.departemen ? <Bidang label="Departemen">{karyawan.departemen}</Bidang> : null}
        {karyawan.jabatan ? <Bidang label="Jabatan">{karyawan.jabatan}</Bidang> : null}
        {karyawan.tanggalMasuk ? <Bidang label="Tanggal masuk">{formatTanggal(karyawan.tanggalMasuk)}</Bidang> : null}
        <Bidang label="Status"><StatusBadge status={karyawan.status} statuses={STATUS_KARYAWAN} /></Bidang>
        {karyawan.tanggalKeluar ? <Bidang label="Tanggal keluar">{formatTanggal(karyawan.tanggalKeluar)}</Bidang> : null}
      </div>
    </section>
  );
}

function KartuPajakRekening({ karyawan }: { karyawan: DetailKaryawan }) {
  if (!karyawan.ptkpKode && !karyawan.rekening) return null;
  const berlaku = karyawan.gajiPokok?.find((g) => g.keadaan === "berlaku");
  const dijadwalkan = karyawan.gajiPokok?.filter((g) => g.keadaan === "dijadwalkan") ?? [];
  return (
    <section className={ui.card}>
      <h2 className={ui.cardTitle}>{karyawan.ptkpKode ? "Penggajian" : "Rekening"}</h2>
      <dl className={ui.facts}>
        {karyawan.tipe ? <Fakta label="Tipe">{karyawan.tipe}</Fakta> : null}
        {karyawan.ptkpKode ? <Fakta label="Status PTKP">{karyawan.ptkpKode}</Fakta> : null}
        {karyawan.rekening ? (
          <Fakta label="Rekening">
            {karyawan.rekening.namaBank} · <span className={ui.numeric}>{karyawan.rekening.nomor}</span> · a.n.{" "}
            {karyawan.rekening.namaPemilik}
          </Fakta>
        ) : null}
        {berlaku ? <Fakta label="Gaji pokok berlaku">{formatRupiah(berlaku.nominal)} sejak {formatTanggal(berlaku.tanggalBerlaku)}</Fakta> : null}
        {dijadwalkan.map((g) => <Fakta key={g.id} label="Gaji pokok dijadwalkan">{formatRupiah(g.nominal)} mulai {formatTanggal(g.tanggalBerlaku)}</Fakta>)}
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
    return (
      <>
        <PageHeader back={KEMBALI} breadcrumb={BREADCRUMB} title="Detail karyawan" />
        <ErrorState
          judul="Anda tidak punya akses ke data karyawan"
          teks="Data karyawan hanya bisa dibuka oleh HR, Accounting, dan Finance. Hubungi HR bila Anda membutuhkannya."
          variant="compact"
        />
      </>
    );
  }
  const karyawan = await getKaryawan(id, akses);
  if (!karyawan) {
    return (
      <>
        <PageHeader back={KEMBALI} breadcrumb={BREADCRUMB} title="Detail karyawan" />
        <EmptyState
          actionHref={PATH_KARYAWAN}
          actionLabel="Kembali ke data karyawan"
          judul="Karyawan tidak ditemukan"
          teks="Data mungkin sudah dipindahkan atau tautannya salah."
          variant="compact"
        />
      </>
    );
  }

  const bolehUbah = akses.bolehMengubah && karyawan.status === "AKTIF";
  return (
    <>
      <PageHeader
        back={KEMBALI}
        description="Lihat identitas dan informasi payroll tanpa menghapus riwayat lama."
        breadcrumb={BREADCRUMB}
        title={`Detail karyawan / ${karyawan.nama}`}
      />
      <div className={ui.stack}>
        {pesanDikenal(pesan) ? <Notice title={PESAN[pesan]} tone="success" /> : null}
        <div className={ui.grid}>
          <div className={`${ui.span8} ${ui.stack}`}>
            <KartuIdentitas karyawan={karyawan} />
            <KartuPajakRekening karyawan={karyawan} />
            <div className={ui.formActions}>
              {bolehUbah ? (
                <>
                  <Link className={ui.buttonPrimary} href={pathKaryawanUbah(id)}>Edit data</Link>
                  <Link className={ui.button} href={pathKaryawanStatus(id)}>Ubah status</Link>
                </>
              ) : null}
              <Link className={ui.button} href={KEMBALI.href}>← Kembali</Link>
            </div>
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
    <Suspense fallback={<PageHeader back={KEMBALI} breadcrumb={BREADCRUMB} description="Memuat data karyawan…" title="Detail karyawan" />}>
      <DetailKonten id={id} pesan={pesan} />
    </Suspense>
  );
}
