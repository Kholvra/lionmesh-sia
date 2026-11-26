import type { SupabaseClient } from "@supabase/supabase-js";

import { formatRupiah } from "@/lib/format/money";
import { fail, ok, type Result } from "@/lib/result";
import { isRecord } from "@/lib/validation";
import { createAdminClient } from "@/lib/supabase/admin";
import { buatPeriode, type PeriodeLaporan } from "./periode";
import { hitungNeracaSaldo } from "./report";
import { listBarisJurnal } from "./report-queries";
import type {
  NeracaSaldoPemeriksaan,
  PemeriksaanTutupPeriode,
  PemeriksaanTutupTahun,
  PeriodeAkuntansiStatus,
  TahunBukuStatus,
} from "./tutup-buku";

function ambilTeks(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function parsePeriodeRow(value: unknown): PeriodeAkuntansiStatus | null {
  if (!isRecord(value)) return null;

  const tahun = Number(value.tahun);
  const bulan = Number(value.bulan);
  const status = ambilTeks(value.status);

  if (!Number.isInteger(tahun) || !Number.isInteger(bulan)) return null;
  if (bulan < 1 || bulan > 12) return null;
  if (status !== "buka" && status !== "kunci") return null;

  return {
    ...buatPeriode(tahun, bulan),
    status,
    dikunciAt: ambilTeks(value.dikunci_at),
    dikunciOleh: ambilTeks(value.dikunci_oleh),
  };
}

export async function listPeriodeAkuntansiStatus(
  supabase: SupabaseClient,
): Promise<Result<PeriodeAkuntansiStatus[]>> {
  const { data, error } = await supabase
    .from("periode_akuntansi")
    .select("tahun, bulan, status, dikunci_at, dikunci_oleh")
    .order("tahun", { ascending: true })
    .order("bulan", { ascending: true });

  if (error) return fail(`Gagal membaca periode akuntansi: ${error.message}`);
  if (!Array.isArray(data)) return fail("Respons periode akuntansi tidak valid.");

  const hasil: PeriodeAkuntansiStatus[] = [];
  for (const item of data) {
    const periode = parsePeriodeRow(item);
    if (!periode) return fail("Data periode akuntansi tidak lengkap.");
    hasil.push(periode);
  }

  return ok(hasil);
}

export async function getTahunBuku(
  supabase: SupabaseClient,
  tahun: number,
): Promise<Result<TahunBukuStatus>> {
  const { data, error } = await supabase
    .from("tahun_buku")
    .select("id, tahun, status, ditutup_at, ditutup_oleh")
    .eq("tahun", tahun)
    .maybeSingle();

  if (error) return fail(`Gagal membaca tahun buku: ${error.message}`);

  if (!data) {
    return ok({
      id: null,
      tahun,
      status: "terbuka",
      ditutupAt: null,
      ditutupOleh: null,
    });
  }

  if (!isRecord(data)) return fail("Respons tahun buku tidak valid.");

  const status = ambilTeks(data.status);
  if (status !== "terbuka" && status !== "ditutup") {
    return fail("Status tahun buku tidak valid.");
  }

  return ok({
    id: ambilTeks(data.id),
    tahun: Number(data.tahun),
    status,
    ditutupAt: ambilTeks(data.ditutup_at),
    ditutupOleh: ambilTeks(data.ditutup_oleh),
  });
}

async function hitungSetengahPosting(
  admin: SupabaseClient,
  tahun: number,
  bulan: number,
): Promise<Result<number>> {
  const { data, error } = await admin.rpc("c010_hitung_setengah_posting", {
    p_tahun: tahun,
    p_bulan: bulan,
  });

  if (error) {
    return fail(`Gagal memeriksa dokumen setengah posting: ${error.message}`);
  }
  if (typeof data !== "number" || !Number.isInteger(data) || data < 0) {
    return fail("Respons pemeriksaan setengah posting tidak valid.");
  }
  return ok(data);
}

async function periksaNeraca(
  supabase: SupabaseClient,
  periode: PeriodeLaporan,
): Promise<Result<NeracaSaldoPemeriksaan>> {
  const baris = await listBarisJurnal(supabase, { selesai: periode.selesai });
  if (!baris.ok) return baris;

  const laporan = hitungNeracaSaldo(baris.data);
  return ok({
    seimbang: laporan.seimbang,
    totalDebitCents: laporan.totalDebitCents,
    totalKreditCents: laporan.totalKreditCents,
    selisihCents: laporan.selisihCents,
  });
}

function statusPeriode(
  rows: readonly PeriodeAkuntansiStatus[],
  tahun: number,
  bulan: number,
): "buka" | "kunci" | "belum_ada" {
  return (
    rows.find((row) => row.tahun === tahun && row.bulan === bulan)?.status ??
    "belum_ada"
  );
}

async function tahunSebelumnya(
  supabase: SupabaseClient,
  rows: readonly PeriodeAkuntansiStatus[],
  tahun: number,
): Promise<
  Result<
    | {
        tahun: number;
        status: "terbuka" | "ditutup" | "tidak_ada";
        punyaAktivitas: boolean;
      }
    | null
  >
> {
  if (tahun <= 2000) return ok(null);

  const sebelumnya = tahun - 1;
  const tahunBuku = await getTahunBuku(supabase, sebelumnya);
  if (!tahunBuku.ok) return tahunBuku;

  const punyaAktivitas =
    rows.some((row) => row.tahun === sebelumnya) || tahunBuku.data.id !== null;

  return ok({
    tahun: sebelumnya,
    status: tahunBuku.data.id === null ? "tidak_ada" : tahunBuku.data.status,
    punyaAktivitas,
  });
}

export async function getPemeriksaanTutupPeriode(
  supabase: SupabaseClient,
  periode: PeriodeLaporan,
): Promise<Result<PemeriksaanTutupPeriode>> {
  const rows = await listPeriodeAkuntansiStatus(supabase);
  if (!rows.ok) return rows;

  const admin = createAdminClient();
  if (!admin) {
    return fail("Layanan tutup buku belum tersedia. Hubungi administrator.");
  }

  const [setengah, neraca] = await Promise.all([
    hitungSetengahPosting(admin, periode.tahun, periode.bulan),
    periksaNeraca(supabase, periode),
  ]);
  if (!setengah.ok) return setengah;
  if (!neraca.ok) return neraca;

  const status = statusPeriode(rows.data, periode.tahun, periode.bulan);
  const sebelumnya = buatPeriode(
    periode.bulan === 1 ? periode.tahun - 1 : periode.tahun,
    periode.bulan === 1 ? 12 : periode.bulan - 1,
  );
  const statusSebelumnya = statusPeriode(
    rows.data,
    sebelumnya.tahun,
    sebelumnya.bulan,
  );

  const januari = statusPeriode(rows.data, periode.tahun, 1);
  const butuhGateTahun = januari !== "kunci";
  const tahunLaluHasil = butuhGateTahun
    ? await tahunSebelumnya(supabase, rows.data, periode.tahun)
    : ok(null);
  if (!tahunLaluHasil.ok) return tahunLaluHasil;
  const tahunLalu = tahunLaluHasil.data;

  const alasan: string[] = [];
  if (status === "kunci") {
    alasan.push(`Periode ${periode.label} sudah ditutup.`);
  }
  if (periode.bulan === 12) {
    alasan.push(
      "Desember ditutup lewat tutup buku tahunan, bukan tutup periode bulanan.",
    );
  }
  if (statusSebelumnya === "buka") {
    alasan.push(`Periode ${sebelumnya.label} belum ditutup.`);
  }
  if (setengah.data > 0) {
    alasan.push(
      `Ada ${setengah.data} dokumen setengah posting pada ${periode.label}.`,
    );
  }
  if (!neraca.data.seimbang) {
    alasan.push(
      `Neraca saldo tidak seimbang: selisih ${formatRupiah(
        neraca.data.selisihCents,
      )}.`,
    );
  }
  if (
    tahunLalu &&
    tahunLalu.punyaAktivitas &&
    tahunLalu.status !== "ditutup"
  ) {
    alasan.push(`Tahun buku ${tahunLalu.tahun} belum ditutup.`);
  }

  return ok({
    periode,
    status,
    periodeSebelumnya: {
      label: sebelumnya.label,
      status: statusSebelumnya,
    },
    setengahPosting: setengah.data,
    neraca: neraca.data,
    tahunSebelumnya: tahunLalu,
    bisaDitutup: alasan.length === 0,
    alasan,
  });
}

export async function getPemeriksaanTutupTahun(
  supabase: SupabaseClient,
  tahun: number,
): Promise<Result<PemeriksaanTutupTahun>> {
  const [rows, tahunBuku, admin] = await Promise.all([
    listPeriodeAkuntansiStatus(supabase),
    getTahunBuku(supabase, tahun),
    Promise.resolve(createAdminClient()),
  ]);

  if (!rows.ok) return rows;
  if (!tahunBuku.ok) return tahunBuku;
  if (!admin) {
    return fail("Layanan tutup buku belum tersedia. Hubungi administrator.");
  }

  const setengah = await Promise.all(
    Array.from({ length: 12 }, (_, index) =>
      hitungSetengahPosting(admin, tahun, index + 1),
    ),
  );
  const setengahGagal = setengah.find((item) => !item.ok);
  if (setengahGagal && !setengahGagal.ok) return setengahGagal;

  const totalSetengah = setengah.reduce(
    (jumlah, item) => jumlah + (item.ok ? item.data : 0),
    0,
  );

  const neraca = await periksaNeraca(supabase, buatPeriode(tahun, 12));
  if (!neraca.ok) return neraca;

  const periodeTerbuka: { tahun: number; bulan: number; label: string }[] = [];
  for (let bulan = 1; bulan <= 11; bulan += 1) {
    if (statusPeriode(rows.data, tahun, bulan) === "buka") {
      periodeTerbuka.push({
        tahun,
        bulan,
        label: buatPeriode(tahun, bulan).label,
      });
    }
  }

  const desemberStatus = statusPeriode(rows.data, tahun, 12);
  const tahunLaluHasil = await tahunSebelumnya(supabase, rows.data, tahun);
  if (!tahunLaluHasil.ok) return tahunLaluHasil;
  const tahunLalu = tahunLaluHasil.data;

  const alasan: string[] = [];
  if (tahunBuku.data.status === "ditutup") {
    alasan.push(`Tahun buku ${tahun} sudah ditutup.`);
  }
  for (const periode of periodeTerbuka) {
    alasan.push(`Periode ${periode.label} belum ditutup.`);
  }
  if (desemberStatus === "kunci") {
    alasan.push(
      `Desember ${tahun} sudah ditutup; jurnal penutup tidak bisa dibuat.`,
    );
  }
  if (totalSetengah > 0) {
    alasan.push(
      `Ada ${totalSetengah} dokumen setengah posting pada tahun ${tahun}.`,
    );
  }
  if (!neraca.data.seimbang) {
    alasan.push(
      `Neraca saldo tidak seimbang: selisih ${formatRupiah(
        neraca.data.selisihCents,
      )}.`,
    );
  }
  if (
    tahunLalu &&
    tahunLalu.punyaAktivitas &&
    tahunLalu.status !== "ditutup"
  ) {
    alasan.push(`Tahun buku ${tahunLalu.tahun} belum ditutup.`);
  }

  return ok({
    tahun,
    status: tahunBuku.data.status,
    periodeTerbuka,
    desember: {
      status: desemberStatus,
      label: `Desember ${tahun}`,
    },
    setengahPosting: totalSetengah,
    neraca: neraca.data,
    tahunSebelumnya: tahunLalu,
    bisaDitutup: alasan.length === 0,
    alasan,
  });
}
