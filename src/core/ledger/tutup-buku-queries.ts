import type { SupabaseClient } from "@supabase/supabase-js";

import { formatRupiah } from "@/lib/format/money";
import { fail, ok, type Result } from "@/lib/result";
import { createAdminClient } from "@/lib/supabase/admin";
import { buatPeriode, type PeriodeLaporan } from "./periode";
import { hitungNeracaSaldo } from "./report";
import { listBarisJurnal } from "./report-queries";
import {
  getTahunBuku,
  hitungSetengahPosting,
  listPeriodeAkuntansiStatus,
} from "./tutup-buku-reads";
import type {
  NeracaSaldoPemeriksaan,
  PemeriksaanTutupPeriode,
  PemeriksaanTutupTahun,
  PeriodeAkuntansiStatus,
} from "./tutup-buku";

export {
  getTahunBuku,
  listPeriodeAkuntansiStatus,
} from "./tutup-buku-reads";

type StatusPeriode = "buka" | "kunci" | "belum_ada";

type TahunSebelumnya = {
  tahun: number;
  status: "terbuka" | "ditutup" | "tidak_ada";
  punyaAktivitas: boolean;
} | null;

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
): StatusPeriode {
  return (
    rows.find((row) => row.tahun === tahun && row.bulan === bulan)?.status ??
    "belum_ada"
  );
}

async function tahunSebelumnya(
  supabase: SupabaseClient,
  rows: readonly PeriodeAkuntansiStatus[],
  tahun: number,
): Promise<Result<TahunSebelumnya>> {
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

interface DasarAlasanTutup {
  setengahPosting: number;
  neraca: NeracaSaldoPemeriksaan;
  tahunSebelumnya: TahunSebelumnya;
}

type AlasanTutupInput =
  | (DasarAlasanTutup & {
      jenis: "periode";
      label: string;
      bulan: number;
      sudahDitutup: boolean;
      statusSebelumnya: StatusPeriode;
      labelSebelumnya: string;
    })
  | (DasarAlasanTutup & {
      jenis: "tahun";
      tahun: number;
      sudahDitutup: boolean;
      periodeTerbuka: readonly { label: string }[];
      desemberStatus: StatusPeriode;
    });

function susunAlasanTutup(input: AlasanTutupInput): string[] {
  const alasan: string[] = [];

  if (input.jenis === "periode") {
    if (input.sudahDitutup) {
      alasan.push(`Periode ${input.label} sudah ditutup.`);
    }
    if (input.bulan === 12) {
      alasan.push(
        "Desember ditutup lewat tutup buku tahunan, bukan tutup periode bulanan.",
      );
    }
    if (input.statusSebelumnya === "buka") {
      alasan.push(`Periode ${input.labelSebelumnya} belum ditutup.`);
    }
    if (input.setengahPosting > 0) {
      alasan.push(
        `Ada ${input.setengahPosting} dokumen setengah posting pada ${input.label}.`,
      );
    }
  } else {
    if (input.sudahDitutup) {
      alasan.push(`Tahun buku ${input.tahun} sudah ditutup.`);
    }
    for (const periode of input.periodeTerbuka) {
      alasan.push(`Periode ${periode.label} belum ditutup.`);
    }
    if (input.desemberStatus === "kunci") {
      alasan.push(
        `Desember ${input.tahun} sudah ditutup; jurnal penutup tidak bisa dibuat.`,
      );
    }
    if (input.setengahPosting > 0) {
      alasan.push(
        `Ada ${input.setengahPosting} dokumen setengah posting pada tahun ${input.tahun}.`,
      );
    }
  }

  if (!input.neraca.seimbang) {
    alasan.push(
      `Neraca saldo tidak seimbang: selisih ${formatRupiah(
        input.neraca.selisihCents,
      )}.`,
    );
  }
  if (
    input.tahunSebelumnya &&
    input.tahunSebelumnya.punyaAktivitas &&
    input.tahunSebelumnya.status !== "ditutup"
  ) {
    alasan.push(`Tahun buku ${input.tahunSebelumnya.tahun} belum ditutup.`);
  }

  return alasan;
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

  const alasan = susunAlasanTutup({
    jenis: "periode",
    label: periode.label,
    bulan: periode.bulan,
    sudahDitutup: status === "kunci",
    statusSebelumnya,
    labelSebelumnya: sebelumnya.label,
    setengahPosting: setengah.data,
    neraca: neraca.data,
    tahunSebelumnya: tahunLalu,
  });

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

  const alasan = susunAlasanTutup({
    jenis: "tahun",
    tahun,
    sudahDitutup: tahunBuku.data.status === "ditutup",
    periodeTerbuka,
    desemberStatus,
    setengahPosting: totalSetengah,
    neraca: neraca.data,
    tahunSebelumnya: tahunLalu,
  });

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
