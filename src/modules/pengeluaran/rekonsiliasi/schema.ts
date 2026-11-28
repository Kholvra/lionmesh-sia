import { z } from "zod";

const UUID = z.string().uuid("Data tidak valid");

const PERIODE = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Periode rekonsiliasi wajib dipilih");

const indeksSchema = z
  .string()
  .regex(/^\d+$/, "Kolom wajib dipetakan")
  .transform((value) => Number(value))
  .refine((value) => Number.isSafeInteger(value), "Kolom wajib dipetakan");

const indeksOpsionalSchema = z
  .string()
  .transform((value) => value.trim())
  .transform((value) => (value.length === 0 ? null : Number(value)))
  .refine((value) => value === null || Number.isSafeInteger(value), "Kolom tidak valid");

const imporSchema = z.object({
  rekeningBankId: UUID,
  periode: PERIODE,
  tanggal: indeksSchema,
  nominal: indeksSchema,
  referensi: indeksOpsionalSchema,
  arah: indeksOpsionalSchema,
});

const pasanganSchema = z.object({
  mutasiId: UUID,
  jurnalDetailId: UUID,
});

const selisihSchema = z.object({
  mutasiId: UUID,
  alasan: z.string().trim().min(1, "Alasan selisih wajib diisi"),
});

const profilSchema = z.object({
  nama: z.string().trim().min(1, "Nama profil wajib diisi"),
  rekeningBankId: z.string().trim(),
  tanggal: indeksSchema,
  nominal: indeksSchema,
  referensi: indeksOpsionalSchema,
  arah: indeksOpsionalSchema,
});

export interface ImporForm {
  rekeningBankId: string;
  periode: string;
  pemetaan: {
    tanggal: number;
    nominal: number;
    referensi: number | null;
    arah: number | null;
  };
}

export interface ProfilForm extends Omit<ImporForm, "periode"> {
  nama: string;
  rekeningBankId: string;
}

function text(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export function parseImpor(formData: FormData): {
  input: ImporForm | null;
  message: string | null;
} {
  const parsed = imporSchema.safeParse({
    rekeningBankId: text(formData, "rekening_bank_id"),
    periode: text(formData, "periode"),
    tanggal: text(formData, "kolom_tanggal"),
    nominal: text(formData, "kolom_nominal"),
    referensi: text(formData, "kolom_referensi"),
    arah: text(formData, "kolom_arah"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data impor tidak valid",
    };
  }

  return {
    input: {
      rekeningBankId: parsed.data.rekeningBankId,
      periode: parsed.data.periode,
      pemetaan: {
        tanggal: parsed.data.tanggal,
        nominal: parsed.data.nominal,
        referensi: parsed.data.referensi,
        arah: parsed.data.arah,
      },
    },
    message: null,
  };
}

export function parsePasangan(formData: FormData): {
  input: { mutasiId: string; jurnalDetailId: string } | null;
  message: string | null;
} {
  const parsed = pasanganSchema.safeParse({
    mutasiId: text(formData, "mutasi_id"),
    jurnalDetailId: text(formData, "jurnal_detail_id"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data pasangan tidak valid",
    };
  }
  return { input: parsed.data, message: null };
}

export function parseSelisih(formData: FormData): {
  input: { mutasiId: string; alasan: string } | null;
  message: string | null;
} {
  const parsed = selisihSchema.safeParse({
    mutasiId: text(formData, "mutasi_id"),
    alasan: text(formData, "alasan"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data selisih tidak valid",
    };
  }
  return { input: parsed.data, message: null };
}

export function parseProfil(formData: FormData): {
  input: ProfilForm | null;
  message: string | null;
} {
  const parsed = profilSchema.safeParse({
    nama: text(formData, "nama"),
    rekeningBankId: text(formData, "rekening_bank_id"),
    tanggal: text(formData, "kolom_tanggal"),
    nominal: text(formData, "kolom_nominal"),
    referensi: text(formData, "kolom_referensi"),
    arah: text(formData, "kolom_arah"),
  });
  if (!parsed.success) {
    return {
      input: null,
      message: parsed.error.issues[0]?.message ?? "Data profil tidak valid",
    };
  }

  return {
    input: {
      nama: parsed.data.nama,
      rekeningBankId: parsed.data.rekeningBankId,
      pemetaan: {
        tanggal: parsed.data.tanggal,
        nominal: parsed.data.nominal,
        referensi: parsed.data.referensi,
        arah: parsed.data.arah,
      },
    },
    message: null,
  };
}
