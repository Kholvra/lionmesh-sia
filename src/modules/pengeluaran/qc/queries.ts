import {
  getPenerimaanQc,
  getPengadaanExecutionContext,
  getReturPemasok,
  listPenerimaan,
  listReturPemasok,
  type PenerimaanQcView,
  type PenerimaanView,
  type ReturPemasokDetail,
  type ReturPemasokView,
} from "@/core/pengadaan";
import { listProduk } from "@/core/master";
import type { Peran } from "@/lib/auth/types";

const PERAN_BACA: readonly Peran[] = [
  "QC",
  "Gudang",
  "Purchasing",
  "Accounting",
  "Manajemen",
];

function bolehMelihat(peran: Peran | null): boolean {
  return peran !== null && PERAN_BACA.includes(peran);
}

export interface QcPageData {
  daftar: PenerimaanView[];
  terpilih: PenerimaanQcView | null;
  produk: Awaited<ReturnType<typeof listProduk>>["data"];
  error: string | null;
}

export async function getQcPageData(
  peran: Peran | null,
  penerimaanId?: string,
): Promise<QcPageData> {
  const kosong: QcPageData = { daftar: [], terpilih: null, produk: [], error: null };
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { ...kosong, error: context.message };
  if (!bolehMelihat(peran)) {
    return { ...kosong, error: "Peran Anda tidak memiliki akses ke QC bahan." };
  }

  const client = context.data.supabase;
  const [daftar, produk] = await Promise.all([
    listPenerimaan(client),
    listProduk(client, { aktif: true }),
  ]);

  let terpilih: PenerimaanQcView | null = null;
  let error: string | null = daftar.ok ? produk.error : daftar.message;

  if (penerimaanId) {
    const detail = await getPenerimaanQc(client, penerimaanId);
    if (!detail.ok) error = detail.message;
    else terpilih = detail.data;
  }

  return {
    daftar: daftar.ok ? daftar.data : [],
    terpilih,
    produk: produk.data,
    error,
  };
}

export interface ReturPageData {
  daftar: ReturPemasokView[];
  terpilih: ReturPemasokDetail | null;
  penerimaan: PenerimaanQcView | null;
  kandidat: PenerimaanView[];
  produk: Awaited<ReturnType<typeof listProduk>>["data"];
  error: string | null;
}

export async function getReturPageData(
  peran: Peran | null,
  options: { returId?: string; penerimaanId?: string } = {},
): Promise<ReturPageData> {
  const kosong: ReturPageData = {
    daftar: [],
    terpilih: null,
    penerimaan: null,
    kandidat: [],
    produk: [],
    error: null,
  };
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { ...kosong, error: context.message };
  if (!bolehMelihat(peran)) {
    return { ...kosong, error: "Peran Anda tidak memiliki akses ke retur pemasok." };
  }

  const client = context.data.supabase;
  const [daftar, penerimaan, produk] = await Promise.all([
    listReturPemasok(client),
    listPenerimaan(client),
    listProduk(client, { aktif: true }),
  ]);

  let terpilih: ReturPemasokDetail | null = null;
  let dipilih: PenerimaanQcView | null = null;
  let error: string | null = daftar.ok ? produk.error : daftar.message;

  if (options.returId) {
    const detail = await getReturPemasok(client, options.returId);
    if (!detail.ok) error = detail.message;
    else terpilih = detail.data;
  }

  if (options.penerimaanId) {
    const detail = await getPenerimaanQc(client, options.penerimaanId);
    if (!detail.ok) error = detail.message;
    else dipilih = detail.data;
  }

  return {
    daftar: daftar.ok ? daftar.data : [],
    terpilih,
    penerimaan: dipilih,
    kandidat: penerimaan.ok
      ? penerimaan.data.filter(
          (row) => row.status === "QC_LULUS" || row.status === "QC_GAGAL",
        )
      : [],
    produk: produk.data,
    error,
  };
}
