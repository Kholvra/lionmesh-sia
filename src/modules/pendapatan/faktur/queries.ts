import { listRiwayatStatus } from "@/core/dokumen";
import { createAdminClient } from "@/lib/supabase/admin";
import { hitungUmurDanBucket } from "./calc";
import { AGING_BUCKETS, type AgingBucketDef } from "./constants";
import { isValidUuid } from "./schema";
import type {
  FakturDetail,
  FakturItemRow,
  FakturRingkas,
  PengirimanSiapFakturItemRef,
  PengirimanSiapFakturRef,
  PiutangAgingRow,
  PiutangSummaryData,
} from "./types";

type Row = Record<string, unknown>;

export async function getTarifPpnUntukTanggal(
  supabase: ReturnType<typeof createAdminClient>,
  tanggal: string,
): Promise<number | null> {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("konfigurasi_pajak")
    .select("tarif::text")
    .eq("kode", "PPN")
    .eq("aktif", true)
    .lte("berlaku_mulai", tanggal)
    .order("berlaku_mulai", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data || data.tarif === null || data.tarif === undefined) {
    return null;
  }

  const tarif = Number(data.tarif);
  return Number.isNaN(tarif) ? null : tarif;
}

export async function listFaktur(
  cari?: string,
  statusFilter?: string,
): Promise<FakturRingkas[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let query = supabase
    .from("faktur")
    .select(
      `
      id, dokumen_id, nomor, pengiriman_id, pesanan_id, pelanggan_id,
      tanggal_faktur, termin_hari, jatuh_tempo, nomor_faktur_pajak,
      dpp::text, tarif_ppn::text, ppn::text, total::text, sisa_piutang::text,
      status, created_at,
      pengiriman:pengiriman_id (nomor),
      pesanan:pesanan_id (nomor),
      pelanggan:pelanggan_id (kode_pelanggan, nama)
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

  const mapped: FakturRingkas[] = (data as unknown as Row[]).map((r) => {
    const sj = r.pengiriman as Row | null;
    const so = r.pesanan as Row | null;
    const pel = r.pelanggan as Row | null;
    return {
      id: String(r.id),
      dokumenId: r.dokumen_id ? String(r.dokumen_id) : null,
      nomor: String(r.nomor),
      pengirimanId: String(r.pengiriman_id),
      pengirimanNomor: sj ? String(sj.nomor ?? "-") : "-",
      pesananId: String(r.pesanan_id),
      pesananNomor: so ? String(so.nomor ?? "-") : "-",
      pelangganId: String(r.pelanggan_id),
      pelangganKode: pel ? String(pel.kode_pelanggan ?? "-") : "-",
      pelangganNama: pel ? String(pel.nama ?? "-") : "-",
      tanggalFaktur: String(r.tanggal_faktur),
      terminHari: Number(r.termin_hari ?? 30),
      jatuhTempo: String(r.jatuh_tempo),
      nomorFakturPajak: r.nomor_faktur_pajak
        ? String(r.nomor_faktur_pajak)
        : null,
      dpp: Number(r.dpp ?? 0),
      tarifPpn: Number(r.tarif_ppn ?? 0.11),
      ppn: Number(r.ppn ?? 0),
      total: Number(r.total ?? 0),
      sisaPiutang: Number(r.sisa_piutang ?? 0),
      status: String(r.status),
      createdAt: String(r.created_at),
    };
  });

  if (!term) return mapped;
  return mapped.filter(
    (f) =>
      f.nomor.toLowerCase().includes(term) ||
      f.pengirimanNomor.toLowerCase().includes(term) ||
      f.pelangganNama.toLowerCase().includes(term) ||
      (f.nomorFakturPajak ?? "").toLowerCase().includes(term),
  );
}

export async function getFakturDetail(
  idOrNomor: string,
): Promise<FakturDetail | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const isUuid = isValidUuid(idOrNomor);
  const { data: header, error } = await supabase
    .from("faktur")
    .select(
      `
      id, dokumen_id, nomor, pengiriman_id, pesanan_id, pelanggan_id,
      tanggal_faktur, termin_hari, jatuh_tempo, nomor_faktur_pajak,
      dpp::text, tarif_ppn::text, ppn::text, total::text, sisa_piutang::text,
      status, jurnal_id, jurnal_pembalik_id, alasan_batal, created_at,
      pengiriman:pengiriman_id (nomor),
      pesanan:pesanan_id (nomor),
      pelanggan:pelanggan_id (kode_pelanggan, nama)
    `,
    )
    .eq(isUuid ? "id" : "nomor", idOrNomor)
    .maybeSingle();

  if (error || !header) return null;

  const h = header as unknown as Row;
  const sj = h.pengiriman as Row | null;
  const so = h.pesanan as Row | null;
  const pel = h.pelanggan as Row | null;

  const { data: itemRows } = await supabase
    .from("faktur_item")
    .select(
      `
      id, faktur_id, pengiriman_item_id, pesanan_item_id, produk_id,
      qty::text, harga_satuan::text, diskon_persen::text,
      nilai_kotor::text, nilai_diskon::text, dpp::text, ppn::text, total::text,
      produk:produk_id (kode, nama, satuan:satuan_dasar_id (kode))
    `,
    )
    .eq("faktur_id", String(h.id));

  const items: FakturItemRow[] = ((itemRows ?? []) as unknown as Row[]).map(
    (it) => {
      const prod = it.produk as Row | null;
      const sat = prod?.satuan as Row | null;
      return {
        id: String(it.id),
        fakturId: String(it.faktur_id),
        pengirimanItemId: String(it.pengiriman_item_id),
        pesananItemId: String(it.pesanan_item_id),
        produkId: String(it.produk_id),
        produkKode: prod ? String(prod.kode ?? "-") : "-",
        produkNama: prod ? String(prod.nama ?? "-") : "-",
        satuanKode: sat ? String(sat.kode ?? "unit") : "unit",
        qty: Number(it.qty ?? 0),
        hargaSatuan: Number(it.harga_satuan ?? 0),
        diskonPersen: Number(it.diskon_persen ?? 0),
        nilaiKotor: Number(it.nilai_kotor ?? 0),
        nilaiDiskon: Number(it.nilai_diskon ?? 0),
        dpp: Number(it.dpp ?? 0),
        ppn: Number(it.ppn ?? 0),
        total: Number(it.total ?? 0),
      };
    },
  );

  let riwayat: FakturDetail["riwayat"] = [];
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
    pengirimanId: String(h.pengiriman_id),
    pengirimanNomor: sj ? String(sj.nomor ?? "-") : "-",
    pesananId: String(h.pesanan_id),
    pesananNomor: so ? String(so.nomor ?? "-") : "-",
    pelangganId: String(h.pelanggan_id),
    pelangganKode: pel ? String(pel.kode_pelanggan ?? "-") : "-",
    pelangganNama: pel ? String(pel.nama ?? "-") : "-",
    tanggalFaktur: String(h.tanggal_faktur),
    terminHari: Number(h.termin_hari ?? 30),
    jatuhTempo: String(h.jatuh_tempo),
    nomorFakturPajak: h.nomor_faktur_pajak
      ? String(h.nomor_faktur_pajak)
      : null,
    dpp: Number(h.dpp ?? 0),
    tarifPpn: Number(h.tarif_ppn ?? 0.11),
    ppn: Number(h.ppn ?? 0),
    total: Number(h.total ?? 0),
    sisaPiutang: Number(h.sisa_piutang ?? 0),
    status: String(h.status),
    jurnalId: h.jurnal_id ? String(h.jurnal_id) : null,
    jurnalPembalikId: h.jurnal_pembalik_id
      ? String(h.jurnal_pembalik_id)
      : null,
    alasanBatal: h.alasan_batal ? String(h.alasan_batal) : null,
    createdAt: String(h.created_at),
    items,
    riwayat,
  };
}

export async function listPengirimanSiapFaktur(): Promise<
  PengirimanSiapFakturRef[]
> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const [{ data: sjRows }, { data: activeFakturRows }] = await Promise.all([
    supabase
      .from("pengiriman")
      .select(
        `
        id, nomor, pesanan_id, tanggal_pengiriman, status,
        pesanan:pesanan_id (
          id, nomor, termin_hari, pelanggan_id,
          pelanggan:pelanggan_id (kode_pelanggan, nama)
        ),
        pengiriman_item (
          id, pesanan_item_id, produk_id, qty::text,
          produk:produk_id (kode, nama, satuan:satuan_dasar_id (kode)),
          pesanan_item:pesanan_item_id (harga_satuan::text, diskon_persen::text)
        )
      `,
      )
      .in("status", ["DIKIRIM", "DITERIMA"])
      .order("tanggal_pengiriman", { ascending: false }),
    supabase
      .from("faktur")
      .select("pengiriman_id")
      .neq("status", "DIBATALKAN"),
  ]);

  const invoicedSet = new Set(
    (activeFakturRows ?? []).map((f) => String(f.pengiriman_id)),
  );

  const results: PengirimanSiapFakturRef[] = [];

  for (const sj of (sjRows ?? []) as unknown as Row[]) {
    const sjId = String(sj.id);
    if (invoicedSet.has(sjId)) continue;

    const pes = sj.pesanan as Row | null;
    const pel = pes?.pelanggan as Row | null;
    const rawItems = (sj.pengiriman_item ?? []) as unknown as Row[];

    const items: PengirimanSiapFakturItemRef[] = rawItems.map((it) => {
      const prod = it.produk as Row | null;
      const sat = prod?.satuan as Row | null;
      const pi = it.pesanan_item as Row | null;
      return {
        pengirimanItemId: String(it.id),
        pesananItemId: String(it.pesanan_item_id),
        produkId: String(it.produk_id),
        produkKode: prod ? String(prod.kode ?? "-") : "-",
        produkNama: prod ? String(prod.nama ?? "-") : "-",
        satuanKode: sat ? String(sat.kode ?? "unit") : "unit",
        qty: Number(it.qty ?? 0),
        hargaSatuan: pi ? Number(pi.harga_satuan ?? 0) : 0,
        diskonPersen: pi ? Number(pi.diskon_persen ?? 0) : 0,
      };
    });

    if (items.length > 0 && pes) {
      results.push({
        id: sjId,
        nomor: String(sj.nomor),
        pesananId: String(pes.id),
        pesananNomor: String(pes.nomor ?? "-"),
        pelangganId: String(pes.pelanggan_id),
        pelangganKode: pel ? String(pel.kode_pelanggan ?? "-") : "-",
        pelangganNama: pel ? String(pel.nama ?? "-") : "-",
        terminHari: Number(pes.termin_hari ?? 30),
        tanggalPengiriman: String(sj.tanggal_pengiriman),
        items,
      });
    }
  }

  return results;
}

export async function getDaftarPiutang(
  tanggalLaporan: string,
  pelangganFilter?: string,
): Promise<PiutangSummaryData> {
  const totalsByBucket: Record<AgingBucketDef["key"], number> = {
    belum_jatuh_tempo: 0,
    "1_30": 0,
    "31_60": 0,
    "61_90": 0,
    lebih_90: 0,
  };

  const supabase = createAdminClient();
  if (!supabase) {
    return {
      tanggalLaporan,
      totalPiutang: 0,
      totalsByBucket,
      rows: [],
    };
  }

  const { data } = await supabase
    .from("faktur")
    .select(
      `
      id, nomor, pelanggan_id, tanggal_faktur, jatuh_tempo,
      total::text, sisa_piutang::text, status,
      pelanggan:pelanggan_id (kode_pelanggan, nama)
    `,
    )
    .in("status", ["DITERBITKAN", "SEBAGIAN_LUNAS"])
    .order("jatuh_tempo", { ascending: true });

  const term = pelangganFilter?.trim().toLowerCase() ?? "";
  let totalPiutang = 0;
  const rows: PiutangAgingRow[] = [];

  for (const r of (data ?? []) as unknown as Row[]) {
    const pel = r.pelanggan as Row | null;
    const pelNama = pel ? String(pel.nama ?? "-") : "-";
    const pelKode = pel ? String(pel.kode_pelanggan ?? "-") : "-";

    if (
      term &&
      !pelNama.toLowerCase().includes(term) &&
      !String(r.nomor).toLowerCase().includes(term)
    ) {
      continue;
    }

    const sisa = Number(r.sisa_piutang ?? 0);
    const { umurHari, bucket } = hitungUmurDanBucket(
      String(r.jatuh_tempo),
      tanggalLaporan,
      AGING_BUCKETS,
    );

    totalPiutang += sisa;
    totalsByBucket[bucket.key] += sisa;

    rows.push({
      id: String(r.id),
      nomor: String(r.nomor),
      pelangganId: String(r.pelanggan_id),
      pelangganKode: pelKode,
      pelangganNama: pelNama,
      tanggalFaktur: String(r.tanggal_faktur),
      jatuhTempo: String(r.jatuh_tempo),
      total: Number(r.total ?? 0),
      sisaPiutang: sisa,
      status: String(r.status),
      umurHari,
      bucketKey: bucket.key,
      bucketLabel: bucket.label,
    });
  }

  return {
    tanggalLaporan,
    totalPiutang,
    totalsByBucket,
    rows,
  };
}
