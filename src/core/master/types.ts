export type TipeProduk = "bahan" | "barang_dalam_proses" | "barang_jadi";

export const DAFTAR_TIPE_PRODUK: readonly {
  value: TipeProduk;
  label: string;
  akunPersediaan: string;
}[] = [
  { value: "bahan", label: "Bahan", akunPersediaan: "120" },
  { value: "barang_dalam_proses", label: "Barang dalam proses", akunPersediaan: "121" },
  { value: "barang_jadi", label: "Barang jadi", akunPersediaan: "122" },
];

export interface Satuan {
  id: string;
  kode: string;
  nama: string;
  aktif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Gudang {
  id: string;
  kode: string;
  nama: string;
  aktif: boolean;
  created_at: string;
  updated_at: string;
}

export interface KategoriProduk {
  id: string;
  kode: string;
  nama: string;
  aktif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Produk {
  id: string;
  kode: string;
  nama: string;
  tipe: TipeProduk;
  satuan_dasar_id: string;
  satuan_dasar_kode: string;
  satuan_dasar_nama: string;
  kategori_id: string | null;
  kategori_kode: string | null;
  kategori_nama: string | null;
  aktif: boolean;
  created_at: string;
  updated_at: string;
}

export interface KonversiSatuan {
  id: string;
  satuan_dari_id: string;
  satuan_dari_kode: string;
  satuan_ke_id: string;
  satuan_ke_kode: string;
  /** Decimal string: numeric(18,6) must not pass through a JS number. */
  faktor: string;
  created_at: string;
  updated_at: string;
}

export interface MataUang {
  id: string;
  kode: string;
  nama: string;
  simbol: string | null;
  aktif: boolean;
  created_at: string;
  updated_at: string;
}

export interface Kurs {
  id: string;
  mata_uang_id: string;
  mata_uang_kode: string;
  tanggal: string;
  /** Decimal string: numeric(18,6) must not pass through a JS number. */
  nilai: string;
  created_at: string;
  updated_at: string;
}

export type EntitasMaster =
  | "produk"
  | "kategori_produk"
  | "gudang"
  | "satuan"
  | "mata_uang";

export interface RiwayatStatusMaster {
  id: string;
  entitas: EntitasMaster;
  entitas_id: string;
  aksi: string;
  status_lama: string | null;
  status_baru: string;
  actor_id: string | null;
  actor_nama: string;
  created_at: string;
}

export interface ProdukInput {
  kode: string;
  nama: string;
  tipe: TipeProduk;
  satuanDasarId: string;
  kategoriId: string | null;
}

export interface GudangInput {
  kode: string;
  nama: string;
}

export interface SatuanInput {
  kode: string;
  nama: string;
}

export interface KategoriProdukInput {
  kode: string;
  nama: string;
}

export interface KonversiSatuanInput {
  satuanDariId: string;
  satuanKeId: string;
  /** Decimal string: numeric(18,6) must not pass through a JS number. */
  faktor: string;
}

export interface MataUangInput {
  kode: string;
  nama: string;
  simbol: string | null;
}

export interface KursInput {
  mataUangId: string;
  tanggal: string;
  /** Decimal string: numeric(18,6) must not pass through a JS number. */
  nilai: string;
}

export interface MasterListOptions {
  aktif?: boolean;
}
