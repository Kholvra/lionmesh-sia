import type { SupabaseClient } from "@supabase/supabase-js";

import { fail, ok, type Result } from "@/lib/result";
import { buatPengirimEmail, type PengirimEmail } from "./email";
import { susunEmail } from "./isi";
import { hitungPercobaan } from "./jadwal";
import type { StatusPengirimanEmail } from "./types";

export interface OpsiProsesAntrean {
  sekarang?: Date;
  batas?: number;
  kirim?: PengirimEmail;
  emailDari?: string;
  basisUrl?: string | null;
}

export interface HasilProsesAntrean {
  diproses: number;
  terkirim: number;
  menunggu: number;
  gagal: number;
  perluPemeriksaan: number;
  dilewati: number;
}

type Row = Record<string, unknown>;

export function asString(value: unknown): string {
  return typeof value === "string" ? value : String(value ?? "");
}

function asNullableString(value: unknown): string | null {
  return value === null || value === undefined ? null : asString(value);
}

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value);
}

function entriNotifikasi(value: unknown): Row | null {
  if (Array.isArray(value)) {
    return value.length > 0 ? (value[0] as Row) : null;
  }
  return typeof value === "object" && value !== null ? (value as Row) : null;
}

async function kirimSatu(
  client: SupabaseClient,
  row: Row,
  opsi: {
    sekarang: Date;
    kirim: PengirimEmail;
    basisUrl: string | null;
  },
): Promise<Result<StatusPengirimanEmail>> {
  const percobaan = asNumber(row.percobaan);
  const alamat = asNullableString(row.alamat);
  const notifikasi = entriNotifikasi(row.notifikasi);
  const judul = asString(notifikasi?.judul);
  const nomorDokumen = asNullableString(notifikasi?.nomor_dokumen);
  const tautan = asNullableString(notifikasi?.tautan) ?? "/notifikasi";

  let hasil;
  if (!alamat) {
    hasil = {
      alasan: "Alamat email penerima belum diisi.",
      jadwalBerikutnya: null,
      percobaan: percobaan + 1,
      status: "gagal" as const,
    };
  } else {
    const email = susunEmail({
      basisUrl: opsi.basisUrl ?? undefined,
      judul,
      nomorDokumen,
      tautan,
    });
    const kirim = await opsi.kirim({ ke: alamat, subjek: email.subjek, teks: email.teks });
    if (!kirim.ok) {
      return ok("perlu_pemeriksaan");
    }
    hasil = hitungPercobaan({ berhasil: true, percobaan, sekarang: opsi.sekarang });
  }

  const { data, error } = await client
    .from("pengiriman_email")
    .update({
      alasan: hasil.alasan,
      diklaim_pada: null,
      jadwal_berikutnya: hasil.jadwalBerikutnya,
      percobaan: hasil.percobaan,
      status: hasil.status,
      terkirim_at: hasil.status === "terkirim" ? opsi.sekarang.toISOString() : null,
    })
    .eq("id", asString(row.id))
    .eq("status", "perlu_pemeriksaan")
    .select("id");

  if (error) return fail(error.message);
  if (!data || data.length !== 1) return fail("Hasil pengiriman belum dapat dicatat.");
  return ok(hasil.status);
}

/**
 * Memproses antrean email yang jatuh tempo. Berjalan terpisah dari transaksi
 * pemicu, jadi kegagalan kirim tidak membatalkan dokumen (INV-02).
 */
export async function prosesAntreanEmail(
  client: SupabaseClient,
  opsi: OpsiProsesAntrean = {},
): Promise<Result<HasilProsesAntrean>> {
  const sekarang = opsi.sekarang ?? new Date();
  const kirim = opsi.kirim ?? buatPengirimEmail();
  const batas = opsi.batas ?? 20;

  const due = await client
    .from("pengiriman_email")
    .select(
      "id,percobaan,alamat,status,notifikasi:notifikasi_id(judul,nomor_dokumen,tautan)",
    )
    .eq("status", "menunggu")
    .lte("jadwal_berikutnya", sekarang.toISOString())
    .order("jadwal_berikutnya", { ascending: true })
    .limit(batas);

  if (due.error) return fail(due.error.message);

  const hasil: HasilProsesAntrean = {
    dilewati: 0,
    diproses: 0,
    gagal: 0,
    menunggu: 0,
    perluPemeriksaan: 0,
    terkirim: 0,
  };

  for (const row of (due.data ?? []) as unknown as Row[]) {
    const id = asString(row.id);
    const percobaan = asNumber(row.percobaan);

    const klaim = await client
      .from("pengiriman_email")
      .update({
        status: "perlu_pemeriksaan",
        alasan: "Hasil pengiriman belum dipastikan. Periksa penyedia email sebelum mengirim ulang.",
        jadwal_berikutnya: null,
        diklaim_pada: sekarang.toISOString(),
        percobaan: percobaan + 1,
      })
      .eq("id", id)
      .eq("status", "menunggu")
      .eq("percobaan", percobaan)
      .is("diklaim_pada", null)
      .select("id");

    if (klaim.error) return fail("Antrean email tidak dapat diklaim.");
    if (!klaim.data || klaim.data.length === 0) {
      hasil.dilewati += 1;
      continue;
    }

    const proses = await kirimSatu(client, row, {
      basisUrl: opsi.basisUrl ?? null,
      kirim,
      sekarang,
    });

    if (!proses.ok) {
      hasil.perluPemeriksaan += 1;
      continue;
    }

    hasil.diproses += 1;
    if (proses.data === "terkirim") hasil.terkirim += 1;
    else if (proses.data === "gagal") hasil.gagal += 1;
    else if (proses.data === "perlu_pemeriksaan") hasil.perluPemeriksaan += 1;
    else hasil.menunggu += 1;
  }

  return ok(hasil);
}
