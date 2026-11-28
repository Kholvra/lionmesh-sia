import Link from "next/link";
import { Suspense } from "react";

import { sesiPenggajian } from "@/modules/penggajian/akun/akun";
import { formatTanggal, formatWaktu } from "@/modules/penggajian/karyawan/format";
import { addPemetaan, importPresensi, saveProfil } from "@/modules/penggajian/impor/actions";
import { profil, semuaHasil, semuaPemetaan } from "@/modules/penggajian/impor/queries";
import type { ProfilPemetaan } from "@/modules/penggajian/impor/types";
import { listKaryawanAktifUntukCatat } from "@/modules/penggajian/presensi/queries";
import { listPeriodeTerbaru } from "@/modules/penggajian/periode/queries";
import { labelStatusPeriode, rentangPeriode } from "@/modules/penggajian/periode/rules";
import { Notice } from "@/components/ui/notice";
import { PageHeader } from "@/components/ui/page-header";
import { ui } from "@/modules/penggajian/ui/kelas";
import { FormAksi } from "@/modules/penggajian/shared/form-aksi";
import { Keadaan, TidakBerwenang } from "@/modules/penggajian/shared/states";

const ITEM = "GJ-008 Mengimpor presensi mesin";
const TOLAK = "Impor presensi dan pemetaan ID mesin dikelola HR.";
const PESAN: Record<string, string> = { profil: "Profil pemetaan tersimpan dan dipakai untuk impor berikutnya.", pemetaan: "Pemetaan ID mesin tersimpan." };

const LABEL_PEMISAH: Record<string, string> = { ";": "titik koma (;)", ",": "koma (,)", "\t": "tab" };

function deskripsiProfil(p: ProfilPemetaan) {
  return `Pemisah ${LABEL_PEMISAH[p.pemisah]} · ${p.formatTanggal} · kolom ${p.kolomIdMesin}, ${p.kolomTanggal}, ${p.kolomJamMasuk}, ${p.kolomJamPulang}`;
}

async function Konten() {
  const sesi = await sesiPenggajian();
  if (sesi.peran !== "HR") return <TidakBerwenang pesan={TOLAK} />;
  const [hasil, periode, pemetaan, p] = await Promise.all([semuaHasil(), listPeriodeTerbaru(), semuaPemetaan(), profil()]);
  hasil.reverse();
  const terbuka = periode.filter((x) => x.status === "TERBUKA");
  const lain = periode.filter((x) => x.status !== "TERBUKA");
  return (
    <div className={ui.stack}>
      <FormAksi
        aksi={importPresensi}
        batalHref="/penggajian/impor/pengaturan"
        batalLabel="Kelola profil dan pemetaan"
        isian={[
          {
            name: "periodeId",
            label: "Periode penggajian",
            jenis: "pilihan",
            wajib: true,
            pilihan: [...terbuka, ...lain].map((x) => ({ value: x.id, label: `${rentangPeriode(x)} (${labelStatusPeriode(x.status)})` })),
          },
          { name: "berkas", label: "Berkas CSV", jenis: "file", wajib: true, terima: ".csv,text/csv", bantuan: `Profil pemetaan: ${deskripsiProfil(p)}.` },
        ]}
        judul="Berkas"
        kirimLabel="Impor"
        petunjuk={`* Wajib diisi. Berkas yang sama dengan impor sebelumnya ditolak. Pemetaan ID mesin → NIK: ${pemetaan.length} ID terpetakan; satu ID mesin untuk satu NIK.`}
      />
      <section className={ui.card}>
        <h2 className={ui.cardTitle}>Riwayat impor</h2>
        {hasil.length === 0 ? (
          <p className={ui.cardHint}>Belum ada impor. Riwayat terisi setelah berkas pertama diimpor.</p>
        ) : (
          <table className={ui.table}>
            <caption className="sr-only">Riwayat impor</caption>
            <thead><tr><th scope="col">Berkas</th><th scope="col">Tersimpan</th><th scope="col">Dilewati</th><th scope="col">Oleh</th></tr></thead>
            <tbody>
              {hasil.map((h) => (
                <tr key={h.id}>
                  <td><Link href={`/penggajian/impor/${h.id}`}>{h.namaBerkas}</Link></td>
                  <td>{h.tersimpan}</td><td>{h.dilewati.length}</td>
                  <td>{h.oleh} · {formatWaktu(h.pada)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export function ImporScreen() {
  return (
    <>
      <PageHeader
        back={{ href: "/penggajian/presensi", label: "Presensi & lembur" }}
        description="Unggah berkas CSV ekspor mesin. Baris yang valid masuk sebagai presensi menunggu validasi Supervisor."
        breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]}
        variant="page"
        title="Impor presensi dari mesin absensi"
      />
      <Suspense fallback={null}>
        <Konten />
      </Suspense>
    </>
  );
}

async function Pengaturan({ pesan }: { pesan?: string }) {
  const sesi = await sesiPenggajian();
  if (sesi.peran !== "HR") return <TidakBerwenang pesan={TOLAK} />;
  const [p, pemetaan] = await Promise.all([profil(), semuaPemetaan()]);
  const pemisah = p.pemisah === "\t" ? "tab" : p.pemisah;
  const aktif = await listKaryawanAktifUntukCatat(sesi);
  return (
    <div className={ui.stack}>
      {pesan && PESAN[pesan] ? <Notice title={PESAN[pesan]} tone="success" /> : null}
      <FormAksi
        aksi={saveProfil}
        isian={[
          { name: "pemisah", label: "Pemisah kolom", jenis: "pilihan", wajib: true, awal: pemisah, pilihan: [{ value: ";", label: "Titik koma (;)" }, { value: ",", label: "Koma (,)" }, { value: "tab", label: "Tab" }] },
          { name: "formatTanggal", label: "Format tanggal", jenis: "pilihan", wajib: true, awal: p.formatTanggal, pilihan: [{ value: "DD/MM/YYYY", label: "DD/MM/YYYY" }, { value: "YYYY-MM-DD", label: "YYYY-MM-DD" }] },
          { name: "kolomIdMesin", label: "Kolom ID mesin", wajib: true, awal: p.kolomIdMesin },
          { name: "kolomTanggal", label: "Kolom tanggal", wajib: true, awal: p.kolomTanggal },
          { name: "kolomJamMasuk", label: "Kolom jam masuk", wajib: true, awal: p.kolomJamMasuk },
          { name: "kolomJamPulang", label: "Kolom jam pulang", wajib: true, awal: p.kolomJamPulang },
        ]}
        judul="Profil pemetaan kolom"
        kirimLabel="Simpan profil"
        petunjuk={`Diubah ${p.diubahOleh}, ${formatWaktu(p.diubahPada)}. Profil dipakai untuk impor berikutnya tanpa mengubah kode.`}
      />
      <FormAksi
        aksi={addPemetaan}
        isian={[
          { name: "idMesin", label: "ID mesin", wajib: true, contoh: "M-003" },
          { name: "karyawanId", label: "Karyawan aktif", jenis: "pilihan", wajib: true, pilihan: aktif.map((k) => ({ value: k.id, label: `${k.nama} · ${k.nik}` })) },
        ]}
        judul="Tambah pemetaan ID mesin"
        kirimLabel="Simpan pemetaan"
        petunjuk="Satu ID mesin untuk satu NIK. Karyawan nonaktif tidak bisa dipilih."
      />
      <section className={ui.card}>
        <h2 className={ui.cardTitle}>Pemetaan ID mesin → NIK</h2>
        <table className={ui.table}>
          <caption className="sr-only">Pemetaan ID mesin</caption>
          <thead><tr><th scope="col">ID mesin</th><th scope="col">Karyawan</th><th scope="col">Dipetakan oleh</th></tr></thead>
          <tbody>
            {pemetaan.map((m) => {
              return <tr key={m.idMesin}><td>{m.idMesin}</td><td>{`${m.nama} · ${m.nik}`}</td><td>{m.oleh} · {formatWaktu(m.pada)}</td></tr>;
            })}
          </tbody>
        </table>
      </section>
    </div>
  );
}

export function PengaturanImporScreen({ pesan }: { pesan?: string }) {
  return (
    <>
      <PageHeader back={{ href: "/penggajian/impor", label: "Impor presensi dari mesin absensi" }} breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]} title="Profil dan pemetaan impor" variant="page" />
      <Suspense fallback={null}>
        <Pengaturan pesan={pesan} />
      </Suspense>
    </>
  );
}

const JENIS: Record<string, string> = { TIDAK_TERPETAKAN: "Tidak terpetakan", BENTROK: "Bentrok", DI_LUAR_PERIODE: "Di luar periode", NONAKTIF: "Karyawan nonaktif" };

async function Hasil({ id }: { id: string }) {
  const sesi = await sesiPenggajian();
  if (sesi.peran !== "HR") return <TidakBerwenang pesan={TOLAK} />;
  const h = (await semuaHasil()).find((x) => x.id === id);
  if (!h) return <Keadaan judul="Hasil impor tidak ditemukan" pesan="Tautannya mungkin salah." />;
  const hitung = (j: string) => h.dilewati.filter((d) => d.jenis === j).length;
  return (
    <div className={ui.stack}>
      <Notice title={`${h.tersimpan} presensi tersimpan`} tone="success">
        <p>Masuk sebagai presensi Menunggu validasi Supervisor, bertanda sumber impor. {h.namaBerkas} · {h.oleh}, {formatWaktu(h.pada)} · tidak terpetakan {hitung("TIDAK_TERPETAKAN")} · bentrok {hitung("BENTROK")}.</p>
      </Notice>
      <section className={ui.card}>
        <h2 className={ui.cardTitle}>Baris dilewati ({h.dilewati.length})</h2>
        <p className={ui.cardHint}>Baris ini tidak disimpan. Presensi yang sudah ada tidak diubah.</p>
        {h.dilewati.length === 0 ? (
          <p>Tidak ada baris yang dilewati.</p>
        ) : (
          <table className={ui.table}>
            <caption className="sr-only">Baris dilewati</caption>
            <thead><tr><th scope="col">Baris</th><th scope="col">ID mesin</th><th scope="col">Tanggal</th><th scope="col">Alasan</th></tr></thead>
            <tbody>
              {h.dilewati.map((d) => (
                <tr key={d.baris}><td>{d.baris}</td><td>{d.idMesin}</td><td>{formatTanggal(d.tanggal)}</td><td>{JENIS[d.jenis]}: {d.alasan}</td></tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

export function HasilImporScreen({ id }: { id: string }) {
  return (
    <>
      <PageHeader back={{ href: "/penggajian/impor", label: "Impor presensi dari mesin absensi" }} breadcrumb={[{ label: "Siklus Penggajian", accent: true }, ITEM]} title="Hasil impor" variant="page" />
      <Suspense fallback={null}>
        <Hasil id={id} />
      </Suspense>
    </>
  );
}
