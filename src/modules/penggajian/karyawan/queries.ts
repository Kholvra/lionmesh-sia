import type { AksesKaryawan } from "@/modules/penggajian/karyawan/akses";
import { hariIniJakarta } from "@/modules/penggajian/karyawan/format";
import { deriveKeadaanGaji, TIPE_KARYAWAN } from "@/modules/penggajian/karyawan/rules";
import { cariKaryawan, daftarAktif, semuaKaryawan } from "@/modules/penggajian/karyawan/store";
import type {
  DaftarAktif,
  Karyawan,
  KeadaanGajiPokok,
  Rekening,
  RiwayatPerubahan,
  StatusKaryawan,
} from "@/modules/penggajian/karyawan/types";

export type BarisKaryawan = {
  id: string;
  nama: string;
  status: StatusKaryawan;
  nik?: string;
  jabatan?: string;
  departemen?: string;
  tipe?: string;
  rekening?: Rekening;
};

export type EntriGajiView = {
  id: string;
  nominal: number;
  tanggalBerlaku: string;
  keadaan: KeadaanGajiPokok;
  oleh: string;
  pada: string;
};

export type DetailKaryawan = BarisKaryawan & {
  tanggalMasuk?: string;
  tanggalKeluar: string | null;
  ptkpKode?: string;
  gajiPokok?: EntriGajiView[];
  riwayat?: RiwayatPerubahan[];
};

function namaDari(daftar: readonly { id: string; nama: string }[], id: string) {
  return daftar.find((item) => item.id === id)?.nama ?? "—";
}

function labelTipe(tipe: Karyawan["tipe"]) {
  return TIPE_KARYAWAN.find((item) => item.value === tipe)?.label ?? tipe;
}

/** Personal fields leave the server only for roles allowed to read them. */
function toBaris(karyawan: Karyawan, akses: AksesKaryawan, master: DaftarAktif): BarisKaryawan {
  return {
    id: karyawan.id,
    nama: karyawan.nama,
    status: karyawan.status,
    ...(akses.identitas
      ? {
          nik: karyawan.nik,
          jabatan: namaDari(master.jabatan, karyawan.jabatanId),
          departemen: namaDari(master.departemen, karyawan.departemenId),
          tipe: labelTipe(karyawan.tipe),
        }
      : {}),
    ...(akses.rekening ? { rekening: { ...karyawan.rekening } } : {}),
  };
}

export async function listKaryawan(akses: AksesKaryawan): Promise<BarisKaryawan[]> {
  if (!akses.bolehMembaca) return [];
  const master = daftarAktif();
  return [...semuaKaryawan()]
    .sort((a, b) => a.nik.localeCompare(b.nik))
    .map((karyawan) => toBaris(karyawan, akses, master));
}

export async function getKaryawan(
  id: string,
  akses: AksesKaryawan,
  hariIni: string = hariIniJakarta(),
): Promise<DetailKaryawan | null> {
  const karyawan = akses.bolehMembaca ? cariKaryawan(id) : undefined;
  if (!karyawan) return null;

  const detail: DetailKaryawan = {
    ...toBaris(karyawan, akses, daftarAktif()),
    tanggalKeluar: karyawan.tanggalKeluar,
  };
  if (akses.identitas) {
    detail.tanggalMasuk = karyawan.tanggalMasuk;
    detail.riwayat = [...karyawan.riwayat].reverse();
  }
  if (akses.gajiPtkp) {
    const keadaan = deriveKeadaanGaji(karyawan.gajiPokok, hariIni);
    detail.ptkpKode = karyawan.ptkpKode;
    detail.gajiPokok = [...karyawan.gajiPokok]
      .sort((a, b) => b.tanggalBerlaku.localeCompare(a.tanggalBerlaku))
      .map((entri) => ({ ...entri, keadaan: keadaan.get(entri.id) ?? "digantikan" }));
  }
  return detail;
}

/** Raw record for the edit form; HR only, since it carries every field. */
export async function getKaryawanUntukUbah(
  id: string,
  akses: AksesKaryawan,
): Promise<Karyawan | null> {
  if (!akses.bolehMengubah) return null;
  const karyawan = cariKaryawan(id);
  return karyawan ? structuredClone(karyawan) : null;
}

export async function getDaftarAktif(): Promise<DaftarAktif> {
  return daftarAktif();
}
