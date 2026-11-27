import { z } from "zod";

const bomItemSchema = z.object({
  id: z.string(),
  produkNama: z.string(),
  produkKode: z.string(),
  versiNumber: z.number(),
  berlakuDari: z.string(),
  berlakuDariISO: z.string(),
  toleransiScrap: z.string(),
  toleransiReject: z.string(),
  jumlahPerLembarKg: z.number(),
  komponenKode: z.string(),
  komponenNama: z.string(),
  status: z.enum(["BERLAKU", "TERJADWAL", "DIGANTIKAN"]),
});

const spkItemSchema = z.object({
  id: z.string(),
  nomorSpk: z.string(),
  sumberInfo: z.string(),
  produkNama: z.string(),
  produkKode: z.string(),
  versiBom: z.string(),
  mesin: z.string().optional(),
  jumlahLembar: z.number(),
  jadwalText: z.string(),
  tanggalMulaiISO: z.string(),
  tanggalSelesaiISO: z.string(),
  status: z.enum([
    "MENUNGGU_QC",
    "BARANG_JADI",
    "DIRENCANAKAN",
    "MENUNGGU_BAHAN",
    "DIPROSES",
  ]),
  filterCategory: z.enum([
    "direncanakan",
    "menunggu_bahan",
    "diproses",
    "hasil_dicatat",
  ]),
});

const purchaseRequestItemSchema = z.object({
  id: z.string(),
  nomorPr: z.string(),
  nomorSpk: z.string(),
  produkLabel: z.string(),
  bahanNama: z.string(),
  bahanKode: z.string(),
  jumlahDimintaTon: z.number(),
  dibutuhkanPalingLambat: z.string(),
  status: z.enum(["DIPERIKSA_PURCHASING", "MENUNGGU_PEMBELIAN", "DIKELUARKAN"]),
  createdAtShort: z.string(),
});

const hasilProduksiSpkItemSchema = z.object({
  id: z.string(),
  nomorSpk: z.string(),
  jadwalText: z.string(),
  produkNama: z.string(),
  produkKode: z.string(),
  targetLembar: z.number(),
  bahanDiterimaText: z.string(),
  status: z.enum(["DIPROSES", "REWORK"]),
});

const kartuJamKerjaItemSchema = z.object({
  id: z.string(),
  nomorSpk: z.string(),
  namaKaryawan: z.string(),
  nik: z.string(),
  tanggal: z.string(),
  tanggalISO: z.string(),
  jamReguler: z.number(),
  jamLembur: z.number(),
  totalJam: z.number(),
  tarifPerJam: z.number(),
  totalTkl: z.number(),
  kegiatan: z.string(),
  status: z.enum(["TERCATAT", "DIBEBANKAN"]),
});

const hasilTercatatSchema = z.object({
  nomorSpk: z.string(),
  produkNama: z.string(),
  jumlahJadi: z.number(),
  scrapText: z.string(),
  selesaiPada: z.string(),
});

const KOLEKSI = {
  bom: { key: "lionmesh_bom_list_v1", schema: z.array(bomItemSchema) },
  spk: { key: "lionmesh_spk_list_v1", schema: z.array(spkItemSchema) },
  pr: { key: "lionmesh_pr_list_v1", schema: z.array(purchaseRequestItemSchema) },
  hasilProduksi: {
    key: "lionmesh_hasil_produksi_list_v1",
    schema: z.array(hasilProduksiSpkItemSchema),
  },
  kartuJamKerja: {
    key: "lionmesh_kjk_list_v1",
    schema: z.array(kartuJamKerjaItemSchema),
  },
} as const;

export type KoleksiProduksi = keyof typeof KOLEKSI;
export type ItemKoleksi<K extends KoleksiProduksi> = z.infer<
  (typeof KOLEKSI)[K]["schema"]
>[number];
export type HasilTercatat = z.infer<typeof hasilTercatatSchema>;

/** Reads one collection, returning an honest empty list for missing or invalid data. */
export function bacaKoleksi<K extends KoleksiProduksi>(
  koleksi: K,
): ItemKoleksi<K>[] {
  if (typeof window === "undefined") return [];

  try {
    const mentah = window.sessionStorage.getItem(KOLEKSI[koleksi].key);
    if (!mentah) return [];
    const hasil = KOLEKSI[koleksi].schema.safeParse(JSON.parse(mentah));
    return hasil.success ? (hasil.data as ItemKoleksi<K>[]) : [];
  } catch {
    return [];
  }
}

/** Writes one collection only after validation, keeping storage typed. */
export function simpanKoleksi<K extends KoleksiProduksi>(
  koleksi: K,
  items: ItemKoleksi<K>[],
): void {
  if (typeof window === "undefined") return;

  try {
    const hasil = KOLEKSI[koleksi].schema.safeParse(items);
    if (!hasil.success) return;
    window.sessionStorage.setItem(
      KOLEKSI[koleksi].key,
      JSON.stringify(hasil.data),
    );
  } catch {
    // Storage may be unavailable in private browsing.
  }
}

export function kunciHasilTercatat(nomorSpk: string): string {
  return `lionmesh_hasil_recorded_${nomorSpk.toLowerCase()}`;
}

export function bacaHasilTercatat(nomorSpk: string): HasilTercatat | null {
  if (typeof window === "undefined") return null;

  try {
    const mentah = window.sessionStorage.getItem(kunciHasilTercatat(nomorSpk));
    if (!mentah) return null;
    const hasil = hasilTercatatSchema.safeParse(JSON.parse(mentah));
    return hasil.success ? hasil.data : null;
  } catch {
    return null;
  }
}

export function simpanHasilTercatat(payload: HasilTercatat): void {
  if (typeof window === "undefined") return;

  try {
    const hasil = hasilTercatatSchema.safeParse(payload);
    if (!hasil.success) return;
    window.sessionStorage.setItem(
      kunciHasilTercatat(payload.nomorSpk),
      JSON.stringify(hasil.data),
    );
  } catch {
    // Storage may be unavailable in private browsing.
  }
}
