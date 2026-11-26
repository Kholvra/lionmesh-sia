import type { SupabaseClient } from "@supabase/supabase-js";

import { listRiwayatStatus, type RiwayatStatus } from "@/core/dokumen";
import { fail, ok, type Result } from "@/lib/result";
import type {
  PermintaanPembelian,
  PermintaanPembelianItem,
  PermintaanPembelianView,
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
    .select("id,nomor,status,versi,pembuat_id,created_at,updated_at")
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
    .select("id,nomor,status,versi,pembuat_id,created_at,updated_at")
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
