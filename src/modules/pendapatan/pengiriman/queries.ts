import { listRiwayatStatus } from "@/core/dokumen";
import { listAlokasiPesanan, listGudangAktif } from "@/core/inventory";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidUuid } from "./schema";
import type {
  PengirimanDetail,
  PengirimanItemRow,
  PengirimanRingkas,
  PesananSiapKirimItemRef,
  PesananSiapKirimRef,
} from "./types";

type Row = Record<string, unknown>;

export async function listPengiriman(
  cari?: string,
  statusFilter?: string,
): Promise<PengirimanRingkas[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let query = supabase
    .from("pengiriman")
    .select(
      `
      id, dokumen_id, nomor, pesanan_id, tanggal_pengiriman, status,
      keterangan, tanggal_terima, nama_penerima, created_by, created_at,
      pesanan:pesanan_id (
        nomor,
        pelanggan:pelanggan_id (kode_pelanggan, nama)
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(100);

  if (statusFilter && statusFilter !== "SEMUA") {
    query = query.eq("status", statusFilter);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const term = cari?.trim().toLowerCase() ?? "";

  const mapped: PengirimanRingkas[] = (data as unknown as Row[]).map((r) => {
    const pes = r.pesanan as Row | null;
    const pel = pes?.pelanggan as Row | null;
    return {
      id: String(r.id),
      dokumenId: r.dokumen_id ? String(r.dokumen_id) : null,
      nomor: String(r.nomor),
      pesananId: String(r.pesanan_id),
      pesananNomor: pes ? String(pes.nomor ?? "-") : "-",
      pelangganKode: pel ? String(pel.kode_pelanggan ?? "-") : "-",
      pelangganNama: pel ? String(pel.nama ?? "-") : "-",
      tanggalPengiriman: String(r.tanggal_pengiriman),
      status: String(r.status),
      keterangan: r.keterangan ? String(r.keterangan) : null,
      tanggalTerima: r.tanggal_terima ? String(r.tanggal_terima) : null,
      namaPenerima: r.nama_penerima ? String(r.nama_penerima) : null,
      createdBy: r.created_by ? String(r.created_by) : null,
      createdAt: String(r.created_at),
    };
  });

  if (!term) return mapped;
  return mapped.filter(
    (p) =>
      p.nomor.toLowerCase().includes(term) ||
      p.pesananNomor.toLowerCase().includes(term) ||
      p.pelangganNama.toLowerCase().includes(term),
  );
}

export async function getPengirimanDetail(
  idOrNomor: string,
): Promise<PengirimanDetail | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const isUuid = isValidUuid(idOrNomor);
  const { data: header, error } = await supabase
    .from("pengiriman")
    .select(
      `
      id, dokumen_id, nomor, pesanan_id, tanggal_pengiriman, status,
      keterangan, tanggal_terima, nama_penerima, alasan_batal,
      created_by, created_at,
      pesanan:pesanan_id (
        nomor, status, created_by,
        pelanggan:pelanggan_id (kode_pelanggan, nama)
      )
    `,
    )
    .eq(isUuid ? "id" : "nomor", idOrNomor)
    .maybeSingle();

  if (error || !header) return null;

  const h = header as unknown as Row;
  const pes = h.pesanan as Row | null;
  const pel = pes?.pelanggan as Row | null;

  const { data: itemRows } = await supabase
    .from("pengiriman_item")
    .select(
      `
      id, pengiriman_id, pesanan_item_id, produk_id, gudang_id, qty::text,
      produk:produk_id (kode, nama, satuan:satuan_dasar_id (kode)),
      gudang:gudang_id (kode, nama)
    `,
    )
    .eq("pengiriman_id", String(h.id));

  const items: PengirimanItemRow[] = ((itemRows ?? []) as unknown as Row[]).map(
    (it) => {
      const prod = it.produk as Row | null;
      const sat = prod?.satuan as Row | null;
      const gud = it.gudang as Row | null;
      return {
        id: String(it.id),
        pengirimanId: String(it.pengiriman_id),
        pesananItemId: String(it.pesanan_item_id),
        produkId: String(it.produk_id),
        produkKode: prod ? String(prod.kode ?? "-") : "-",
        produkNama: prod ? String(prod.nama ?? "-") : "-",
        satuanKode: sat ? String(sat.kode ?? "unit") : "unit",
        gudangId: String(it.gudang_id),
        gudangKode: gud ? String(gud.kode ?? "-") : "-",
        gudangNama: gud ? String(gud.nama ?? "-") : "-",
        qty: Number(it.qty ?? 0),
      };
    },
  );

  let riwayat: PengirimanDetail["riwayat"] = [];
  if (h.dokumen_id) {
    const rRes = await listRiwayatStatus(supabase, String(h.dokumen_id));
    if (rRes.ok) {
      riwayat = [...rRes.data].reverse();
    }
  }

  return {
    id: String(h.id),
    dokumenId: h.dokumen_id ? String(h.dokumen_id) : null,
    nomor: String(h.nomor),
    pesananId: String(h.pesanan_id),
    pesananNomor: pes ? String(pes.nomor ?? "-") : "-",
    pesananStatus: pes ? String(pes.status ?? "-") : "-",
    pesananCreatedBy: pes ? String(pes.created_by ?? "") : "",
    pelangganKode: pel ? String(pel.kode_pelanggan ?? "-") : "-",
    pelangganNama: pel ? String(pel.nama ?? "-") : "-",
    tanggalPengiriman: String(h.tanggal_pengiriman),
    status: String(h.status),
    keterangan: h.keterangan ? String(h.keterangan) : null,
    tanggalTerima: h.tanggal_terima ? String(h.tanggal_terima) : null,
    namaPenerima: h.nama_penerima ? String(h.nama_penerima) : null,
    alasanBatal: h.alasan_batal ? String(h.alasan_batal) : null,
    createdBy: h.created_by ? String(h.created_by) : null,
    createdAt: String(h.created_at),
    items,
    riwayat,
  };
}

export async function listPesananSiapKirim(): Promise<PesananSiapKirimRef[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data: pesananRows, error } = await supabase
    .from("pesanan")
    .select(
      `
      id, nomor, tanggal, status,
      pelanggan:pelanggan_id (kode_pelanggan, nama),
      pesanan_item (
        id, produk_id, qty::text,
        produk:produk_id (kode, nama, satuan:satuan_dasar_id (kode))
      )
    `,
    )
    .in("status", ["SIAP_KIRIM", "TERKIRIM_SEBAGIAN"])
    .order("created_at", { ascending: false });

  if (error || !pesananRows) return [];

  const gudangRes = await listGudangAktif(supabase);
  const gudangMap = new Map<string, { kode: string; nama: string }>();
  if (gudangRes.ok) {
    for (const g of gudangRes.data) {
      gudangMap.set(g.id, { kode: g.kode, nama: g.nama });
    }
  }

  const results: PesananSiapKirimRef[] = [];

  for (const p of pesananRows as unknown as Row[]) {
    const pesananId = String(p.id);
    const pel = p.pelanggan as Row | null;
    const rawItems = (p.pesanan_item ?? []) as unknown as Row[];

    const allocRes = await listAlokasiPesanan(supabase, pesananId);
    const allocList = allocRes.ok ? allocRes.data : [];

    // Hitung qty sudah dikirim pada pengiriman yang berstatus DIKIRIM / DITERIMA
    const { data: shippedRows } = await supabase
      .from("pengiriman_item")
      .select("pesanan_item_id, qty::text, pengiriman:pengiriman_id!inner(status)")
      .eq("pengiriman.pesanan_id", pesananId)
      .in("pengiriman.status", ["DIKIRIM", "DITERIMA"]);

    const shippedPerItem = new Map<string, number>();
    for (const sr of (shippedRows ?? []) as unknown as Row[]) {
      const k = String(sr.pesanan_item_id);
      shippedPerItem.set(k, (shippedPerItem.get(k) ?? 0) + Number(sr.qty ?? 0));
    }

    const items: PesananSiapKirimItemRef[] = [];

    for (const it of rawItems) {
      const pesananItemId = String(it.id);
      const prod = it.produk as Row | null;
      const sat = prod?.satuan as Row | null;
      const qtyPesanan = Number(it.qty ?? 0);
      const qtyTerkirimSebelumnya = shippedPerItem.get(pesananItemId) ?? 0;

      // Kelompokkan alokasi aktif per gudang
      const allocPerGudang = new Map<string, number>();
      for (const a of allocList) {
        if (a.pesanan_item_id === pesananItemId && a.status === "teralokasi") {
          allocPerGudang.set(
            a.gudang_id,
            (allocPerGudang.get(a.gudang_id) ?? 0) + Number(a.qty),
          );
        }
      }

      for (const [gudangId, qtyAlokasiAktif] of allocPerGudang.entries()) {
        if (qtyAlokasiAktif <= 0) continue;
        const gInfo = gudangMap.get(gudangId);
        items.push({
          pesananItemId,
          produkId: String(it.produk_id),
          produkKode: prod ? String(prod.kode ?? "-") : "-",
          produkNama: prod ? String(prod.nama ?? "-") : "-",
          satuanKode: sat ? String(sat.kode ?? "unit") : "unit",
          gudangId,
          gudangKode: gInfo?.kode ?? "-",
          gudangNama: gInfo?.nama ?? "-",
          qtyPesanan,
          qtyTerkirimSebelumnya,
          qtyAlokasiAktif,
        });
      }
    }

    if (items.length > 0) {
      results.push({
        id: pesananId,
        nomor: String(p.nomor),
        tanggal: String(p.tanggal),
        status: String(p.status),
        pelangganKode: pel ? String(pel.kode_pelanggan ?? "-") : "-",
        pelangganNama: pel ? String(pel.nama ?? "-") : "-",
        items,
      });
    }
  }

  return results;
}
