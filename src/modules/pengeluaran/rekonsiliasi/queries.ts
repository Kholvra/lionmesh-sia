import {
  getPengadaanExecutionContext,
  listImporMutasiBank,
  listMutasiBank,
  listProfilPemetaanBank,
  listRekeningBank,
  type ImporMutasiView,
  type MutasiBankView,
  type ProfilPemetaanBankView,
  type RekeningBank,
} from "@/core/pengadaan";
import { listBarisJurnal } from "@/core/ledger";
import type { Peran } from "@/lib/auth/types";

export interface JurnalKasView {
  detailId: string;
  jurnalId: string;
  tanggal: string;
  nomor: string;
  sumberTipe: string;
  debit: string;
  kredit: string;
}

export interface RekonPageData {
  daftar: MutasiBankView[];
  impor: ImporMutasiView[];
  profil: ProfilPemetaanBankView[];
  rekening: RekeningBank[];
  jurnalKas: JurnalKasView[];
  periode: string;
  rekeningId: string;
  jendelaHari: number;
  error: string | null;
}

export function bulanIniJakarta(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Jakarta" })
    .format(new Date())
    .slice(0, 7);
}

function bulanBerikut(periode: string): string {
  const [tahun, bulan] = periode.split("-").map(Number);
  const tanggal = new Date(Date.UTC(tahun, (bulan ?? 1) - 1 + 1, 1));
  return tanggal.toISOString().slice(0, 10);
}

export async function getRekonPageData(
  peran: Peran | null,
  options: { periode?: string; rekeningId?: string } = {},
): Promise<RekonPageData> {
  const periode = /^\d{4}-\d{2}$/.test(options.periode ?? "")
    ? (options.periode as string)
    : bulanIniJakarta();

  const kosong: RekonPageData = {
    daftar: [],
    impor: [],
    profil: [],
    rekening: [],
    jurnalKas: [],
    periode,
    rekeningId: options.rekeningId ?? "",
    jendelaHari: 0,
    error: null,
  };

  const context = await getPengadaanExecutionContext();
  if (!context.ok) return { ...kosong, error: context.message };
  if (peran !== "Accounting") {
    return { ...kosong, error: "Hanya Accounting yang dapat melakukan rekonsiliasi bank." };
  }

  const client = context.data.supabase;
  const [rekening, mutasi, impor, profil] = await Promise.all([
    listRekeningBank(client),
    listMutasiBank(client, { periode, rekeningBankId: options.rekeningId || undefined }),
    listImporMutasiBank(client),
    listProfilPemetaanBank(client),
  ]);

  const mulai = `${periode}-01T00:00:00+07:00`;
  const selesai = `${bulanBerikut(periode)}T00:00:00+07:00`;
  const baris = await listBarisJurnal(client, { mulai, selesai });

  const paired = new Set(
    (mutasi.ok ? mutasi.data : [])
      .map((row) => row.jurnalDetailId)
      .filter((value): value is string => value !== null),
  );

  const jurnalKas: JurnalKasView[] = baris.ok
    ? baris.data
        .filter((row) => row.akunPeran === "kas_bank" && !paired.has(row.barisId))
        .map((row) => ({
          detailId: row.barisId,
          jurnalId: row.jurnalId,
          tanggal: row.tanggal,
          nomor: row.sumberNomor,
          sumberTipe: row.sumberTipe,
          debit: row.debit,
          kredit: row.kredit,
        }))
    : [];

  return {
    daftar: mutasi.ok ? mutasi.data : [],
    impor: impor.ok ? impor.data : [],
    profil: profil.ok ? profil.data : [],
    rekening: rekening.ok ? rekening.data.filter((item) => item.aktif) : [],
    jurnalKas,
    periode,
    rekeningId: options.rekeningId ?? "",
    jendelaHari: 0,
    error:
      (mutasi.ok ? null : mutasi.message) ??
      (baris.ok ? null : baris.message) ??
      (rekening.ok ? null : rekening.message),
  };
}
