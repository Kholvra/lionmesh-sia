import type { SupabaseClient } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";
import type { AksesKaryawan } from "@/modules/penggajian/karyawan/akses";
import { formatTanggal, hariIniJakarta } from "@/modules/penggajian/karyawan/format";
import { deriveKeadaanGaji, TIPE_KARYAWAN } from "@/modules/penggajian/karyawan/rules";
import type {
  DaftarAktif,
  GajiPokok,
  Karyawan,
  KeadaanGajiPokok,
  Rekening,
  RiwayatPerubahan,
  StatusKaryawan,
  TipeKaryawan,
} from "@/modules/penggajian/karyawan/types";

/*
 * Reads go through the role-filtered views of migration 0016 (karyawan_aman,
 * gaji_pokok_aman, karyawan_riwayat). The database hides the columns a role
 * may not read; toBaris below only shapes what is left for the screens.
 */

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

type BarisView = {
  id: string;
  nama: string;
  status: StatusKaryawan;
  tanggal_keluar: string | null;
  nik: string | null;
  departemen_id: string | null;
  jabatan_id: string | null;
  tipe: TipeKaryawan | null;
  tanggal_masuk: string | null;
  ptkp_kode: string | null;
  rekening_nama_bank: string | null;
  rekening_nomor: string | null;
  rekening_nama_pemilik: string | null;
};

type BarisGaji = {
  id: string;
  karyawan_id: string;
  nominal: string;
  tanggal_berlaku: string;
  created_by_nama: string;
  created_at: string;
};

type BarisRiwayat = {
  id: string;
  aksi: "BUAT" | "UBAH" | "NONAKTIFKAN" | "AKTIFKAN";
  actor_nama: string;
  created_at: string;
};

const KOLOM_KARYAWAN =
  "id, nama, status, tanggal_keluar, nik, departemen_id, jabatan_id, tipe, tanggal_masuk, ptkp_kode, rekening_nama_bank, rekening_nomor, rekening_nama_pemilik";
// numeric travels as text (ISSUE-001 F13); a monthly salary is far below 2^53.
const KOLOM_GAJI = "id, karyawan_id, nominal::text, tanggal_berlaku, created_by_nama, created_at";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const KETERANGAN_RIWAYAT: Record<BarisRiwayat["aksi"], string> = {
  BUAT: "Data karyawan dibuat",
  UBAH: "Data karyawan diubah",
  NONAKTIFKAN: "Status diubah menjadi Nonaktif",
  AKTIFKAN: "Status diubah menjadi Aktif",
};

function gagalBaca(error: { message: string } | null): never {
  throw new Error(`Data karyawan gagal dimuat: ${error?.message ?? "tanpa keterangan"}`);
}

function keGaji(baris: BarisGaji): GajiPokok {
  return {
    id: baris.id,
    nominal: Number(baris.nominal),
    tanggalBerlaku: baris.tanggal_berlaku,
    oleh: baris.created_by_nama,
    pada: baris.created_at,
  };
}

/** Hidden columns arrive as null; they are blanked and never leave toBaris. */
function keKaryawan(baris: BarisView, gaji: GajiPokok[], riwayat: RiwayatPerubahan[]): Karyawan {
  return {
    id: baris.id,
    nik: baris.nik ?? "",
    nama: baris.nama,
    jabatanId: baris.jabatan_id ?? "",
    departemenId: baris.departemen_id ?? "",
    tipe: baris.tipe ?? "PRODUKSI",
    ptkpKode: baris.ptkp_kode ?? "",
    rekening: {
      namaBank: baris.rekening_nama_bank ?? "",
      nomor: baris.rekening_nomor ?? "",
      namaPemilik: baris.rekening_nama_pemilik ?? "",
    },
    tanggalMasuk: baris.tanggal_masuk ?? "",
    tanggalKeluar: baris.tanggal_keluar,
    status: baris.status,
    gajiPokok: gaji,
    riwayat,
  };
}

/** Status/data events plus salary entries, oldest first like the old store. */
function susunRiwayat(status: BarisRiwayat[], gaji: GajiPokok[]): RiwayatPerubahan[] {
  return [
    ...status.map((r) => ({ id: r.id, keterangan: KETERANGAN_RIWAYAT[r.aksi], oleh: r.actor_nama, pada: r.created_at })),
    ...gaji.map((g) => ({
      id: `gaji-${g.id}`,
      keterangan: `Gaji pokok berlaku ${formatTanggal(g.tanggalBerlaku)} ditambahkan`,
      oleh: g.oleh,
      pada: g.pada,
    })),
  ].sort((a, b) => a.pada.localeCompare(b.pada));
}

async function muatDaftarAktif(client: SupabaseClient): Promise<DaftarAktif> {
  const [dep, jab, ptkp] = await Promise.all([
    client.from("departemen").select("id, nama").eq("aktif", true).order("nama"),
    client.from("jabatan").select("id, nama").eq("aktif", true).order("nama"),
    client.from("kategori_ptkp").select("kode, nama").eq("aktif", true).order("kode"),
  ]);
  if (dep.error || jab.error || ptkp.error) gagalBaca(dep.error ?? jab.error ?? ptkp.error);
  return {
    departemen: dep.data,
    jabatan: jab.data,
    ptkp: ptkp.data.map((p) => ({ kode: p.kode, keterangan: p.nama })),
  };
}

/** Full record as the caller's role may see it; null when absent or invisible. */
export async function muatKaryawan(id: string, client?: SupabaseClient): Promise<Karyawan | null> {
  if (!UUID.test(id)) return null;
  const supabase = client ?? (await createClient());
  const [k, g, r] = await Promise.all([
    supabase.from("karyawan_aman").select(KOLOM_KARYAWAN).eq("id", id).maybeSingle<BarisView>(),
    supabase.from("gaji_pokok_aman").select(KOLOM_GAJI).eq("karyawan_id", id).returns<BarisGaji[]>(),
    supabase
      .from("karyawan_riwayat")
      .select("id, aksi, actor_nama, created_at")
      .eq("karyawan_id", id)
      .returns<BarisRiwayat[]>(),
  ]);
  if (k.error || g.error || r.error) gagalBaca(k.error ?? g.error ?? r.error);
  if (!k.data) return null;
  const gaji = g.data.map(keGaji);
  return keKaryawan(k.data, gaji, susunRiwayat(r.data, gaji));
}

/** NIK already in use, for the form message before the database rejects it. */
export async function nikTerpakai(client: SupabaseClient): Promise<string[]> {
  const { data, error } = await client.from("karyawan_aman").select("nik").returns<{ nik: string | null }[]>();
  if (error) gagalBaca(error);
  return data.flatMap((row) => (row.nik ? [row.nik] : []));
}

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
  const supabase = await createClient();
  const [master, k] = await Promise.all([
    muatDaftarAktif(supabase),
    supabase.from("karyawan_aman").select(KOLOM_KARYAWAN).returns<BarisView[]>(),
  ]);
  if (k.error) gagalBaca(k.error);
  return k.data
    .map((baris) => keKaryawan(baris, [], []))
    .sort((a, b) => (a.nik || a.nama).localeCompare(b.nik || b.nama))
    .map((karyawan) => toBaris(karyawan, akses, master));
}

export async function getKaryawan(
  id: string,
  akses: AksesKaryawan,
  hariIni: string = hariIniJakarta(),
): Promise<DetailKaryawan | null> {
  if (!akses.bolehMembaca) return null;
  const supabase = await createClient();
  const [karyawan, master] = await Promise.all([muatKaryawan(id, supabase), muatDaftarAktif(supabase)]);
  if (!karyawan) return null;

  const detail: DetailKaryawan = {
    ...toBaris(karyawan, akses, master),
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
  return muatKaryawan(id);
}

export async function getDaftarAktif(client?: SupabaseClient): Promise<DaftarAktif> {
  return muatDaftarAktif(client ?? (await createClient()));
}
