import { getDokumen, listRiwayatStatus } from "@/core/dokumen";
import { listPelanggan } from "@/core/pelanggan";
import { createAdminClient } from "@/lib/supabase/admin";
import type {
  PelangganRef,
  PesananDetail,
  PesananItemRow,
  PesananRingkas,
  ProdukRef,
} from "./types";

type Row = Record<string, unknown>;

export async function getTarifPpnAktif(
  supabase: ReturnType<typeof createAdminClient>,
  tanggal?: string,
): Promise<number> {
  if (!supabase) return 0.11;

  let query = supabase
    .from("konfigurasi_pajak")
    .select("tarif")
    .eq("kode", "PPN")
    .eq("aktif", true);

  if (tanggal) {
    query = query.lte("berlaku_mulai", tanggal);
  }

  const { data } = await query
    .order("berlaku_mulai", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data || data.tarif === null || data.tarif === undefined) return 0.11;
  const tarif = Number(data.tarif);
  return Number.isNaN(tarif) ? 0.11 : tarif;
}

export async function hitungExposurePelanggan(
  supabase: ReturnType<typeof createAdminClient>,
  pelangganId: string,
  excludePesananId?: string,
): Promise<number> {
  if (!supabase) return 0;

  let exposurePiutang = 0;
  try {
    const { data: fakturRows, error: fakturErr } = await supabase
      .from("faktur")
      .select("sisa_piutang, total")
      .eq("pelanggan_id", pelangganId)
      .in("status", ["DITERBITKAN", "SEBAGIAN_LUNAS"]);

    if (!fakturErr && fakturRows) {
      for (const f of fakturRows as Row[]) {
        const sisa =
          f.sisa_piutang !== undefined && f.sisa_piutang !== null
            ? Number(f.sisa_piutang)
            : Number(f.total ?? 0);
        if (!Number.isNaN(sisa)) exposurePiutang += sisa;
      }
    }
  } catch {
    // faktur table may not be populated yet before PD-005
  }

  let exposurePesanan = 0;
  let pesananQuery = supabase
    .from("pesanan")
    .select("id, total")
    .eq("pelanggan_id", pelangganId)
    .in("status", [
      "VERIFIED",
      "MENUNGGU_STOK",
      "SIAP_KIRIM",
      "TERKIRIM_SEBAGIAN",
      "TERKIRIM",
    ]);

  if (excludePesananId) {
    pesananQuery = pesananQuery.neq("id", excludePesananId);
  }

  const { data: pesananRows } = await pesananQuery;
  for (const p of (pesananRows ?? []) as Row[]) {
    const t = Number(p.total ?? 0);
    if (!Number.isNaN(t)) exposurePesanan += t;
  }

  return Math.round((exposurePiutang + exposurePesanan + Number.EPSILON) * 100) / 100;
}

export async function listPesanan(
  cari?: string,
  statusFilter?: string,
): Promise<PesananRingkas[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let query = supabase
    .from("pesanan")
    .select(
      `
      id, dokumen_id, nomor, tanggal, pelanggan_id, termin_hari, status,
      nilai_kotor::text, diskon_total::text, dpp::text, ppn::text, total::text, tarif_ppn::text,
      created_by, created_at,
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

  const mapped: PesananRingkas[] = (data as unknown as Row[]).map((r) => {
    const pel = r.pelanggan as Row | null;
    return {
      id: String(r.id),
      dokumenId: r.dokumen_id ? String(r.dokumen_id) : null,
      nomor: String(r.nomor),
      tanggal: String(r.tanggal),
      pelangganId: String(r.pelanggan_id),
      pelangganKode: pel ? String(pel.kode_pelanggan ?? "-") : "-",
      pelangganNama: pel ? String(pel.nama ?? "-") : "-",
      terminHari: Number(r.termin_hari ?? 30),
      status: String(r.status),
      nilaiKotor: Number(r.nilai_kotor ?? 0),
      diskonTotal: Number(r.diskon_total ?? 0),
      dpp: Number(r.dpp ?? 0),
      ppn: Number(r.ppn ?? 0),
      total: Number(r.total ?? 0),
      tarifPpn: Number(r.tarif_ppn ?? 0.11),
      createdBy: String(r.created_by),
      createdAt: String(r.created_at),
    };
  });

  if (!term) return mapped;
  return mapped.filter(
    (p) =>
      p.nomor.toLowerCase().includes(term) ||
      p.pelangganNama.toLowerCase().includes(term) ||
      p.pelangganKode.toLowerCase().includes(term),
  );
}

export async function getPesananDetail(id: string): Promise<PesananDetail | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data: header, error } = await supabase
    .from("pesanan")
    .select(
      `
      id, dokumen_id, nomor, tanggal, pelanggan_id, termin_hari, status,
      nilai_kotor::text, diskon_total::text, dpp::text, ppn::text, total::text, tarif_ppn::text,
      alasan_batal, alasan_revisi, alasan_override,
      created_by, created_at, verified_by, verified_at, updated_at,
      pelanggan:pelanggan_id (kode_pelanggan, nama, batas_kredit::text)
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !header) return null;

  const h = header as unknown as Row;
  const pel = h.pelanggan as Row | null;

  const { data: itemRows } = await supabase
    .from("pesanan_item")
    .select(
      `
      id, pesanan_id, produk_id, urutan,
      qty::text, harga_satuan::text, diskon_persen::text,
      nilai_kotor::text, diskon_nilai::text, dpp::text, ppn::text, total::text,
      produk:produk_id (kode, nama, satuan:satuan_dasar_id (kode))
    `,
    )
    .eq("pesanan_id", id)
    .order("urutan", { ascending: true });

  const items: PesananItemRow[] = ((itemRows ?? []) as unknown as Row[]).map(
    (it) => {
      const prod = it.produk as Row | null;
      const sat = prod?.satuan as Row | null;
      return {
        id: String(it.id),
        pesananId: String(it.pesanan_id),
        produkId: String(it.produk_id),
        produkKode: prod ? String(prod.kode ?? "-") : "-",
        produkNama: prod ? String(prod.nama ?? "-") : "-",
        satuanKode: sat ? String(sat.kode ?? "unit") : "unit",
        urutan: Number(it.urutan ?? 1),
        qty: Number(it.qty ?? 0),
        hargaSatuan: Number(it.harga_satuan ?? 0),
        diskonPersen: Number(it.diskon_persen ?? 0),
        nilaiKotor: Number(it.nilai_kotor ?? 0),
        diskonNilai: Number(it.diskon_nilai ?? 0),
        dpp: Number(it.dpp ?? 0),
        ppn: Number(it.ppn ?? 0),
        total: Number(it.total ?? 0),
      };
    },
  );

  const dokumenId = h.dokumen_id ? String(h.dokumen_id) : null;
  let riwayat: PesananDetail["riwayat"] = [];
  let dokumenVersi = 0;

  if (dokumenId) {
    const [riwayatRes, dokRes] = await Promise.all([
      listRiwayatStatus(supabase, dokumenId),
      getDokumen(supabase, dokumenId),
    ]);
    if (riwayatRes.ok) {
      riwayat = [...riwayatRes.data].reverse();
    }
    if (dokRes.ok && dokRes.data) {
      dokumenVersi = dokRes.data.versi;
    }
  }

  const exposureSaatIni = await hitungExposurePelanggan(
    supabase,
    String(h.pelanggan_id),
    id,
  );

  return {
    id: String(h.id),
    dokumenId,
    nomor: String(h.nomor),
    tanggal: String(h.tanggal),
    pelangganId: String(h.pelanggan_id),
    pelangganKode: pel ? String(pel.kode_pelanggan ?? "-") : "-",
    pelangganNama: pel ? String(pel.nama ?? "-") : "-",
    terminHari: Number(h.termin_hari ?? 30),
    status: String(h.status),
    nilaiKotor: Number(h.nilai_kotor ?? 0),
    diskonTotal: Number(h.diskon_total ?? 0),
    dpp: Number(h.dpp ?? 0),
    ppn: Number(h.ppn ?? 0),
    total: Number(h.total ?? 0),
    tarifPpn: Number(h.tarif_ppn ?? 0.11),
    createdBy: String(h.created_by),
    createdAt: String(h.created_at),
    alasanBatal: h.alasan_batal ? String(h.alasan_batal) : null,
    alasanRevisi: h.alasan_revisi ? String(h.alasan_revisi) : null,
    alasanOverride: h.alasan_override ? String(h.alasan_override) : null,
    verifiedBy: h.verified_by ? String(h.verified_by) : null,
    verifiedAt: h.verified_at ? String(h.verified_at) : null,
    updatedAt: String(h.updated_at),
    batasKreditPelanggan: pel ? Number(pel.batas_kredit ?? 0) : 0,
    exposureSaatIni,
    items,
    riwayat,
    dokumenVersi,
  };
}

export async function getFormReferenceData(): Promise<{
  pelangganList: PelangganRef[];
  produkList: ProdukRef[];
  tarifPpn: number;
}> {
  const supabase = createAdminClient();
  if (!supabase) {
    return { pelangganList: [], produkList: [], tarifPpn: 0.11 };
  }

  const [pelRes, prodRes, tarifPpn] = await Promise.all([
    listPelanggan(supabase, {
      status: "aktif",
      limit: 200,
      offset: 0,
      urutkan: "nama",
      arah: "ascending",
    }),
    supabase
      .from("produk")
      .select("id, kode, nama, satuan:satuan_dasar_id (kode, nama)")
      .eq("aktif", true)
      .order("nama", { ascending: true }),
    getTarifPpnAktif(supabase),
  ]);

  const pelangganList: PelangganRef[] = pelRes.ok
    ? pelRes.data.baris.map((p) => ({
        id: p.id,
        kodePelanggan: p.kodePelanggan,
        nama: p.nama,
        terminHari: p.terminHari,
        batasKredit: p.batasKredit,
        status: p.status,
      }))
    : [];

  const produkList: ProdukRef[] = ((prodRes.data ?? []) as unknown as Row[]).map(
    (p) => {
      const sat = p.satuan as Row | null;
      return {
        id: String(p.id),
        kode: String(p.kode),
        nama: String(p.nama),
        satuanKode: sat ? String(sat.kode ?? "unit") : "unit",
        satuanNama: sat ? String(sat.nama ?? "Unit") : "Unit",
        hargaJual: 0,
      };
    },
  );

  return { pelangganList, produkList, tarifPpn };
}
