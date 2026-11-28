import {
  getBuktiTransferUrl,
  getPembayaranPemasok,
  getPengadaanExecutionContext,
  listPembayaranPemasok,
  listRekeningBank,
  listUtangPemasok,
  type PembayaranPemasokDetail,
  type PembayaranPemasokView,
  type RekeningBank,
  type UtangInvoiceView,
} from "@/core/pengadaan";
import type { Peran } from "@/lib/auth/types";

const PERAN_BACA: readonly Peran[] = ["Finance", "Accounting", "Manajemen"];

export interface BayarPageData {
  daftar: PembayaranPemasokView[];
  terpilih: PembayaranPemasokDetail | null;
  buktiUrl: string | null;
  utang: UtangInvoiceView[];
  rekening: RekeningBank[];
  error: string | null;
}

export function hariIniJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" }).format(
    new Date(),
  );
}

export async function getBayarPageData(
  peran: Peran | null,
  options: { bayarId?: string } = {},
): Promise<BayarPageData> {
  const kosong: BayarPageData = {
    daftar: [],
    terpilih: null,
    buktiUrl: null,
    utang: [],
    rekening: [],
    error: null,
  };

  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { ...kosong, error: context.message };
  if (peran === null || !PERAN_BACA.includes(peran)) {
    return { ...kosong, error: "Peran Anda tidak memiliki akses ke pembayaran pemasok." };
  }

  const client = context.data.supabase;
  const [daftar, utang, rekening] = await Promise.all([
    listPembayaranPemasok(client),
    listUtangPemasok(client),
    listRekeningBank(client),
  ]);

  let terpilih: PembayaranPemasokDetail | null = null;
  let buktiUrl: string | null = null;
  let error: string | null = daftar.ok
    ? (utang.ok ? null : utang.message) ?? (rekening.ok ? null : rekening.message)
    : daftar.message;

  if (options.bayarId) {
    const detail = await getPembayaranPemasok(client, options.bayarId);
    if (!detail.ok) error = detail.message;
    else terpilih = detail.data;

    const path = terpilih?.header.buktiTransferPath;
    if (path) {
      const signed = await getBuktiTransferUrl(client, path);
      if (signed.ok) buktiUrl = signed.data;
    }
  }

  return {
    daftar: daftar.ok ? daftar.data : [],
    terpilih,
    buktiUrl,
    utang: utang.ok ? utang.data : [],
    rekening: rekening.ok ? rekening.data.filter((item) => item.aktif) : [],
    error,
  };
}
