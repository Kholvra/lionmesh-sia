import { createAdminClient } from "@/lib/supabase/admin";
import {
  SUMBER_JURNAL_PENDAPATAN,
  type JurnalBarisRow,
  type JurnalDetail,
  type JurnalRingkas,
} from "./types";

type Row = Record<string, unknown>;

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function listJurnalPenjualan(opts?: {
  sumberTipe?: string;
  q?: string;
}): Promise<JurnalRingkas[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  let query = supabase
    .from("jurnal")
    .select(
      `
      id,
      tanggal,
      sumber_tipe,
      sumber_id,
      sumber_nomor,
      sumber_pemicu,
      jurnal_asal_id,
      created_at,
      jurnal_baris ( debit::text, kredit::text )
    `,
    )
    .in("sumber_tipe", [...SUMBER_JURNAL_PENDAPATAN])
    .order("tanggal", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (opts?.sumberTipe && opts.sumberTipe !== "SEMUA") {
    query = query.eq("sumber_tipe", opts.sumberTipe);
  }

  const { data, error } = await query;
  if (error || !data) return [];

  const qLower = opts?.q?.trim().toLowerCase() ?? "";

  return (data as unknown as Row[])
    .map((r) => {
      const baris = (r.jurnal_baris ?? []) as Row[];
      const totalDebit = baris.reduce((s, b) => s + Number(b.debit ?? 0), 0);
      const totalKredit = baris.reduce((s, b) => s + Number(b.kredit ?? 0), 0);
      return {
        id: String(r.id),
        tanggal: String(r.tanggal),
        sumberTipe: String(r.sumber_tipe),
        sumberId: String(r.sumber_id),
        sumberNomor: String(r.sumber_nomor),
        sumberPemicu: String(r.sumber_pemicu),
        totalDebit,
        totalKredit,
        jurnalAsalId: r.jurnal_asal_id ? String(r.jurnal_asal_id) : null,
        createdAt: String(r.created_at),
      };
    })
    .filter((j) => {
      if (!qLower) return true;
      return (
        j.sumberNomor.toLowerCase().includes(qLower) ||
        j.sumberTipe.toLowerCase().includes(qLower) ||
        j.sumberPemicu.toLowerCase().includes(qLower)
      );
    });
}

export async function getJurnalDetail(
  id: string,
): Promise<JurnalDetail | null> {
  if (!UUID_REGEX.test(id)) return null;
  const supabase = createAdminClient();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from("jurnal")
    .select(
      `
      id,
      tanggal,
      sumber_tipe,
      sumber_id,
      sumber_nomor,
      sumber_pemicu,
      jurnal_asal_id,
      created_at,
      jurnal_baris (
        id,
        debit::text,
        kredit::text,
        akun:akun_id ( nomor, nama, peran )
      )
    `,
    )
    .eq("id", id)
    .maybeSingle();

  if (error || !data) return null;
  const r = data as unknown as Row;
  const barisRows = (r.jurnal_baris ?? []) as Row[];

  const baris: JurnalBarisRow[] = barisRows.map((b) => {
    const akunRaw = Array.isArray(b.akun) ? b.akun[0] : b.akun;
    const akun = (akunRaw ?? {}) as Row;
    return {
      id: String(b.id),
      akunNomor: String(akun.nomor ?? "-"),
      akunNama: String(akun.nama ?? "-"),
      akunPeran: String(akun.peran ?? "-"),
      debit: Number(b.debit ?? 0),
      kredit: Number(b.kredit ?? 0),
    };
  });

  const totalDebit = baris.reduce((s, b) => s + b.debit, 0);
  const totalKredit = baris.reduce((s, b) => s + b.kredit, 0);

  return {
    id: String(r.id),
    tanggal: String(r.tanggal),
    sumberTipe: String(r.sumber_tipe),
    sumberId: String(r.sumber_id),
    sumberNomor: String(r.sumber_nomor),
    sumberPemicu: String(r.sumber_pemicu),
    totalDebit,
    totalKredit,
    jurnalAsalId: r.jurnal_asal_id ? String(r.jurnal_asal_id) : null,
    createdAt: String(r.created_at),
    baris,
  };
}
