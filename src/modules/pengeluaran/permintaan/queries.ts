import {
  getPengadaanExecutionContext,
  getPermintaanPembelian,
  listPermintaanPembelian,
  type PermintaanPembelianItem,
  type PermintaanPembelianView,
} from "@/core/pengadaan";
import { listGudang, listProduk, listSatuan } from "@/core/master";
import type { RiwayatStatus } from "@/core/dokumen";
import { cekIzin } from "@/lib/auth/permissions";
import type { Peran } from "@/lib/auth/types";

export interface PermintaanPageData {
  daftar: PermintaanPembelianView[];
  terpilih:
    | {
        header: PermintaanPembelianView;
        detail: PermintaanPembelianItem[];
        riwayat: RiwayatStatus[];
      }
    | null;
  produk: Awaited<ReturnType<typeof listProduk>>["data"];
  satuan: Awaited<ReturnType<typeof listSatuan>>["data"];
  gudang: Awaited<ReturnType<typeof listGudang>>["data"];
  error: string | null;
}

function bolehMelihat(peran: Peran | null): boolean {
  return (
    cekIzin(peran, "lihat_permintaan_pembelian") ||
    cekIzin(peran, "lihat_permintaan_pembelian_sendiri")
  );
}

export async function getPermintaanPageData(
  peran: Peran | null,
  permintaanId?: string,
): Promise<PermintaanPageData> {
  const context = await getPengadaanExecutionContext();
  if (!context.ok) {
    return { daftar: [], terpilih: null, produk: [], satuan: [], gudang: [], error: context.message };
  }

  if (!bolehMelihat(peran)) {
    return {
      daftar: [],
      terpilih: null,
      produk: [],
      satuan: [],
      gudang: [],
      error: "Peran Anda tidak memiliki akses ke permintaan pembelian.",
    };
  }

  const client = context.data.supabase;
  const pemohonId = cekIzin(peran, "lihat_permintaan_pembelian_sendiri")
    ? context.data.actorId
    : undefined;

  const [daftar, produk, satuan, gudang] = await Promise.all([
    listPermintaanPembelian(client, { pemohonId }),
    listProduk(client, { aktif: true }),
    listSatuan(client, { aktif: true }),
    listGudang(client, { aktif: true }),
  ]);

  let terpilih: PermintaanPageData["terpilih"] = null;
  if (permintaanId) {
    const detail = await getPermintaanPembelian(client, permintaanId);
    if (!detail.ok) {
      return {
        daftar: daftar.ok ? daftar.data : [],
        terpilih: null,
        produk: produk.data,
        satuan: satuan.data,
        gudang: gudang.data,
        error: detail.message,
      };
    }
    if (detail.data && (!pemohonId || detail.data.header.pemohonId === pemohonId)) {
      terpilih = detail.data;
    }
  }

  return {
    daftar: daftar.ok ? daftar.data : [],
    terpilih,
    produk: produk.data,
    satuan: satuan.data,
    gudang: gudang.data,
    error: daftar.ok ? (produk.error ?? satuan.error ?? gudang.error) : daftar.message,
  };
}
