import {
  getPengadaanExecutionContext,
  getPemilihanPemasok,
  listPermintaanPembelian,
  listRiwayatHarga,
  type PemilihanPemasokView,
  type PermintaanPembelianView,
  type RiwayatHarga,
} from "@/core/pengadaan";
import { listPemasok, type Pemasok } from "@/core/pemasok";
import { listProduk, listSatuan } from "@/core/master";
import type { Peran } from "@/lib/auth/types";

export interface PemilihanPageData {
  daftar: PermintaanPembelianView[];
  terpilih: PemilihanPemasokView | null;
  pemasok: Pemasok[];
  produk: Awaited<ReturnType<typeof listProduk>>["data"];
  satuan: Awaited<ReturnType<typeof listSatuan>>["data"];
  riwayatHarga: RiwayatHarga[];
  error: string | null;
}

function bolehMelihat(peran: Peran | null): boolean {
  return peran === "Purchasing" || peran === "Manajemen" || peran === "Accounting";
}

const KOSONG: PemilihanPageData = {
  daftar: [],
  terpilih: null,
  pemasok: [],
  produk: [],
  satuan: [],
  riwayatHarga: [],
  error: null,
};

export async function getPemilihanPageData(
  peran: Peran | null,
  permintaanId?: string,
): Promise<PemilihanPageData> {
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { ...KOSONG, error: context.message };
  if (!bolehMelihat(peran)) {
    return { ...KOSONG, error: "Peran Anda tidak memiliki akses ke pemilihan pemasok." };
  }

  const client = context.data.supabase;
  const [daftar, pemasok, produk, satuan] = await Promise.all([
    listPermintaanPembelian(client, {
      statuses: ["DISETUJUI", "PEMASOK_DITETAPKAN"],
    }),
    listPemasok(client),
    listProduk(client, { aktif: true }),
    listSatuan(client, { aktif: true }),
  ]);

  let terpilih: PemilihanPemasokView | null = null;
  let riwayatHarga: RiwayatHarga[] = [];
  let error = daftar.ok ? (pemasok.error ?? produk.error ?? satuan.error) : daftar.message;

  if (permintaanId) {
    const detail = await getPemilihanPemasok(client, permintaanId);
    if (!detail.ok) {
      error = detail.message;
    } else if (detail.data) {
      terpilih = detail.data;
      const produkIds = [...new Set(detail.data.items.map((item) => item.produk_id))];
      const riwayat = await listRiwayatHarga(client, produkIds);
      if (!riwayat.ok) {
        error = riwayat.message;
      } else {
        riwayatHarga = riwayat.data;
      }
    }
  }

  return {
    daftar: daftar.ok ? daftar.data : [],
    terpilih,
    pemasok: pemasok.data,
    produk: produk.data,
    satuan: satuan.data,
    riwayatHarga,
    error,
  };
}
