export const DAFTAR_LAPORAN = [
  {
    slug: "buku-besar",
    judul: "Buku besar",
    deskripsi:
      "Setiap baris jurnal yang memengaruhi satu akun, dengan saldo berjalan.",
  },
  {
    slug: "neraca-saldo",
    judul: "Neraca saldo",
    deskripsi:
      "Saldo debit dan kredit setiap akun sampai akhir periode, beserta selisihnya.",
  },
  {
    slug: "laba-rugi",
    judul: "Laba rugi",
    deskripsi:
      "Pendapatan, beban, dan laba bersih periode dari akun peran pendapatan dan beban.",
  },
  {
    slug: "neraca",
    judul: "Neraca",
    deskripsi:
      "Aktiva, kewajiban, dan ekuitas sampai akhir periode, termasuk laba tahun berjalan.",
  },
  {
    slug: "daftar-jurnal",
    judul: "Daftar jurnal",
    deskripsi: "Seluruh jurnal dan barisnya pada periode terpilih.",
  },
  {
    slug: "arus-kas",
    judul: "Arus kas",
    deskripsi: "Mutasi kas dan bank pada periode terpilih, dengan saldo berjalan.",
  },
  {
    slug: "kartu-persediaan",
    judul: "Kartu persediaan",
    deskripsi:
      "Mutasi dan saldo per produk dan per gudang pada periode terpilih.",
  },
] as const;

export type LaporanSlug = (typeof DAFTAR_LAPORAN)[number]["slug"];

export function isLaporanSlug(value: string): value is LaporanSlug {
  return DAFTAR_LAPORAN.some((laporan) => laporan.slug === value);
}

export function cariLaporan(slug: LaporanSlug) {
  const laporan = DAFTAR_LAPORAN.find((item) => item.slug === slug);
  if (!laporan) {
    throw new Error(`Laporan tidak dikenal: ${slug}`);
  }
  return laporan;
}
