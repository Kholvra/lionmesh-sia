import {
  getPengadaanExecutionContext,
  getPenerimaan,
  listExceptionPengadaan,
  listPenerimaan,
  listPoSiapTerima,
  type ExceptionPengadaanView,
  type PenerimaanDetail,
  type PenerimaanView,
  type PoSiapTerima,
} from "@/core/pengadaan";
import { listGudang, listProduk } from "@/core/master";
import type { Peran } from "@/lib/auth/types";

export interface PenerimaanPageData {
  daftar: PenerimaanView[];
  terpilih: PenerimaanDetail | null;
  poSiapTerima: PoSiapTerima[];
  gudang: Awaited<ReturnType<typeof listGudang>>["data"];
  produk: Awaited<ReturnType<typeof listProduk>>["data"];
  exception: ExceptionPengadaanView[];
  error: string | null;
}

function bolehMelihat(peran: Peran | null): boolean {
  return (
    peran === "Gudang" ||
    peran === "Purchasing" ||
    peran === "Accounting" ||
    peran === "Manajemen"
  );
}

const KOSONG: PenerimaanPageData = {
  daftar: [],
  terpilih: null,
  poSiapTerima: [],
  gudang: [],
  produk: [],
  exception: [],
  error: null,
};

export function hariIniJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    new Date(),
  );
}

export async function getPenerimaanPageData(
  peran: Peran | null,
  options: { penerimaanId?: string; poId?: string } = {},
): Promise<PenerimaanPageData> {
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { ...KOSONG, error: context.message };
  if (!bolehMelihat(peran)) {
    return { ...KOSONG, error: "Peran Anda tidak memiliki akses ke penerimaan barang." };
  }

  const client = context.data.supabase;
  const [daftar, poSiap, gudang, produk, exception] = await Promise.all([
    listPenerimaan(client),
    listPoSiapTerima(client),
    listGudang(client, { aktif: true }),
    listProduk(client, { aktif: true }),
    listExceptionPengadaan(client, { status: "TERBUKA" }),
  ]);

  let terpilih: PenerimaanDetail | null = null;
  let error: string | null = null;

  if (options.penerimaanId) {
    const detail = await getPenerimaan(client, options.penerimaanId);
    if (!detail.ok) error = detail.message;
    else terpilih = detail.data;
  }

  return {
    daftar: daftar.ok ? daftar.data : [],
    terpilih,
    poSiapTerima: poSiap.ok ? poSiap.data : [],
    gudang: gudang.data,
    produk: produk.data,
    exception: exception.ok ? exception.data : [],
    error:
      error ??
      (daftar.ok
        ? (poSiap.ok ? null : poSiap.message) ??
          (exception.ok ? null : exception.message) ??
          gudang.error ??
          produk.error
        : daftar.message),
  };
}
