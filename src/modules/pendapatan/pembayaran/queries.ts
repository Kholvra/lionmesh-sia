import { listRiwayatStatus } from "@/core/dokumen";
import { createAdminClient } from "@/lib/supabase/admin";
import { isValidUuid } from "./schema";
import type {
  PelangganTagihanRef,
  PembayaranAlokasiRow,
  PembayaranDetail,
  PembayaranRingkas,
} from "./types";

type Row = Record<string, unknown>;

export async function listPembayaran(
  cari?: string,
  statusFilter?: string,
): Promise<PembayaranRingkas[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let query = supabase
    .from("pembayaran")
    .select(
      `
      id, dokumen_id, nomor, pelanggan_id, tanggal, nominal::text,
      metode, nomor_referensi, status, created_by, created_at,
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

  const mapped: PembayaranRingkas[] = (data as unknown as Row[]).map((r) => {
    const pel = r.pelanggan as Row | null;
    return {
      id: String(r.id),
      dokumenId: r.dokumen_id ? String(r.dokumen_id) : null,
      nomor: String(r.nomor),
      pelangganId: String(r.pelanggan_id),
      pelangganKode: pel ? String(pel.kode_pelanggan ?? "-") : "-",
      pelangganNama: pel ? String(pel.nama ?? "-") : "-",
      tanggal: String(r.tanggal),
      nominal: Number(r.nominal ?? 0),
      metode: String(r.metode),
      nomorReferensi: r.nomor_referensi ? String(r.nomor_referensi) : null,
      status: String(r.status),
      createdBy: r.created_by ? String(r.created_by) : null,
      createdAt: String(r.created_at),
    };
  });

  if (!term) return mapped;
  return mapped.filter(
    (p) =>
      p.nomor.toLowerCase().includes(term) ||
      p.pelangganNama.toLowerCase().includes(term) ||
      (p.nomorReferensi ?? "").toLowerCase().includes(term),
  );
}

export async function getPembayaranDetail(
  idOrNomor: string,
): Promise<PembayaranDetail | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const isUuid = isValidUuid(idOrNomor);
  const { data: header, error } = await supabase
    .from("pembayaran")
    .select(
      `
      id, dokumen_id, nomor, pelanggan_id, tanggal, nominal::text,
      metode, nomor_referensi, status, jurnal_id, jurnal_pembalik_id,
      alasan_batal, created_by, created_at,
      pelanggan:pelanggan_id (kode_pelanggan, nama)
    `,
    )
    .eq(isUuid ? "id" : "nomor", idOrNomor)
    .maybeSingle();

  if (error || !header) return null;

  const h = header as unknown as Row;
  const pel = h.pelanggan as Row | null;

  const { data: allocRows } = await supabase
    .from("pembayaran_alokasi")
    .select(
      `
      id, faktur_id, nominal::text,
      faktur:faktur_id (nomor, tanggal_faktur, sisa_piutang::text, status)
    `,
    )
    .eq("pembayaran_id", String(h.id));

  const alokasi: PembayaranAlokasiRow[] = (
    (allocRows ?? []) as unknown as Row[]
  ).map((a) => {
    const f = a.faktur as Row | null;
    return {
      id: String(a.id),
      fakturId: String(a.faktur_id),
      fakturNomor: f ? String(f.nomor ?? "-") : "-",
      tanggalFaktur: f ? String(f.tanggal_faktur ?? "") : "",
      nominal: Number(a.nominal ?? 0),
      sisaFakturSaatIni: f ? Number(f.sisa_piutang ?? 0) : 0,
      statusFaktur: f ? String(f.status ?? "-") : "-",
    };
  });

  let riwayat: PembayaranDetail["riwayat"] = [];
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
    pelangganId: String(h.pelanggan_id),
    pelangganKode: pel ? String(pel.kode_pelanggan ?? "-") : "-",
    pelangganNama: pel ? String(pel.nama ?? "-") : "-",
    tanggal: String(h.tanggal),
    nominal: Number(h.nominal ?? 0),
    metode: String(h.metode),
    nomorReferensi: h.nomor_referensi ? String(h.nomor_referensi) : null,
    status: String(h.status),
    jurnalId: h.jurnal_id ? String(h.jurnal_id) : null,
    jurnalPembalikId: h.jurnal_pembalik_id
      ? String(h.jurnal_pembalik_id)
      : null,
    alasanBatal: h.alasan_batal ? String(h.alasan_batal) : null,
    createdBy: h.created_by ? String(h.created_by) : null,
    createdAt: String(h.created_at),
    alokasi,
    riwayat,
  };
}

export async function listPelangganDenganTagihan(): Promise<
  PelangganTagihanRef[]
> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data: fakturs, error } = await supabase
    .from("faktur")
    .select(
      `
      id, nomor, pelanggan_id, tanggal_faktur, jatuh_tempo,
      total::text, sisa_piutang::text,
      pelanggan:pelanggan_id (kode_pelanggan, nama)
    `,
    )
    .in("status", ["DITERBITKAN", "SEBAGIAN_LUNAS"])
    .gt("sisa_piutang", 0)
    .order("tanggal_faktur", { ascending: true });

  if (error || !fakturs) return [];

  const mapPel = new Map<string, PelangganTagihanRef>();

  for (const f of fakturs as unknown as Row[]) {
    const pelId = String(f.pelanggan_id);
    const pel = f.pelanggan as Row | null;
    const sisa = Number(f.sisa_piutang ?? 0);

    const existing = mapPel.get(pelId) ?? {
      id: pelId,
      kodePelanggan: pel ? String(pel.kode_pelanggan ?? "-") : "-",
      nama: pel ? String(pel.nama ?? "-") : "-",
      totalTagihanTerbuka: 0,
      fakturTerbuka: [],
    };

    existing.totalTagihanTerbuka += sisa;
    existing.fakturTerbuka.push({
      id: String(f.id),
      nomor: String(f.nomor),
      tanggalFaktur: String(f.tanggal_faktur),
      jatuhTempo: String(f.jatuh_tempo),
      total: Number(f.total ?? 0),
      sisaPiutang: sisa,
    });

    mapPel.set(pelId, existing);
  }

  return Array.from(mapPel.values()).sort((a, b) =>
    a.nama.localeCompare(b.nama),
  );
}
