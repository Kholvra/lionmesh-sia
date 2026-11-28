import { Suspense } from "react";

import { sesiPenggajian } from "@/modules/penggajian/akun/akun";
import { hariIniJakarta } from "@/modules/penggajian/karyawan/format";
import { createLembur, createPresensi } from "@/modules/penggajian/presensi/actions";
import { aksesPresensi } from "@/modules/penggajian/presensi/akses";
import { getPresensiHariIni, listKaryawanAktifUntukCatat } from "@/modules/penggajian/presensi/queries";
import { rentangPeriode } from "@/modules/penggajian/periode/rules";
import { KartuBaca } from "@/modules/penggajian/shared/bidang-baca";
import { batasLemburUntuk } from "@/modules/penggajian/presensi/rules";
import { LABEL_KEHADIRAN } from "@/modules/penggajian/presensi/status";
import { KEHADIRAN } from "@/modules/penggajian/presensi/types";
import { PageHeader } from "@/modules/penggajian/ui/page-header";
import { FormAksi } from "@/modules/penggajian/shared/form-aksi";
import type { IsianForm } from "@/modules/penggajian/shared/form-aksi";
import { TidakBerwenang } from "@/modules/penggajian/shared/states";
import { formatDurasi } from "@/modules/penggajian/shared/waktu";

const ITEM = "GJ-002 Mencatat presensi dan lembur";

async function FormPresensi() {
  const sesi = await sesiPenggajian();
  if (!aksesPresensi(sesi).bolehCatatAtasNama) {
    return <TidakBerwenang pesan="Hanya HR yang mencatat presensi atas nama karyawan. Karyawan memakai tombol absen di halaman Presensi." />;
  }
  const isian: IsianForm[] = [
    { name: "karyawanId", label: "Karyawan", jenis: "pilihan", wajib: true, pilihan: (await listKaryawanAktifUntukCatat(sesi)).map((o) => ({ value: o.id, label: `${o.nama} · ${o.nik}` })) },
    { name: "tanggal", label: "Tanggal", jenis: "date", wajib: true, bantuan: "Dalam periode yang masih Terbuka." },
    { name: "kehadiran", label: "Status", jenis: "pilihan", wajib: true, pilihan: KEHADIRAN.map((k) => ({ value: k, label: LABEL_KEHADIRAN[k] })), bantuan: "Pilihan: Hadir, Izin, Sakit, Alpha, Cuti. Hadir wajib jam masuk dan pulang." },
    { name: "keterangan", label: "Keterangan", contoh: "Surat dokter terlampir" },
    { name: "jamMasuk", label: "Jam masuk", jenis: "time" },
    { name: "jamPulang", label: "Jam pulang", jenis: "time" },
  ];
  return (
    <FormAksi
      aksi={createPresensi}
      batalHref="/penggajian/presensi"
      isian={isian}
      judul="Presensi"
      kirimLabel="Simpan"
      petunjuk="Presensi ganda untuk karyawan dan tanggal yang sama ditolak."
    />
  );
}

export function CatatPresensiScreen() {
  return (
    <>
      <PageHeader
        back={{ href: "/penggajian/presensi", label: "Presensi & lembur" }}
        description="Untuk karyawan tanpa akun atau yang tidak bisa absen sendiri."
        item={ITEM}
        title="Catat presensi atas nama karyawan"
      />
      <Suspense fallback={null}>
        <FormPresensi />
      </Suspense>
    </>
  );
}

async function FormLembur() {
  const sesi = await sesiPenggajian();
  const akses = aksesPresensi(sesi);
  if (!akses.bolehAjukanLembur) {
    return <TidakBerwenang pesan="Lembur diajukan oleh karyawan untuk dirinya sendiri, atau oleh HR atas nama karyawan." />;
  }
  const hariIni = hariIniJakarta();
  const batas = batasLemburUntuk(hariIni);
  const diri = akses.mandiri ? await getPresensiHariIni(sesi) : null;
  const identitas = diri ? (
    <KartuBaca
      bidang={[
        ["NIK / Nama", `${diri.orang.nik} / ${diri.orang.nama}`],
        ["Departemen / Jabatan", `${diri.orang.departemen} / ${diri.orang.jabatan}`],
        ["Periode kerja", diri.periode ? rentangPeriode(diri.periode) : "—"],
      ]}
      judul="Identitas otomatis"
    />
  ) : undefined;
  const isian: IsianForm[] = [
    ...(akses.mandiri
      ? []
      : [{ name: "karyawanId", label: "Karyawan", jenis: "pilihan", wajib: true, pilihan: (await listKaryawanAktifUntukCatat(sesi)).map((o) => ({ value: o.id, label: `${o.nama} · ${o.nik}` })) } as IsianForm]),
    { name: "tanggal", label: "Tanggal lembur", jenis: "date", wajib: true, awal: hariIni },
    { name: "durasi", label: "Jumlah jam lembur", wajib: true, contoh: "2 atau 1:30" },
    { name: "nomorSpl", label: "Nomor SPL", wajib: true, contoh: "SPL/PRD/XI/019" },
    { name: "keterangan", label: "Keterangan", contoh: "Menyiapkan hasil wiremesh untuk pemeriksaan QC" },
  ];
  const petunjuk = `* Wajib diisi. Lembur hanya tercatat bila nomor SPL terisi.${batas ? ` Batas jam lembur yang berlaku: ${formatDurasi(batas.menitPerHari)} per hari (${batas.sumber}).` : ""}`;
  return (
    <FormAksi
      aksi={createLembur}
      atas={identitas}
      batalHref={akses.mandiri ? "/penggajian/presensi" : "/penggajian/lembur"}
      isian={isian}
      judul="Data lembur"
      kirimLabel="Kirim pengajuan"
      petunjuk={petunjuk}
    />
  );
}

export function AjukanLemburScreen() {
  return (
    <>
      <PageHeader
        description="Isi sesuai Surat Perintah Lembur (SPL) dari atasan. Pengajuan menunggu validasi Supervisor saat rekap periode."
        item={ITEM}
        title="Pengajuan lembur"
      />
      <Suspense fallback={null}>
        <FormLembur />
      </Suspense>
    </>
  );
}
