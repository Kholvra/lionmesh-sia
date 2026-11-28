import Link from "next/link";
import { Suspense } from "react";

import { StatusBadge } from "@/components/ui";
import { sesiPenggajian } from "@/modules/penggajian/akun/akun";
import { formatRupiah } from "@/lib/format/money";
import { formatWaktu } from "@/modules/penggajian/karyawan/format";
import { statusTransfer } from "@/modules/penggajian/pembayaran/queries";
import { STATUS_TRANSFER } from "@/modules/penggajian/pembayaran/status";
import { getDraft } from "@/modules/penggajian/payroll/queries";
import { rentangPeriode } from "@/modules/penggajian/periode/rules";
import { semuaPeriode } from "@/modules/penggajian/periode/queries";
import { AbsenTombol } from "@/modules/penggajian/presensi/components/absen-tombol";
import { PilihPeriode } from "@/modules/penggajian/presensi/components/pilih-periode";
import { getPeriodeDipilih, listPeriode } from "@/modules/penggajian/presensi/queries";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { ui } from "@/modules/penggajian/ui/kelas";
import { KartuBaca } from "@/modules/penggajian/shared/bidang-baca";
import { FormAksi } from "@/modules/penggajian/shared/form-aksi";
import { Keadaan, TidakBerwenang } from "@/modules/penggajian/shared/states";
import { TabelData } from "@/modules/penggajian/shared/tabel-data";
import { printSlip, replaceSlip } from "@/modules/penggajian/slip/actions";
import { CetakOtomatis } from "@/modules/penggajian/slip/components/cetak-otomatis";
import { referensiSementara, slipKaryawan } from "@/modules/penggajian/slip/queries";

const ITEM = "GJ-006 Membayar gaji dan menerbitkan slip";
const TOLAK = "Slip gaji hanya dibuka dan dicetak HR. Karyawan menerima slip cetak.";

async function Daftar({ periodeId }: { periodeId?: string }) {
  const sesi = await sesiPenggajian();
  if (sesi.peran !== "HR") return <TidakBerwenang pesan={TOLAK} />;
  const periode = await getPeriodeDipilih(periodeId);
  const draft = periode ? await getDraft(sesi, periode.id) : null;
  if (!periode || !draft?.baris) return <Keadaan judul="Belum ada payroll untuk periode ini" pesan="Slip terbit setelah payroll disetujui dan gaji dibayar." />;
  const baris = await Promise.all(draft.baris.map(async (b) => {
    const status = (await statusTransfer(periode.id, b.karyawanId)) ?? "BELUM";
    const slip = await slipKaryawan(periode.id, b.karyawanId);
    return {
      key: b.karyawanId,
      nilaiUrut: { karyawan: b.nama },
      cells: {
        karyawan: `${b.nama} · ${b.nik}`,
        status: <StatusBadge status={status} statuses={STATUS_TRANSFER} />,
        slip: slip.length ? `${slip.length} slip · ${slip.reduce((t, s) => t + s.cetakan.length, 0)} kali cetak` : "Belum terbit",
        aksi: status === "DIBAYAR" ? <Link className={ui.buttonSmall} href={`/penggajian/slip/${periode.id}/${b.karyawanId}`}>Lihat slip</Link> : "Menunggu pembayaran",
      },
    };
  }));
  return (
    <div className={ui.stack}>
      <PilihPeriode action="/penggajian/slip" dipilih={periode.id} periode={await listPeriode()} />
      <section className={ui.card}>
        <h2 className={ui.cardTitle}>Slip {periode.nama}</h2>
        <TabelData
          baris={baris}
          caption={`Slip ${periode.nama}`}
          kolom={[{ id: "karyawan", header: "Karyawan", urut: true }, { id: "status", header: "Pembayaran" }, { id: "slip", header: "Slip" }, { id: "aksi", header: "Aksi", align: "right" }]}
          pesanKosong="Tidak ada karyawan."
        />
      </section>
    </div>
  );
}

export function SlipListScreen({ periodeId }: { periodeId?: string }) {
  return (
    <>
      <PageHeader breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]} description="Slip dicetak HR untuk karyawan yang sudah dibayar; tidak ada slip digital." title="Slip gaji" variant="page" />
      <Suspense fallback={null}>
        <Daftar periodeId={periodeId} />
      </Suspense>
    </>
  );
}

const PESAN: Record<string, string> = { dicetak: "Cetak slip tercatat.", pengganti: "Slip pengganti dibuat. Slip lama tidak berubah." };

async function Detail({ periodeId, karyawanId, pesan }: { periodeId: string; karyawanId: string; pesan?: string }) {
  const sesi = await sesiPenggajian();
  if (sesi.peran !== "HR") return <TidakBerwenang pesan={TOLAK} />;
  const periode = (await semuaPeriode()).find((p) => p.id === periodeId);
  const baris = (await getDraft(sesi, periodeId))?.baris?.find((b) => b.karyawanId === karyawanId);
  if (!baris || !periode) return <Keadaan judul="Slip tidak ditemukan" pesan="Tautannya mungkin salah." />;
  const dibayar = (await statusTransfer(periodeId, karyawanId)) === "DIBAYAR";
  const semua = await slipKaryawan(periodeId, karyawanId);
  const slip = semua.at(-1);
  const nilai = (kode: string) => baris.komponen.find((k) => k.kode === kode)?.nilai ?? 0;
  const potongan = baris.komponen.filter((k) => k.jenis === "kurang" && k.nilai > 0);
  const rincian: [string, string][] = [
    ["Periode", periode.nama],
    ["Rentang kerja", rentangPeriode(periode)],
    ["Gaji pokok", formatRupiah(BigInt(nilai("GAJI_POKOK")) * BigInt(100))],
    ["Tunjangan tetap + kehadiran", formatRupiah(BigInt(nilai("TUNJANGAN_TETAP") + nilai("TUNJANGAN_KEHADIRAN")) * BigInt(100))],
    ["Uang lembur", formatRupiah(BigInt(nilai("LEMBUR")) * BigInt(100))],
    [`Potongan: ${potongan.map((k) => `${k.label} ${k.nilai.toLocaleString("id-ID")}`).join(", ") || "tidak ada"}`, formatRupiah(BigInt(baris.totalKurang) * BigInt(100))],
    ["Gaji bersih", formatRupiah(BigInt(baris.neto) * BigInt(100))],
  ];
  return (
    <div className={ui.stack}>
      {pesan === "dicetak" ? <CetakOtomatis /> : null}
      {pesan && PESAN[pesan] ? <Notice title={PESAN[pesan]} tone="success" /> : null}
      <Notice
        title={dibayar ? "Pembayaran telah dikonfirmasi. Slip siap diterbitkan." : "Slip belum bisa dicetak: pembayaran karyawan ini belum tercatat Dibayar."}
        tone={dibayar ? "success" : "danger"}
      />
      <section className={`${ui.card} print:[body:has(&)_*]:invisible print:visible! print:[&_*]:visible! print:absolute print:top-0 print:left-0 print:w-full print:shadow-none!`}>
        <div className={ui.cardHeader}>
          <h2 className={ui.cardTitle}>Slip / {baris.nama} / {baris.nik}</h2>
          <span className={ui.cardHint}>{slip ? `${slip.jenis === "PENGGANTI" ? "Slip pengganti" : "Slip"} · ${referensiSementara(slip)}` : "Belum terbit"}</span>
        </div>
        <table className={ui.table}>
          <caption className="sr-only">Komponen slip</caption>
          <thead><tr><th scope="col">Komponen</th><th scope="col">Jumlah</th></tr></thead>
          <tbody>{rincian.map(([k, v]) => <tr key={k}><td>{k}</td><td className={ui.numeric}>{v}</td></tr>)}</tbody>
        </table>
        {slip?.alasan ? <p className={ui.cardHint}>Pengganti slip sebelumnya. Alasan: {slip.alasan}</p> : null}
      </section>
      {dibayar ? (
        <div className={ui.formActions}>
          <AbsenTombol aksi={printSlip.bind(null, periodeId, karyawanId)} label={slip?.cetakan.length ? "Cetak ulang slip" : "Cetak slip"} />
          {slip ? <Link className={ui.button} href={`/penggajian/slip/${periodeId}/${karyawanId}/pengganti`}>Cetak slip pengganti</Link> : null}
        </div>
      ) : null}
      {semua.length > 0 ? (
        <section className={ui.card}>
          <h2 className={ui.cardTitle}>Jejak cetak</h2>
          <ol className={ui.timeline}>
            {semua.flatMap((s) => s.cetakan.map((c) => (
              <li key={`${s.id}-${c.pada}`}>
                <span>{s.jenis === "PENGGANTI" ? "Slip pengganti" : "Slip"} {referensiSementara(s)} · {c.ulang ? "cetak ulang" : "cetak pertama"}</span>
                <span className={ui.timelineMeta}>{c.oleh} · {formatWaktu(c.pada)}</span>
              </li>
            )))}
          </ol>
          <p className={ui.cardHint}>Nomor slip resmi menunggu penomoran core dokumen (FND-004); referensi SEMENTARA hanya untuk prototipe.</p>
        </section>
      ) : null}
    </div>
  );
}

export function SlipDetailScreen({ periodeId, karyawanId, pesan }: { periodeId: string; karyawanId: string; pesan?: string }) {
  return (
    <>
      <PageHeader
        back={{ href: `/penggajian/slip?periode=${periodeId}`, label: "Slip gaji" }}
        description="Slip dicetak HR untuk karyawan yang sudah Dibayar dan diserahkan langsung."
        breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]}
        variant="page"
        title="Penerbitan slip gaji"
      />
      <Suspense fallback={null}>
        <Detail karyawanId={karyawanId} periodeId={periodeId} pesan={pesan} />
      </Suspense>
    </>
  );
}

async function Pengganti({ periodeId, karyawanId }: { periodeId: string; karyawanId: string }) {
  const sesi = await sesiPenggajian();
  if (sesi.peran !== "HR") return <TidakBerwenang pesan={TOLAK} />;
  const baris = (await getDraft(sesi, periodeId))?.baris?.find((b) => b.karyawanId === karyawanId);
  const slip = (await slipKaryawan(periodeId, karyawanId)).at(-1);
  if (!baris || !slip) return <Keadaan judul="Belum ada slip yang terbit" pesan="Slip pengganti dibuat setelah slip pertama dicetak." />;
  const terakhir = slip.cetakan.at(-1);
  return (
    <FormAksi
      aksi={replaceSlip.bind(null, periodeId, karyawanId)}
      atas={
        <KartuBaca
          bidang={[
            ["Karyawan", `${baris.nama} · ${baris.nik}`],
            ["Periode", (await semuaPeriode()).find((p) => p.id === periodeId)?.nama ?? periodeId],
            ["Slip sebelumnya", `${referensiSementara(slip)}${terakhir ? ` · dicetak ${formatWaktu(terakhir.pada)}` : " · belum dicetak"}`],
          ]}
          judul="Slip"
        />
      }
      batalHref={`/penggajian/slip/${periodeId}/${karyawanId}`}
      isian={[{ name: "alasan", label: "Alasan", wajib: true, lebar: true, contoh: "Slip asli rusak terkena air" }]}
      judul="Pengganti"
      kirimLabel="Cetak slip pengganti"
      petunjuk="Slip hanya untuk karyawan yang sudah Dibayar. Slip lama tetap tercatat."
    />
  );
}

export function SlipPenggantiScreen({ periodeId, karyawanId }: { periodeId: string; karyawanId: string }) {
  return (
    <>
      <PageHeader back={{ href: `/penggajian/slip/${periodeId}/${karyawanId}`, label: "Penerbitan slip gaji" }} breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]} title="Cetak slip pengganti" variant="page" />
      <Suspense fallback={null}>
        <Pengganti karyawanId={karyawanId} periodeId={periodeId} />
      </Suspense>
    </>
  );
}
