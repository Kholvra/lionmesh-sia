import { listRiwayatStatus } from "@/core/dokumen";
import { createAdminClient } from "@/lib/supabase/admin";
import { hitungSisaBolehRetur } from "./calc";
import { isValidUuid } from "./schema";
import type {
  FakturItemReturRef,
  FakturReturRef,
  ReturDetail,
  ReturItemRow,
  ReturRingkas,
} from "./types";

type Row = Record<string, unknown>;

export async function listRetur(opts?: {
  status?: string;
  q?: string;
}): Promise<ReturRingkas[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let query = supabase
    .from("retur_penjualan")
    .select(
      `
      id,
      dokumen_id,
      nomor,
      faktur_id,
      pelanggan_id,
      tanggal,
      alasan,
      status,
      total_kredit_memo::text,
      created_by,
      created_at,
      faktur:faktur_id ( nomor ),
      pelanggan:pelanggan_id ( kode_pelanggan, nama )
    `,
    )
    .order("created_at", { ascending: false });

  if (opts?.status && opts.status !== "SEMUA") {
    query = query.eq("status", opts.status);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const qLower = opts?.q?.trim().toLowerCase() ?? "";

  return (data as unknown as Row[])
    .map((r) => {
      const fak = (r.faktur ?? {}) as Row;
      const pel = (r.pelanggan ?? {}) as Row;
      return {
        id: String(r.id),
        dokumenId: r.dokumen_id ? String(r.dokumen_id) : null,
        nomor: String(r.nomor),
        fakturId: String(r.faktur_id),
        fakturNomor: String(fak.nomor ?? "-"),
        pelangganId: String(r.pelanggan_id),
        pelangganKode: String(pel.kode_pelanggan ?? "-"),
        pelangganNama: String(pel.nama ?? "-"),
        tanggal: String(r.tanggal),
        alasan: String(r.alasan ?? ""),
        status: String(r.status),
        totalKreditMemo: Number(r.total_kredit_memo ?? 0),
        createdBy: r.created_by ? String(r.created_by) : null,
        createdAt: String(r.created_at),
      };
    })
    .filter((item) => {
      if (!qLower) return true;
      return (
        item.nomor.toLowerCase().includes(qLower) ||
        item.fakturNomor.toLowerCase().includes(qLower) ||
        item.pelangganNama.toLowerCase().includes(qLower) ||
        item.pelangganKode.toLowerCase().includes(qLower)
      );
    });
}

export async function getReturDetail(
  idOrNomor: string,
): Promise<ReturDetail | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const isUuid = isValidUuid(idOrNomor);
  const { data, error } = await supabase
    .from("retur_penjualan")
    .select(
      `
      id,
      dokumen_id,
      nomor,
      faktur_id,
      pelanggan_id,
      tanggal,
      alasan,
      status,
      alasan_tolak,
      qc_catatan,
      total_dpp::text,
      total_ppn::text,
      total_kredit_memo::text,
      jurnal_kredit_memo_id,
      jurnal_hpp_id,
      created_by,
      created_at,
      faktur:faktur_id ( nomor, tarif_ppn::text, sisa_piutang::text ),
      pelanggan:pelanggan_id ( kode_pelanggan, nama )
    `,
    )
    .eq(isUuid ? "id" : "nomor", idOrNomor)
    .maybeSingle();

  if (error || !data) return null;
  const r = data as unknown as Row;
  const fak = (r.faktur ?? {}) as Row;
  const pel = (r.pelanggan ?? {}) as Row;

  const { data: itemRows } = await supabase
    .from("retur_penjualan_item")
    .select(
      `
      id,
      faktur_item_id,
      produk_id,
      gudang_id,
      qty_retur::text,
      qty_lulus::text,
      harga_satuan::text,
      diskon_persen::text,
      dpp::text,
      ppn::text,
      total::text,
      nilai_masuk_stok::text,
      produk:produk_id ( kode_produk, nama, satuan:satuan_id ( kode ) ),
      gudang:gudang_id ( nama )
    `,
    )
    .eq("retur_id", String(r.id))
    .order("created_at", { ascending: true });

  const items: ReturItemRow[] = ((itemRows ?? []) as unknown as Row[]).map(
    (it) => {
      const prod = (it.produk ?? {}) as Row;
      const sat = (prod.satuan ?? {}) as Row;
      const gud = (it.gudang ?? {}) as Row;
      return {
        id: String(it.id),
        fakturItemId: String(it.faktur_item_id),
        produkId: String(it.produk_id),
        produkKode: String(prod.kode_produk ?? "-"),
        produkNama: String(prod.nama ?? "-"),
        satuanKode: String(sat.kode ?? "PCS"),
        gudangId: String(it.gudang_id),
        gudangNama: String(gud.nama ?? "-"),
        qtyRetur: Number(it.qty_retur ?? 0),
        qtyLulus: Number(it.qty_lulus ?? 0),
        hargaSatuan: Number(it.harga_satuan ?? 0),
        diskonPersen: Number(it.diskon_persen ?? 0),
        dpp: Number(it.dpp ?? 0),
        ppn: Number(it.ppn ?? 0),
        total: Number(it.total ?? 0),
        nilaiMasukStok: Number(it.nilai_masuk_stok ?? 0),
      };
    },
  );

  let riwayat: ReturDetail["riwayat"] = [];
  if (r.dokumen_id) {
    const rw = await listRiwayatStatus(supabase, String(r.dokumen_id));
    if (rw.ok) riwayat = rw.data;
  }

  return {
    id: String(r.id),
    dokumenId: r.dokumen_id ? String(r.dokumen_id) : null,
    nomor: String(r.nomor),
    fakturId: String(r.faktur_id),
    fakturNomor: String(fak.nomor ?? "-"),
    pelangganId: String(r.pelanggan_id),
    pelangganKode: String(pel.kode_pelanggan ?? "-"),
    pelangganNama: String(pel.nama ?? "-"),
    tanggal: String(r.tanggal),
    alasan: String(r.alasan ?? ""),
    status: String(r.status),
    tarifPpnFaktur: Number(fak.tarif_ppn ?? 0.11),
    sisaPiutangFaktur: Number(fak.sisa_piutang ?? 0),
    alasanTolak: r.alasan_tolak ? String(r.alasan_tolak) : null,
    qcCatatan: r.qc_catatan ? String(r.qc_catatan) : null,
    totalDpp: Number(r.total_dpp ?? 0),
    totalPpn: Number(r.total_ppn ?? 0),
    totalKreditMemo: Number(r.total_kredit_memo ?? 0),
    jurnalKreditMemoId: r.jurnal_kredit_memo_id
      ? String(r.jurnal_kredit_memo_id)
      : null,
    jurnalHppId: r.jurnal_hpp_id ? String(r.jurnal_hpp_id) : null,
    createdBy: r.created_by ? String(r.created_by) : null,
    createdAt: String(r.created_at),
    items,
    riwayat,
  };
}

export async function listFakturUntukRetur(): Promise<FakturReturRef[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data: fakturs } = await supabase
    .from("faktur")
    .select(
      `
      id,
      nomor,
      pelanggan_id,
      tanggal_faktur,
      tarif_ppn::text,
      sisa_piutang::text,
      status,
      pelanggan:pelanggan_id ( kode_pelanggan, nama )
    `,
    )
    .in("status", ["DITERBITKAN", "SEBAGIAN_LUNAS", "LUNAS"])
    .order("tanggal_faktur", { ascending: false });

  if (!fakturs || fakturs.length === 0) return [];

  const fakturIds = (fakturs as unknown as Row[]).map((f) => String(f.id));

  const [{ data: fItems }, { data: existingReturItems }] = await Promise.all([
    supabase
      .from("faktur_item")
      .select(
        `
        id,
        faktur_id,
        produk_id,
        qty::text,
        harga_satuan::text,
        diskon_persen::text,
        pengiriman_item:pengiriman_item_id ( gudang_id, gudang:gudang_id ( nama ) ),
        produk:produk_id ( kode_produk, nama, satuan:satuan_id ( kode ) )
      `,
      )
      .in("faktur_id", fakturIds),
    supabase
      .from("retur_penjualan_item")
      .select(
        `
        faktur_item_id,
        qty_retur::text,
        qty_lulus::text,
        retur:retur_id ( status )
      `,
      ),
  ]);

  // Hitung qty yang sudah diretur (SELESAI pakai qty_lulus, DIAJUKAN/DISETUJUI pakai qty_retur)
  const sudahReturMap = new Map<string, number>();
  for (const row of (existingReturItems ?? []) as unknown as Row[]) {
    const ret = (row.retur ?? {}) as Row;
    const retStatus = String(ret.status ?? "");
    if (retStatus === "DITOLAK" || retStatus === "DIBATALKAN") continue;
    const fItemId = String(row.faktur_item_id);
    const qtyPakai =
      retStatus === "SELESAI"
        ? Number(row.qty_lulus ?? 0)
        : Number(row.qty_retur ?? 0);
    sudahReturMap.set(fItemId, (sudahReturMap.get(fItemId) ?? 0) + qtyPakai);
  }

  const itemsByFaktur = new Map<string, FakturItemReturRef[]>();
  for (const row of (fItems ?? []) as unknown as Row[]) {
    const fId = String(row.faktur_id);
    const prod = (row.produk ?? {}) as Row;
    const sat = (prod.satuan ?? {}) as Row;
    const pengItem = (row.pengiriman_item ?? {}) as Row;
    const gud = (pengItem.gudang ?? {}) as Row;
    const qtyDikirim = Number(row.qty ?? 0);
    const qtySudahRetur = sudahReturMap.get(String(row.id)) ?? 0;
    const sisaBolehRetur = hitungSisaBolehRetur(qtyDikirim, qtySudahRetur);

    if (sisaBolehRetur <= 0) continue;

    const list = itemsByFaktur.get(fId) ?? [];
    list.push({
      id: String(row.id),
      produkId: String(row.produk_id),
      produkKode: String(prod.kode_produk ?? "-"),
      produkNama: String(prod.nama ?? "-"),
      satuanKode: String(sat.kode ?? "PCS"),
      gudangId: String(pengItem.gudang_id ?? ""),
      gudangNama: String(gud.nama ?? "-"),
      qtyDikirim,
      qtySudahRetur,
      sisaBolehRetur,
      hargaSatuan: Number(row.harga_satuan ?? 0),
      diskonPersen: Number(row.diskon_persen ?? 0),
    });
    itemsByFaktur.set(fId, list);
  }

  return (fakturs as unknown as Row[])
    .map((f) => {
      const pel = (f.pelanggan ?? {}) as Row;
      const items = itemsByFaktur.get(String(f.id)) ?? [];
      return {
        id: String(f.id),
        nomor: String(f.nomor),
        pelangganId: String(f.pelanggan_id),
        pelangganKode: String(pel.kode_pelanggan ?? "-"),
        pelangganNama: String(pel.nama ?? "-"),
        tanggalFaktur: String(f.tanggal_faktur),
        tarifPpn: Number(f.tarif_ppn ?? 0.11),
        sisaPiutang: Number(f.sisa_piutang ?? 0),
        status: String(f.status),
        items,
      };
    })
    .filter((f) => f.items.length > 0);
}
