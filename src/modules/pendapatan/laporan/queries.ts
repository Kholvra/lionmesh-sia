import { createAdminClient } from "@/lib/supabase/admin";
import {
  AGING_BUCKETS,
  getRentangBulan,
  hitungUmurDanBucket,
  round2,
} from "./calc";
import type {
  LaporanKasResult,
  LaporanKasRow,
  LaporanPenjualanDokumenRow,
  LaporanPenjualanPelangganRow,
  LaporanPenjualanProdukRow,
  LaporanPenjualanResult,
  LaporanPiutangFakturRow,
  LaporanPiutangResult,
} from "./types";

type Row = Record<string, unknown>;

export async function getLaporanPenjualan(
  periode: string,
): Promise<LaporanPenjualanResult> {
  const supabase = createAdminClient();
  if (!supabase) {
    return {
      periode,
      totalPenjualanBukuBesar: 0,
      totalDppFaktur: 0,
      totalDppRetur: 0,
      totalPenjualanNeto: 0,
      perPelanggan: [],
      perProduk: [],
      dokumen: [],
    };
  }

  const { startDate, endDate } = getRentangBulan(periode);

  const [{ data: jurnalBaris }, { data: fakturs }, { data: returs }] =
    await Promise.all([
      supabase
        .from("jurnal_baris")
        .select(
          `
          debit::text,
          kredit::text,
          jurnal:jurnal_id!inner ( tanggal ),
          akun:akun_id!inner ( peran )
        `,
        )
        .eq("akun.peran", "penjualan")
        .gte("jurnal.tanggal", startDate)
        .lte("jurnal.tanggal", endDate),
      supabase
        .from("faktur")
        .select(
          `
          id,
          nomor,
          tanggal_faktur,
          status,
          dpp::text,
          pelanggan_id,
          pelanggan:pelanggan_id ( kode_pelanggan, nama )
        `,
        )
        .in("status", ["DITERBITKAN", "SEBAGIAN_LUNAS", "LUNAS", "DIBATALKAN"])
        .gte("tanggal_faktur", startDate)
        .lte("tanggal_faktur", endDate)
        .order("tanggal_faktur", { ascending: true }),
      supabase
        .from("retur_penjualan")
        .select(
          `
          id,
          nomor,
          tanggal,
          status,
          total_dpp::text,
          pelanggan_id,
          pelanggan:pelanggan_id ( kode_pelanggan, nama )
        `,
        )
        .eq("status", "SELESAI")
        .gte("tanggal", startDate)
        .lte("tanggal", endDate)
        .order("tanggal", { ascending: true }),
    ]);

  let totalPenjualanBukuBesar = 0;
  for (const jb of (jurnalBaris ?? []) as unknown as Row[]) {
    totalPenjualanBukuBesar = round2(
      totalPenjualanBukuBesar +
        Number(jb.kredit ?? 0) -
        Number(jb.debit ?? 0),
    );
  }

  const pelMap = new Map<string, LaporanPenjualanPelangganRow>();
  const dokumen: LaporanPenjualanDokumenRow[] = [];
  const activeFakturIds: string[] = [];

  let totalDppFaktur = 0;
  for (const f of (fakturs ?? []) as unknown as Row[]) {
    const pelRaw = Array.isArray(f.pelanggan) ? f.pelanggan[0] : f.pelanggan;
    const pel = (pelRaw ?? {}) as Row;
    const isBatal = String(f.status) === "DIBATALKAN";
    // AC-05: Dokumen batal tampil dengan nilai nol
    const dpp = isBatal ? 0 : Number(f.dpp ?? 0);

    if (!isBatal) {
      activeFakturIds.push(String(f.id));
    }
    totalDppFaktur = round2(totalDppFaktur + dpp);

    const pelId = String(f.pelanggan_id);
    const cur = pelMap.get(pelId) ?? {
      pelangganId: pelId,
      pelangganKode: String(pel.kode_pelanggan ?? "-"),
      pelangganNama: String(pel.nama ?? "-"),
      dppFaktur: 0,
      dppRetur: 0,
      penjualanNeto: 0,
    };
    cur.dppFaktur = round2(cur.dppFaktur + dpp);
    cur.penjualanNeto = round2(cur.dppFaktur - cur.dppRetur);
    pelMap.set(pelId, cur);

    dokumen.push({
      id: String(f.id),
      jenis: "FAKTUR",
      nomor: String(f.nomor),
      tanggal: String(f.tanggal_faktur),
      pelangganNama: String(pel.nama ?? "-"),
      status: String(f.status),
      dpp,
    });
  }

  let totalDppRetur = 0;
  for (const r of (returs ?? []) as unknown as Row[]) {
    const pelRaw = Array.isArray(r.pelanggan) ? r.pelanggan[0] : r.pelanggan;
    const pel = (pelRaw ?? {}) as Row;
    const dppRetur = Number(r.total_dpp ?? 0);
    totalDppRetur = round2(totalDppRetur + dppRetur);

    const pelId = String(r.pelanggan_id);
    const cur = pelMap.get(pelId) ?? {
      pelangganId: pelId,
      pelangganKode: String(pel.kode_pelanggan ?? "-"),
      pelangganNama: String(pel.nama ?? "-"),
      dppFaktur: 0,
      dppRetur: 0,
      penjualanNeto: 0,
    };
    cur.dppRetur = round2(cur.dppRetur + dppRetur);
    cur.penjualanNeto = round2(cur.dppFaktur - cur.dppRetur);
    pelMap.set(pelId, cur);

    dokumen.push({
      id: String(r.id),
      jenis: "RETUR",
      nomor: String(r.nomor),
      tanggal: String(r.tanggal),
      pelangganNama: String(pel.nama ?? "-"),
      status: String(r.status),
      dpp: -dppRetur,
    });
  }

  // Rincian per produk (dari baris faktur aktif)
  const prodMap = new Map<string, LaporanPenjualanProdukRow>();
  if (activeFakturIds.length > 0) {
    const { data: fItems } = await supabase
      .from("faktur_item")
      .select(
        `
        produk_id,
        qty::text,
        dpp::text,
        produk:produk_id ( kode_produk, nama )
      `,
      )
      .in("faktur_id", activeFakturIds);

    for (const fi of (fItems ?? []) as unknown as Row[]) {
      const prodRaw = Array.isArray(fi.produk) ? fi.produk[0] : fi.produk;
      const prod = (prodRaw ?? {}) as Row;
      const pId = String(fi.produk_id);
      const cur = prodMap.get(pId) ?? {
        produkId: pId,
        produkKode: String(prod.kode_produk ?? "-"),
        produkNama: String(prod.nama ?? "-"),
        qtyTerjual: 0,
        dppPenjualan: 0,
      };
      cur.qtyTerjual = round2(cur.qtyTerjual + Number(fi.qty ?? 0));
      cur.dppPenjualan = round2(cur.dppPenjualan + Number(fi.dpp ?? 0));
      prodMap.set(pId, cur);
    }
  }

  return {
    periode,
    totalPenjualanBukuBesar,
    totalDppFaktur,
    totalDppRetur,
    totalPenjualanNeto: round2(totalDppFaktur - totalDppRetur),
    perPelanggan: Array.from(pelMap.values()),
    perProduk: Array.from(prodMap.values()),
    dokumen,
  };
}

export async function getLaporanPiutang(
  tanggalLaporan: string,
): Promise<LaporanPiutangResult> {
  const supabase = createAdminClient();
  const emptyBuckets = AGING_BUCKETS.map((b) => ({
    key: b.key,
    label: b.label,
    jumlahFaktur: 0,
    totalSisa: 0,
  }));

  if (!supabase) {
    return {
      tanggalLaporan,
      totalPiutang: 0,
      buckets: emptyBuckets,
      rows: [],
    };
  }

  const { data } = await supabase
    .from("faktur")
    .select(
      `
      id,
      nomor,
      tanggal_faktur,
      jatuh_tempo,
      total::text,
      sisa_piutang::text,
      pelanggan:pelanggan_id ( kode_pelanggan, nama )
    `,
    )
    .in("status", ["DITERBITKAN", "SEBAGIAN_LUNAS"])
    .lte("tanggal_faktur", tanggalLaporan)
    .gt("sisa_piutang", 0)
    .order("jatuh_tempo", { ascending: true });

  const bucketMap = new Map(emptyBuckets.map((b) => [b.key, { ...b }]));
  const rows: LaporanPiutangFakturRow[] = [];
  let totalPiutang = 0;

  for (const f of (data ?? []) as unknown as Row[]) {
    const pelRaw = Array.isArray(f.pelanggan) ? f.pelanggan[0] : f.pelanggan;
    const pel = (pelRaw ?? {}) as Row;
    const sisa = Number(f.sisa_piutang ?? 0);
    const { umurHari, bucket } = hitungUmurDanBucket(
      String(f.jatuh_tempo),
      tanggalLaporan,
    );

    totalPiutang = round2(totalPiutang + sisa);
    const bSum = bucketMap.get(bucket.key);
    if (bSum) {
      bSum.jumlahFaktur += 1;
      bSum.totalSisa = round2(bSum.totalSisa + sisa);
    }

    rows.push({
      id: String(f.id),
      nomor: String(f.nomor),
      pelangganKode: String(pel.kode_pelanggan ?? "-"),
      pelangganNama: String(pel.nama ?? "-"),
      tanggalFaktur: String(f.tanggal_faktur),
      jatuhTempo: String(f.jatuh_tempo),
      totalFaktur: Number(f.total ?? 0),
      sisaPiutang: sisa,
      umurHari,
      bucketKey: bucket.key,
      bucketLabel: bucket.label,
    });
  }

  return {
    tanggalLaporan,
    totalPiutang,
    buckets: Array.from(bucketMap.values()),
    rows,
  };
}

export async function getLaporanKas(
  periode: string,
): Promise<LaporanKasResult> {
  const supabase = createAdminClient();
  if (!supabase) {
    return {
      periode,
      totalPenerimaanKas: 0,
      rows: [],
    };
  }

  const { startDate, endDate } = getRentangBulan(periode);

  const { data } = await supabase
    .from("jurnal_baris")
    .select(
      `
      debit::text,
      jurnal:jurnal_id!inner ( id, tanggal, sumber_tipe, sumber_nomor, sumber_pemicu ),
      akun:akun_id!inner ( peran, nomor, nama )
    `,
    )
    .eq("akun.peran", "kas_bank")
    .gt("debit", 0)
    .gte("jurnal.tanggal", startDate)
    .lte("jurnal.tanggal", endDate);

  const rows: LaporanKasRow[] = [];
  let totalPenerimaanKas = 0;

  for (const r of (data ?? []) as unknown as Row[]) {
    const jurRaw = Array.isArray(r.jurnal) ? r.jurnal[0] : r.jurnal;
    const jur = (jurRaw ?? {}) as Row;
    const akRaw = Array.isArray(r.akun) ? r.akun[0] : r.akun;
    const ak = (akRaw ?? {}) as Row;
    const debit = Number(r.debit ?? 0);
    totalPenerimaanKas = round2(totalPenerimaanKas + debit);

    rows.push({
      jurnalId: String(jur.id),
      tanggal: String(jur.tanggal),
      sumberTipe: String(jur.sumber_tipe),
      sumberNomor: String(jur.sumber_nomor),
      sumberPemicu: String(jur.sumber_pemicu),
      akunNomor: String(ak.nomor ?? "-"),
      akunNama: String(ak.nama ?? "-"),
      nominalDebit: debit,
    });
  }

  rows.sort((a, b) => a.tanggal.localeCompare(b.tanggal));

  return {
    periode,
    totalPenerimaanKas,
    rows,
  };
}
