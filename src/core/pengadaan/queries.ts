import type { SupabaseClient } from "@supabase/supabase-js";

import { listRiwayatStatus, type RiwayatStatus } from "@/core/dokumen";
import { fail, ok, type Result } from "@/lib/result";
import type {
  PemilihanPemasokView,
  PermintaanPembelian,
  PermintaanPembelianItem,
  PermintaanPembelianView,
  PurchaseOrderDetail,
  PurchaseOrderView,
  RiwayatHarga,
} from "./types";

type Row = Record<string, unknown>;

function asString(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

async function ambilDokumen(
  client: SupabaseClient,
  ids: string[],
): Promise<Map<string, Row>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await client
    .from("dokumen")
    .select("id,nomor,status,versi,nominal::text,pembuat_id,created_at,updated_at")
    .in("id", ids);
  if (error) throw new Error(error.message);
  return new Map(((data ?? []) as unknown as Row[]).map((row) => [asString(row.id), row]));
}

async function ambilPemohon(
  client: SupabaseClient,
  ids: string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await client
    .from("profiles")
    .select("id,display_name")
    .in("id", ids);
  if (error) throw new Error(error.message);
  return new Map(
    ((data ?? []) as unknown as Row[]).map((row) => [
      asString(row.id),
      asString(row.display_name) || "Pengguna",
    ]),
  );
}

function mapView(row: Row, dokumen: Row, pemohonNama: string): PermintaanPembelianView {
  return {
    dokumenId: asString(row.dokumen_id),
    nomor: asString(dokumen.nomor),
    status: asString(dokumen.status) as PermintaanPembelianView["status"],
    versi: asNumber(dokumen.versi),
    nominal: dokumen.nominal === null ? null : asString(dokumen.nominal),
    pemohonId: asString(dokumen.pembuat_id),
    pemohonNama,
    gudangId: asString(row.gudang_id),
    woId: row.wo_id === null ? null : asString(row.wo_id),
    keterangan: row.keterangan === null ? null : asString(row.keterangan),
    tanggalButuh: asString(row.tanggal_butuh),
    createdAt: asString(dokumen.created_at),
    updatedAt: asString(dokumen.updated_at),
  };
}

export async function listPermintaanPembelian(
  client: SupabaseClient,
  options: { pemohonId?: string; statuses?: readonly string[] } = {},
): Promise<Result<PermintaanPembelianView[]>> {
  const { data, error } = await client
    .from("permintaan_pembelian")
    .select("dokumen_id,wo_id,gudang_id,keterangan,tanggal_butuh,updated_at")
    .order("updated_at", { ascending: false });

  if (error) return fail(error.message);

  const rows = (data ?? []) as unknown as Row[];
  try {
    const docs = await ambilDokumen(client, rows.map((row) => asString(row.dokumen_id)));
    const pemohon = await ambilPemohon(
      client,
      [...docs.values()].map((doc) => asString(doc.pembuat_id)),
    );
    const views = rows
      .map((row) => {
        const doc = docs.get(asString(row.dokumen_id));
        return doc
          ? mapView(row, doc, pemohon.get(asString(doc.pembuat_id)) ?? "Pengguna")
          : null;
      })
      .filter((view): view is PermintaanPembelianView => view !== null)
      .filter((view) => !options.pemohonId || view.pemohonId === options.pemohonId)
      .filter((view) => !options.statuses || options.statuses.includes(view.status));
    return ok(views);
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Gagal membaca dokumen.");
  }
}

export async function getPermintaanPembelian(
  client: SupabaseClient,
  dokumenId: string,
): Promise<
  Result<
    | {
        header: PermintaanPembelianView;
        detail: PermintaanPembelianItem[];
        riwayat: RiwayatStatus[];
      }
    | null
  >
> {
  const { data, error } = await client
    .from("permintaan_pembelian")
    .select("dokumen_id,wo_id,gudang_id,keterangan,tanggal_butuh,updated_at")
    .eq("dokumen_id", dokumenId)
    .maybeSingle();

  if (error) return fail(error.message);
  if (!data) return ok(null);

  const row = data as unknown as Row;
  const { data: dok, error: dokError } = await client
    .from("dokumen")
    .select("id,nomor,status,versi,nominal::text,pembuat_id,created_at,updated_at")
    .eq("id", dokumenId)
    .single();
  if (dokError) return fail(dokError.message);

  const { data: items, error: itemError } = await client
    .from("permintaan_pembelian_item")
    .select("id,permintaan_id,produk_id,satuan_id,qty::text,urutan")
    .eq("permintaan_id", dokumenId)
    .order("urutan", { ascending: true });
  if (itemError) return fail(itemError.message);

  const riwayat = await listRiwayatStatus(client, dokumenId);
  if (!riwayat.ok) return riwayat;

  let pemohonNama = "Pengguna";
  try {
    const pemohon = await ambilPemohon(client, [asString((dok as unknown as Row).pembuat_id)]);
    pemohonNama = pemohon.get(asString((dok as unknown as Row).pembuat_id)) ?? "Pengguna";
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Gagal membaca pemohon.");
  }

  return ok({
    header: mapView(row, dok as unknown as Row, pemohonNama),
    detail: ((items ?? []) as unknown as Row[]).map((item) => ({
      id: asString(item.id),
      permintaan_id: asString(item.permintaan_id),
      produk_id: asString(item.produk_id),
      satuan_id: asString(item.satuan_id),
      qty: asString(item.qty),
      urutan: asNumber(item.urutan),
    })),
    riwayat: riwayat.data,
  });
}

export type { PermintaanPembelian };

/**
 * Penawaran prices live per item and supplier. A supplier can only be chosen
 * once it quotes every item of the request, so this read returns raw rows and
 * the display layer aggregates them.
 */
export async function getPemilihanPemasok(
  client: SupabaseClient,
  dokumenId: string,
): Promise<Result<PemilihanPemasokView | null>> {
  const detail = await getPermintaanPembelian(client, dokumenId);
  if (!detail.ok) return detail;
  if (!detail.data) return ok(null);

  const { data: pr, error: prError } = await client
    .from("permintaan_pembelian")
    .select("pemasok_id,alasan_pemilihan")
    .eq("dokumen_id", dokumenId)
    .single();
  if (prError) return fail(prError.message);

  const { data: penawaran, error: penawaranError } = await client
    .from("penawaran_harga")
    .select("id,permintaan_id,item_id,pemasok_id,harga::text,tanggal,created_at")
    .eq("permintaan_id", dokumenId)
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false });
  if (penawaranError) return fail(penawaranError.message);

  const header = pr as unknown as Row;
  const pemasokTerpilihId =
    header.pemasok_id === null ? null : asString(header.pemasok_id);
  const namaPemasok = pemasokTerpilihId
    ? await ambilPemasokNama(client, [pemasokTerpilihId])
    : new Map<string, string>();

  return ok({
    header: detail.data.header,
    items: detail.data.detail,
    penawaran: ((penawaran ?? []) as unknown as Row[]).map((row) => ({
      id: asString(row.id),
      permintaanId: asString(row.permintaan_id),
      itemId: asString(row.item_id),
      pemasokId: asString(row.pemasok_id),
      harga: asString(row.harga),
      tanggal: asString(row.tanggal),
      createdAt: asString(row.created_at),
    })),
    pemasokTerpilihId,
    pemasokTerpilihNama:
      pemasokTerpilihId === null
        ? null
        : (namaPemasok.get(pemasokTerpilihId) ?? pemasokTerpilihId),
    alasanPemilihan: header.alasan_pemilihan === null ? null : asString(header.alasan_pemilihan),
    riwayat: detail.data.riwayat,
  });
}

/**
 * Price history per product across every request, so Purchasing can see what a
 * supplier quoted before on the same product (PG-004 AC-06).
 */
export async function listRiwayatHarga(
  client: SupabaseClient,
  produkIds: readonly string[],
): Promise<Result<RiwayatHarga[]>> {
  if (produkIds.length === 0) return ok([]);

  const { data: items, error: itemError } = await client
    .from("permintaan_pembelian_item")
    .select("id,produk_id")
    .in("produk_id", [...produkIds]);
  if (itemError) return fail(itemError.message);

  const itemRows = (items ?? []) as unknown as Row[];
  if (itemRows.length === 0) return ok([]);

  const produkByItem = new Map(
    itemRows.map((row) => [asString(row.id), asString(row.produk_id)]),
  );

  const { data: harga, error: hargaError } = await client
    .from("penawaran_harga")
    .select("id,item_id,pemasok_id,harga::text,tanggal")
    .in("item_id", [...produkByItem.keys()])
    .order("tanggal", { ascending: false })
    .limit(200);
  if (hargaError) return fail(hargaError.message);

  const hargaRows = (harga ?? []) as unknown as Row[];
  const { data: pemasok, error: pemasokError } = await client
    .from("pemasok")
    .select("id,nama")
    .in("id", [...new Set(hargaRows.map((row) => asString(row.pemasok_id)))]);
  if (pemasokError) return fail(pemasokError.message);

  const namaPemasok = new Map(
    ((pemasok ?? []) as unknown as Row[]).map((row) => [
      asString(row.id),
      asString(row.nama),
    ]),
  );

  return ok(
    hargaRows.map((row) => ({
      id: asString(row.id),
      produkId: produkByItem.get(asString(row.item_id)) ?? "",
      pemasokId: asString(row.pemasok_id),
      pemasokNama: namaPemasok.get(asString(row.pemasok_id)) ?? "Pemasok",
      harga: asString(row.harga),
      tanggal: asString(row.tanggal),
    })),
  );
}

export async function listPurchaseOrder(
  client: SupabaseClient,
): Promise<Result<PurchaseOrderView[]>> {
  const { data, error } = await client
    .from("po")
    .select("dokumen_id,permintaan_id,pemasok_id,tanggal,catatan_konfirmasi")
    .order("tanggal", { ascending: false });
  if (error) return fail(error.message);

  const rows = (data ?? []) as unknown as Row[];
  if (rows.length === 0) return ok([]);

  try {
    const docs = await ambilDokumen(
      client,
      rows.map((row) => asString(row.dokumen_id)),
    );
    const prDocs = await ambilDokumen(
      client,
      rows.map((row) => asString(row.permintaan_id)),
    );
    const pemasok = await ambilPemasokNama(
      client,
      rows.map((row) => asString(row.pemasok_id)),
    );

    return ok(
      rows
        .map((row) => {
          const doc = docs.get(asString(row.dokumen_id));
          if (!doc) return null;
          return mapPurchaseOrder(
            row,
            doc,
            prDocs.get(asString(row.permintaan_id)) ?? null,
            pemasok.get(asString(row.pemasok_id)) ?? "Pemasok",
          );
        })
        .filter((view): view is PurchaseOrderView => view !== null),
    );
  } catch (error) {
    return fail(error instanceof Error ? error.message : "Gagal membaca purchase order.");
  }
}

export async function getPurchaseOrder(
  client: SupabaseClient,
  dokumenId: string,
): Promise<Result<PurchaseOrderDetail | null>> {
  const { data, error } = await client
    .from("po")
    .select("dokumen_id,permintaan_id,pemasok_id,tanggal,catatan_konfirmasi")
    .eq("dokumen_id", dokumenId)
    .maybeSingle();
  if (error) return fail(error.message);
  if (!data) return ok(null);

  const row = data as unknown as Row;
  const docs = await ambilDokumen(client, [dokumenId, asString(row.permintaan_id)]);
  const doc = docs.get(dokumenId);
  if (!doc) return fail("Dokumen purchase order tidak ditemukan.");

  const pemasok = await ambilPemasokNama(client, [asString(row.pemasok_id)]);

  const { data: items, error: itemError } = await client
    .from("po_item")
    .select("id,po_id,produk_id,qty::text,harga_satuan::text,ppn_persen::text,urutan")
    .eq("po_id", dokumenId)
    .order("urutan", { ascending: true });
  if (itemError) return fail(itemError.message);

  const riwayat = await listRiwayatStatus(client, dokumenId);
  if (!riwayat.ok) return riwayat;

  return ok({
    header: mapPurchaseOrder(
      row,
      doc,
      docs.get(asString(row.permintaan_id)) ?? null,
      pemasok.get(asString(row.pemasok_id)) ?? "Pemasok",
    ),
    items: ((items ?? []) as unknown as Row[]).map((item) => ({
      id: asString(item.id),
      po_id: asString(item.po_id),
      produk_id: asString(item.produk_id),
      qty: asString(item.qty),
      harga_satuan: asString(item.harga_satuan),
      ppn_persen: asString(item.ppn_persen),
      urutan: asNumber(item.urutan),
    })),
    riwayat: riwayat.data,
  });
}

export async function getTarifPpn(
  client: SupabaseClient,
  tanggal: string,
): Promise<Result<string | null>> {
  const { data, error } = await client.rpc("tarif_ppn_untuk", {
    p_tanggal: tanggal,
  });
  if (error) return fail(error.message);
  return ok(data === null || data === undefined ? null : asString(data));
}

function mapPurchaseOrder(
  row: Row,
  dokumen: Row,
  permintaan: Row | null,
  pemasokNama: string,
): PurchaseOrderView {
  return {
    dokumenId: asString(row.dokumen_id),
    nomor: asString(dokumen.nomor),
    status: asString(dokumen.status) as PurchaseOrderView["status"],
    versi: asNumber(dokumen.versi),
    tanggal: asString(row.tanggal),
    pemasokId: asString(row.pemasok_id),
    pemasokNama,
    permintaanId: asString(row.permintaan_id),
    permintaanNomor: permintaan === null ? null : asString(permintaan.nomor),
    nominal: dokumen.nominal === null ? null : asString(dokumen.nominal),
    catatanKonfirmasi:
      row.catatan_konfirmasi === null ? null : asString(row.catatan_konfirmasi),
    createdAt: asString(dokumen.created_at),
  };
}

async function ambilPemasokNama(
  client: SupabaseClient,
  ids: string[],
): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const { data, error } = await client
    .from("pemasok")
    .select("id,nama")
    .in("id", [...new Set(ids)]);
  if (error) throw new Error(error.message);
  return new Map(
    ((data ?? []) as unknown as Row[]).map((row) => [
      asString(row.id),
      asString(row.nama),
    ]),
  );
}
