import {
  getInvoicePemasok,
  getPengadaanExecutionContext,
  getTarifPpn,
  listInvoicePemasok,
  listPenerimaanSiapInvoice,
  type InvoicePemasokDetail,
  type InvoicePemasokView,
  type PenerimaanSiapInvoice,
} from "@/core/pengadaan";
import { listProduk } from "@/core/master";
import type { Peran } from "@/lib/auth/types";

const PERAN_BACA: readonly Peran[] = [
  "Accounting",
  "Purchasing",
  "Manajemen",
  "Finance",
];

export interface InvoicePageData {
  daftar: InvoicePemasokView[];
  terpilih: InvoicePemasokDetail | null;
  kandidat: PenerimaanSiapInvoice[];
  produk: Awaited<ReturnType<typeof listProduk>>["data"];
  tarifPpn: string | null;
  error: string | null;
}

export function hariIniJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    new Date(),
  );
}

export async function getInvoicePageData(
  peran: Peran | null,
  options: { invoiceId?: string; penerimaanId?: string } = {},
): Promise<InvoicePageData> {
  const kosong: InvoicePageData = {
    daftar: [],
    terpilih: null,
    kandidat: [],
    produk: [],
    tarifPpn: null,
    error: null,
  };

  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { ...kosong, error: context.message };
  if (peran === null || !PERAN_BACA.includes(peran)) {
    return { ...kosong, error: "Peran Anda tidak memiliki akses ke invoice pemasok." };
  }

  const client = context.data.supabase;
  const [daftar, kandidat, produk, tarif] = await Promise.all([
    listInvoicePemasok(client),
    listPenerimaanSiapInvoice(client),
    listProduk(client, { aktif: true }),
    getTarifPpn(client, hariIniJakarta()),
  ]);

  let terpilih: InvoicePemasokDetail | null = null;
  let error: string | null = daftar.ok ? (kandidat.ok ? produk.error : kandidat.message) : daftar.message;

  if (options.invoiceId) {
    const detail = await getInvoicePemasok(client, options.invoiceId);
    if (!detail.ok) error = detail.message;
    else terpilih = detail.data;
  }

  return {
    daftar: daftar.ok ? daftar.data : [],
    terpilih,
    kandidat: kandidat.ok ? kandidat.data : [],
    produk: produk.data,
    tarifPpn: tarif.ok ? tarif.data : null,
    error,
  };
}

export type { PenerimaanSiapInvoice };
