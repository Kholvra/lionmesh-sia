import type {
  DaftarAktif,
  DataKaryawanInput,
  GajiPokok,
  Karyawan,
  RiwayatPerubahan,
  TipeKaryawan,
} from "@/modules/penggajian/karyawan/types";

/*
 * Temporary in-memory store. The `karyawan` tables belong to core (D-31) and
 * have no migration yet, so the screens run against this store until the DDL
 * lands. Only queries.ts and actions.ts may import it; swapping it for a core
 * service must not touch any screen.
 */

const DAFTAR_AKTIF: DaftarAktif = {
  departemen: [
    { id: "dep-produksi", nama: "Produksi" },
    { id: "dep-administrasi", nama: "Administrasi" },
    { id: "dep-penjualan", nama: "Penjualan" },
    { id: "dep-gudang", nama: "Gudang" },
  ],
  jabatan: [
    { id: "jab-operator", nama: "Operator" },
    { id: "jab-operator-senior", nama: "Operator senior" },
    { id: "jab-staf-administrasi", nama: "Staf administrasi" },
    { id: "jab-staf-penjualan", nama: "Staf penjualan" },
    { id: "jab-staf-gudang", nama: "Staf gudang" },
  ],
  // Illustrative until the versioned PTKP table exists (D-19).
  ptkp: [
    { kode: "TK/0", keterangan: "Tidak kawin, tanpa tanggungan" },
    { kode: "TK/1", keterangan: "Tidak kawin, 1 tanggungan" },
    { kode: "TK/2", keterangan: "Tidak kawin, 2 tanggungan" },
    { kode: "TK/3", keterangan: "Tidak kawin, 3 tanggungan" },
    { kode: "K/0", keterangan: "Kawin, tanpa tanggungan" },
    { kode: "K/1", keterangan: "Kawin, 1 tanggungan" },
    { kode: "K/2", keterangan: "Kawin, 2 tanggungan" },
    { kode: "K/3", keterangan: "Kawin, 3 tanggungan" },
  ],
};

const SEED_PADA = "2026-01-02T02:00:00.000Z";

function seedKaryawan(
  urut: number,
  nama: string,
  departemenId: string,
  jabatanId: string,
  tipe: TipeKaryawan,
  ptkpKode: string,
  bank: string,
  gaji: readonly [number, string][],
): Karyawan {
  const id = `kry-${urut}`;
  return {
    id,
    nik: `321605129001000${urut}`,
    nama,
    jabatanId,
    departemenId,
    tipe,
    ptkpKode,
    rekening: { namaBank: bank, nomor: `772055110${urut}`, namaPemilik: nama },
    tanggalMasuk: "2024-03-04",
    tanggalKeluar: null,
    status: "AKTIF",
    gajiPokok: gaji.map(([nominal, tanggalBerlaku], index) => ({
      id: `${id}-gaji-${index + 1}`,
      nominal,
      tanggalBerlaku,
      oleh: "HR",
      pada: SEED_PADA,
    })),
    riwayat: [{ id: `${id}-riwayat-1`, keterangan: "Data karyawan dibuat", oleh: "HR", pada: SEED_PADA }],
  };
}

function initialKaryawan(): Karyawan[] {
  return [
    seedKaryawan(1, "Agus", "dep-produksi", "jab-operator", "PRODUKSI", "K/1", "BCA", [
      [2_350_000, "2025-01-01"],
      [2_500_000, "2026-01-01"],
      [2_650_000, "2027-01-01"],
    ]),
    seedKaryawan(2, "Siti", "dep-produksi", "jab-operator", "PRODUKSI", "TK/0", "BRI", [
      [2_400_000, "2026-01-01"],
    ]),
    seedKaryawan(3, "Rina", "dep-administrasi", "jab-staf-administrasi", "NON_PRODUKSI", "K/0", "Mandiri", [
      [3_100_000, "2026-01-01"],
    ]),
    seedKaryawan(4, "Doni", "dep-penjualan", "jab-staf-penjualan", "NON_PRODUKSI", "TK/1", "BNI", [
      [3_000_000, "2026-01-01"],
    ]),
  ];
}

// Survive dev-server module reloads so a saved row does not vanish mid-session.
const globalStore = globalThis as typeof globalThis & { __karyawanStore?: Karyawan[] };

function rows(): Karyawan[] {
  globalStore.__karyawanStore ??= initialKaryawan();
  return globalStore.__karyawanStore;
}

function catatan(keterangan: string, oleh: string, pada: string): RiwayatPerubahan {
  return { id: crypto.randomUUID(), keterangan, oleh, pada };
}

export function daftarAktif(): DaftarAktif {
  return DAFTAR_AKTIF;
}

export function semuaKaryawan(): readonly Karyawan[] {
  return rows();
}

export function cariKaryawan(id: string): Karyawan | undefined {
  return rows().find((karyawan) => karyawan.id === id);
}

export function simpanKaryawanBaru(
  data: DataKaryawanInput & { nik: string; tipe: TipeKaryawan },
  gaji: { nominal: number; tanggalBerlaku: string },
  oleh: string,
  pada: string,
): Karyawan {
  const id = crypto.randomUUID();
  const karyawan: Karyawan = {
    ...data,
    id,
    tanggalKeluar: null,
    status: "AKTIF",
    gajiPokok: [{ id: crypto.randomUUID(), ...gaji, oleh, pada }],
    riwayat: [catatan("Data karyawan dibuat", oleh, pada)],
  };
  rows().push(karyawan);
  return karyawan;
}

export function ubahDataKaryawan(
  karyawan: Karyawan,
  data: DataKaryawanInput & { tipe: TipeKaryawan },
  oleh: string,
  pada: string,
): void {
  Object.assign(karyawan, data);
  karyawan.riwayat.push(catatan("Data karyawan diubah", oleh, pada));
}

/** History rows are append-only (INV-02): a correction is a new entry. */
export function tambahGajiPokok(
  karyawan: Karyawan,
  gaji: Omit<GajiPokok, "id">,
): void {
  karyawan.gajiPokok.push({ id: crypto.randomUUID(), ...gaji });
  karyawan.riwayat.push(catatan("Gaji pokok ditambahkan", gaji.oleh, gaji.pada));
}

export function nonaktifkanKaryawan(
  karyawan: Karyawan,
  tanggalKeluar: string,
  oleh: string,
  pada: string,
): void {
  karyawan.status = "NONAKTIF";
  karyawan.tanggalKeluar = tanggalKeluar;
  karyawan.riwayat.push(catatan("Status diubah menjadi Nonaktif", oleh, pada));
}
