import type { SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import { parseRpcResult } from "@/lib/parse-rpc-result";
import { fail, type Result } from "@/lib/result";
import { isRecord } from "@/lib/validation";
import type {
  AksiDokumen,
  BuatDokumenInput,
  Dokumen,
  PindahStatusDokumenInput,
  StatusDokumen,
  TransisiDokumenHasil,
  TransisiDokumenInput,
} from "./types";

const hasilTransisiSchema = z.object({
  dokumen: z.custom<Dokumen>(isRecord),
  riwayat_id: z.string(),
});

/** Common shape accepted by every transition configuration. */
interface InputTransisi {
  tipe?: string;
  dokumenId?: string;
  versi?: number;
  actorId: string;
  alasan?: string;
  nominal?: string;
  tanggal?: string;
  statusTujuan?: StatusDokumen;
  aksi?: AksiDokumen;
  diposting?: boolean;
  resetApproval?: boolean;
}

interface KonfigurasiTransisi {
  rpc: string;
  validasi(input: InputTransisi): string | null;
  args(input: InputTransisi): Record<string, unknown>;
}

function validasiIdentifikasi(input: InputTransisi): string | null {
  if (!input.dokumenId || !input.actorId) return "Data dokumen tidak lengkap.";
  if (typeof input.versi !== "number" || !Number.isInteger(input.versi) || input.versi < 0) {
    return "Versi dokumen tidak valid.";
  }
  return null;
}

function argsIdentifikasi(input: InputTransisi): Record<string, unknown> {
  return {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_aktor_id: input.actorId,
    p_alasan: input.alasan ?? null,
  };
}

function validasiAlasan(pesan: string) {
  return (input: InputTransisi): string | null =>
    validasiIdentifikasi(input) ?? (input.alasan?.trim() ? null : pesan);
}

function argsAlasan(input: InputTransisi): Record<string, unknown> {
  return {
    p_dokumen_id: input.dokumenId,
    p_versi: input.versi,
    p_aktor_id: input.actorId,
    p_alasan: input.alasan,
  };
}

const TRANSISI_DOKUMEN = {
  BUAT: {
    rpc: "buat_dokumen",
    validasi: (input) =>
      !input.tipe?.trim() || !input.actorId
        ? "Jenis dan aktor dokumen wajib diisi."
        : null,
    args: (input) => ({
      p_tipe: input.tipe?.trim(),
      p_aktor_id: input.actorId,
      p_nominal: input.nominal ?? null,
      p_tanggal: input.tanggal ?? null,
    }),
  },
  AJUKAN: {
    rpc: "ajukan_dokumen",
    validasi: validasiIdentifikasi,
    args: argsIdentifikasi,
  },
  PERIKSA: {
    rpc: "periksa_dokumen",
    validasi: validasiIdentifikasi,
    args: argsIdentifikasi,
  },
  SETUJUI: {
    rpc: "setujui_dokumen",
    validasi: validasiIdentifikasi,
    args: argsIdentifikasi,
  },
  REVISI: {
    rpc: "revisi_dokumen",
    validasi: validasiIdentifikasi,
    args: argsIdentifikasi,
  },
  REVISI_SELESAI: {
    rpc: "selesaikan_revisi_dokumen",
    validasi: validasiIdentifikasi,
    args: argsIdentifikasi,
  },
  TOLAK: {
    rpc: "tolak_dokumen",
    validasi: validasiAlasan("Isi alasan untuk menolak dokumen."),
    args: argsAlasan,
  },
  BATAL: {
    rpc: "batalkan_dokumen",
    validasi: validasiAlasan("Isi alasan untuk membatalkan dokumen."),
    args: argsAlasan,
  },
  PROSES: {
    rpc: "proses_dokumen",
    validasi: validasiIdentifikasi,
    args: argsIdentifikasi,
  },
  SELESAI: {
    rpc: "selesaikan_dokumen",
    validasi: validasiIdentifikasi,
    args: argsIdentifikasi,
  },
  PINDAH_STATUS: {
    rpc: "pindah_status_dokumen",
    validasi: (input) => {
      const invalid = validasiIdentifikasi(input);
      if (invalid) return invalid;
      if (!input.statusTujuan || !input.aksi) return "Status dan aksi wajib diisi.";
      return null;
    },
    args: (input) => ({
      p_dokumen_id: input.dokumenId,
      p_versi: input.versi,
      p_status_tujuan: input.statusTujuan,
      p_aksi: input.aksi,
      p_aktor_id: input.actorId,
      p_alasan: input.alasan ?? null,
      p_diposting: input.diposting ?? false,
      p_reset_approval: input.resetApproval ?? null,
    }),
  },
} satisfies Record<string, KonfigurasiTransisi>;

type KunciTransisi = keyof typeof TRANSISI_DOKUMEN;

async function jalankanTransisi(
  supabase: SupabaseClient,
  aksi: KunciTransisi,
  input: InputTransisi,
): Promise<Result<TransisiDokumenHasil>> {
  const konfigurasi = TRANSISI_DOKUMEN[aksi];
  const invalid = konfigurasi.validasi(input);
  if (invalid) return fail(invalid);

  const { data, error } = await supabase.rpc(konfigurasi.rpc, konfigurasi.args(input));
  if (error) return fail(error.message);

  return parseRpcResult(hasilTransisiSchema, data, "Respons layanan dokumen tidak valid.");
}

export async function buatDokumen(
  supabase: SupabaseClient,
  input: BuatDokumenInput,
): Promise<Result<TransisiDokumenHasil>> {
  return jalankanTransisi(supabase, "BUAT", input);
}

export async function ajukanDokumen(
  supabase: SupabaseClient,
  input: TransisiDokumenInput,
): Promise<Result<TransisiDokumenHasil>> {
  return jalankanTransisi(supabase, "AJUKAN", input);
}

export async function periksaDokumen(
  supabase: SupabaseClient,
  input: TransisiDokumenInput,
): Promise<Result<TransisiDokumenHasil>> {
  return jalankanTransisi(supabase, "PERIKSA", input);
}

export async function setujuiDokumen(
  supabase: SupabaseClient,
  input: TransisiDokumenInput,
): Promise<Result<TransisiDokumenHasil>> {
  return jalankanTransisi(supabase, "SETUJUI", input);
}

export async function revisiDokumen(
  supabase: SupabaseClient,
  input: TransisiDokumenInput,
): Promise<Result<TransisiDokumenHasil>> {
  return jalankanTransisi(supabase, "REVISI", input);
}

export async function selesaikanRevisiDokumen(
  supabase: SupabaseClient,
  input: TransisiDokumenInput,
): Promise<Result<TransisiDokumenHasil>> {
  return jalankanTransisi(supabase, "REVISI_SELESAI", input);
}

export async function tolakDokumen(
  supabase: SupabaseClient,
  input: TransisiDokumenInput & { alasan: string },
): Promise<Result<TransisiDokumenHasil>> {
  return jalankanTransisi(supabase, "TOLAK", input);
}

export async function batalkanDokumen(
  supabase: SupabaseClient,
  input: TransisiDokumenInput & { alasan: string },
): Promise<Result<TransisiDokumenHasil>> {
  return jalankanTransisi(supabase, "BATAL", input);
}

export async function prosesDokumen(
  supabase: SupabaseClient,
  input: TransisiDokumenInput,
): Promise<Result<TransisiDokumenHasil>> {
  return jalankanTransisi(supabase, "PROSES", input);
}

export async function selesaikanDokumen(
  supabase: SupabaseClient,
  input: TransisiDokumenInput,
): Promise<Result<TransisiDokumenHasil>> {
  return jalankanTransisi(supabase, "SELESAI", input);
}

export async function pindahStatusDokumen(
  supabase: SupabaseClient,
  input: PindahStatusDokumenInput,
): Promise<Result<TransisiDokumenHasil>> {
  return jalankanTransisi(supabase, "PINDAH_STATUS", input);
}
