import { Suspense } from "react";

import { sesiPenggajian } from "@/modules/penggajian/akun/akun";
import { formatRupiah } from "@/lib/format/money";
import { formatTanggal } from "@/modules/penggajian/karyawan/format";
import { aksesPayroll } from "@/modules/penggajian/payroll/akses";
import { getTabelTarif } from "@/modules/penggajian/payroll/queries";
import type { BarisTer } from "@/modules/penggajian/payroll/tarif-ter";
import type { VersiTarif } from "@/modules/penggajian/payroll/tarif";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { ui } from "@/modules/penggajian/ui/kelas";
import { TidakBerwenang } from "@/modules/penggajian/shared/states";

function Versi<T>({ judul, daftar, isi }: { judul: string; daftar: readonly VersiTarif<T>[]; isi: (v: T) => string }) {
  return (
    <section className={ui.card}>
      <h2 className={ui.cardTitle}>{judul}</h2>
      <ol className={ui.timeline}>
        {[...daftar].reverse().map((v) => (
          <li key={v.versi}>
            <span><strong>{v.versi}</strong> · berlaku dari {formatTanggal(v.berlakuDari)}{v.contoh ? " · data contoh" : ""}</span>
            <span>{isi(v.nilai)}</span>
            <span className={ui.timelineMeta}>Sumber: {v.sumber}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}

const teks = (tabel: readonly BarisTer[]) => `${tabel.length} lapisan, ${tabel[0][1]}% s.d. ${formatRupiah(BigInt(tabel[0][0] ?? 0) * BigInt(100))} sampai ${tabel[tabel.length - 1][1]}%`;

async function Konten() {
  const sesi = await sesiPenggajian();
  if (!aksesPayroll(sesi).rincian) return <TidakBerwenang pesan="Tabel tarif dibuka HR dan Accounting." />;
  const t = getTabelTarif();
  return (
    <div className={ui.stack}>
      <Notice title="Versi dipilih per tabel: berlaku dari ≤ tanggal akhir periode, yang terbaru." tone="info">
        <p>Draft yang sudah dihitung menyimpan versi yang dipakai, jadi versi baru tidak mengubahnya.</p>
      </Notice>
      <Versi daftar={t.ter} isi={(v) => `A: ${teks(v.A)} · B: ${teks(v.B)} · C: ${teks(v.C)}`} judul="TER PPh Pasal 21 (tarif_ter)" />
      <Versi daftar={t.bpjs} isi={(v) => `JHT ${v.jhtPekerjaPersen}% · JP ${v.jpPekerjaPersen}% sampai ${formatRupiah(BigInt(v.jpBatasUpah) * BigInt(100))} · Kesehatan ${v.kesehatanPekerjaPersen}% sampai ${formatRupiah(BigInt(v.kesehatanBatasUpah) * BigInt(100))} (bagian pekerja)`} judul="BPJS (tarif_bpjs)" />
      <Versi daftar={t.lemburHariKerja} isi={(v) => `Upah sejam 1/${v.pembagiUpahSejam} upah sebulan · jam pertama ${v.pengaliJamPertama}× · jam berikutnya ${v.pengaliJamBerikutnya}×`} judul="Lembur hari kerja (tarif_lembur)" />
      <Versi daftar={t.perusahaan} isi={(v) => `Tunjangan tetap per jabatan ${Object.values(v.tunjanganTetapPerJabatan).map((n) => formatRupiah(BigInt(n) * BigInt(100))).join(" / ")} · tunjangan kehadiran ${formatRupiah(BigInt(v.tunjanganKehadiranPerHari) * BigInt(100))} per hari hadir`} judul="Parameter perusahaan" />
    </div>
  );
}

export function TarifScreen() {
  return (
    <>
      <PageHeader back={{ href: "/penggajian/payroll", label: "Draft payroll" }} breadcrumb={[{ label: "Siklus Penggajian", accent: true }, "GJ-004 Menghitung payroll"]} description="Tabel diisi tech lead dari regulasi yang dikutip (D-19, D-51). Layar ini hanya membaca." title="Tabel tarif berversi" variant="page" />
      <Suspense fallback={null}>
        <Konten />
      </Suspense>
    </>
  );
}
