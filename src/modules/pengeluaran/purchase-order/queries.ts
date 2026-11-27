import {
  getPengadaanExecutionContext,
  getPemilihanPemasok,
  getPurchaseOrder,
  getTarifPpn,
  listPermintaanPembelian,
  listPurchaseOrder,
  type PemilihanPemasokView,
  type PermintaanPembelianView,
  type PurchaseOrderDetail,
  type PurchaseOrderView,
} from "@/core/pengadaan";
import { listProduk, listSatuan } from "@/core/master";
import type { Peran } from "@/lib/auth/types";

export interface PoPageData {
  daftar: PurchaseOrderView[];
  siapDiterbitkan: PermintaanPembelianView[];
  terpilih: PurchaseOrderDetail | null;
  permintaan: PemilihanPemasokView | null;
  tarifPpn: string | null;
  produk: Awaited<ReturnType<typeof listProduk>>["data"];
  satuan: Awaited<ReturnType<typeof listSatuan>>["data"];
  error: string | null;
}

function bolehMelihat(peran: Peran | null): boolean {
  return peran === "Purchasing" || peran === "Manajemen" || peran === "Accounting";
}

const KOSONG: PoPageData = {
  daftar: [],
  siapDiterbitkan: [],
  terpilih: null,
  permintaan: null,
  tarifPpn: null,
  produk: [],
  satuan: [],
  error: null,
};

export function hariIniJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    new Date(),
  );
}

export async function getPoPageData(
  peran: Peran | null,
  options: { poId?: string; permintaanId?: string } = {},
): Promise<PoPageData> {
  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { ...KOSONG, error: context.message };
  if (!bolehMelihat(peran)) {
    return { ...KOSONG, error: "Peran Anda tidak memiliki akses ke purchase order." };
  }

  const client = context.data.supabase;
  const [daftar, siap, produk, satuan, tarif] = await Promise.all([
    listPurchaseOrder(client),
    listPermintaanPembelian(client, { statuses: ["PEMASOK_DITETAPKAN"] }),
    listProduk(client, { aktif: true }),
    listSatuan(client, { aktif: true }),
    getTarifPpn(client, hariIniJakarta()),
  ]);

  let terpilih: PurchaseOrderDetail | null = null;
  let permintaan: PemilihanPemasokView | null = null;
  let error =
    tarif.ok && tarif.data === null
      ? "Tarif PPN untuk tanggal ini belum tersedia. Hubungi tech lead untuk mengisi konfigurasi pajak."
      : null;

  if (options.poId) {
    const detail = await getPurchaseOrder(client, options.poId);
    if (!detail.ok) error = detail.message;
    else terpilih = detail.data;
  }

  if (options.permintaanId) {
    const detail = await getPemilihanPemasok(client, options.permintaanId);
    if (!detail.ok) error = detail.message;
    else permintaan = detail.data;
  }

  return {
    daftar: daftar.ok ? daftar.data : [],
    siapDiterbitkan: siap.ok ? siap.data : [],
    terpilih,
    permintaan,
    tarifPpn: tarif.ok ? tarif.data : null,
    produk: produk.data,
    satuan: satuan.data,
    error:
      error ??
      (daftar.ok
        ? (siap.ok ? null : siap.message) ?? produk.error ?? satuan.error
        : daftar.message),
  };
}
