import type { PenawaranHarga, PermintaanPembelianItem } from "@/core/pengadaan";

/**
 * Display aggregation for the price comparison screen. The authoritative
 * "cheapest total" rule lives in the SQL entry point
 * `tetapkan_pemasok_pr_dengan_alasan`; this module only mirrors it for display,
 * using integer cents so money never passes through a float.
 */

const SEN = BigInt(100);

function keSen(nilai: string): bigint {
  const [bulat = "0", pecahan = ""] = nilai.split(".");
  const bagianBulat = BigInt(bulat === "" ? "0" : bulat);
  const bagianPecahan = BigInt(pecahan.padEnd(2, "0").slice(0, 2));
  return bagianBulat * SEN + bagianPecahan;
}

function dariSen(sen: bigint): string {
  const bulat = sen / SEN;
  const pecahan = (sen % SEN).toString().padStart(2, "0");
  return `${bulat}.${pecahan}`;
}

export interface BarisPerbandingan {
  itemId: string;
  produkId: string;
  qty: string;
  satuanId: string;
  harga: ReadonlyMap<string, string>;
  termurah: ReadonlySet<string>;
}

export interface TotalPerbandingan {
  pemasokId: string;
  /** Null until the supplier quotes every item of the request. */
  total: string | null;
  lengkap: boolean;
  termurah: boolean;
}

export interface Perbandingan {
  pemasokIds: readonly string[];
  baris: readonly BarisPerbandingan[];
  total: readonly TotalPerbandingan[];
}

/** The newest quote per item and supplier wins; input must be newest first. */
export function hargaTerbaru(
  penawaran: readonly PenawaranHarga[],
): Map<string, PenawaranHarga> {
  const map = new Map<string, PenawaranHarga>();
  for (const row of penawaran) {
    const key = `${row.itemId}|${row.pemasokId}`;
    if (!map.has(key)) map.set(key, row);
  }
  return map;
}

export function hitungPerbandingan(
  items: readonly PermintaanPembelianItem[],
  penawaran: readonly PenawaranHarga[],
): Perbandingan {
  const terbaru = hargaTerbaru(penawaran);
  const pemasokIds = [...new Set(penawaran.map((row) => row.pemasokId))].sort();

  const baris = items.map((item) => {
    const harga = new Map<string, string>();
    for (const pemasokId of pemasokIds) {
      const row = terbaru.get(`${item.id}|${pemasokId}`);
      if (row) harga.set(pemasokId, row.harga);
    }

    const nilai = [...harga.values()].map(keSen);
    const terendah = nilai.length > 0 ? nilai.reduce((a, b) => (a < b ? a : b)) : null;
    const termurah = new Set(
      [...harga.entries()]
        .filter(([, nilaiHarga]) => terendah !== null && keSen(nilaiHarga) === terendah)
        .map(([pemasokId]) => pemasokId),
    );

    return {
      itemId: item.id,
      produkId: item.produk_id,
      qty: item.qty,
      satuanId: item.satuan_id,
      harga,
      termurah,
    };
  });

  const jumlah: { pemasokId: string; sen: bigint; lengkap: boolean }[] = pemasokIds.map(
    (pemasokId) => {
      let sen = BigInt(0);
      let terisi = 0;
      for (const row of baris) {
        const harga = row.harga.get(pemasokId);
        if (harga !== undefined) {
          sen += keSen(harga);
          terisi += 1;
        }
      }
      return { pemasokId, sen, lengkap: baris.length > 0 && terisi === baris.length };
    },
  );

  const lengkap = jumlah.filter((row) => row.lengkap);
  const terendah =
    lengkap.length > 0 ? lengkap.reduce((a, b) => (a.sen <= b.sen ? a : b)).sen : null;

  return {
    pemasokIds,
    baris,
    total: jumlah.map((row) => ({
      pemasokId: row.pemasokId,
      total: row.lengkap ? dariSen(row.sen) : null,
      lengkap: row.lengkap,
      termurah: terendah !== null && row.lengkap && row.sen === terendah,
    })),
  };
}

/** The server rejects a choice without a reason when it is not the cheapest. */
export function perluAlasan(perbandingan: Perbandingan, pemasokId: string): boolean {
  const total = perbandingan.total.find((row) => row.pemasokId === pemasokId);
  if (!total || !total.lengkap) return false;
  return !total.termurah;
}
