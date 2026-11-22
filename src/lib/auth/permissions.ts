import type { Peran } from "./types";

/**
 * Matriks Izin v0 (D-33, D-53, D-58).
 * Menghubungkan setiap aksi domain dengan peran yang diizinkan.
 */
export const MATRIKS_IZIN = {
  // Pendapatan
  buat_ubah_pelanggan: ["Penjualan"],
  buat_pesanan: ["Penjualan"],
  verifikasi_pesanan: ["Penjualan"],
  batalkan_pesanan: ["Penjualan"],
  ubah_batas_kredit: ["Manajemen"],
  setujui_retur_penjualan: ["Accounting"],
  periksa_qc_barang_retur: ["QC"],
  lihat_laporan_kas: ["Accounting", "Manajemen"],
  cek_alokasi_stok: ["Gudang"],
  buat_pengiriman: ["Gudang", "Pengiriman"],
  terbitkan_faktur: ["Accounting"],
  lihat_piutang: ["Accounting", "Manajemen"],
  catat_pembayaran_piutang: ["Finance"],
  verifikasi_pembayaran_piutang: ["Accounting"],
  lihat_laporan_penjualan: ["Penjualan", "Accounting", "Manajemen"],

  // Pengeluaran
  buat_ubah_pemasok: ["Purchasing"],
  ajukan_pr: ["Gudang", "Produksi"],
  periksa_pr: ["Purchasing"],
  setujui_pr: ["Manajemen"],
  pilih_pemasok_po: ["Purchasing"],
  catat_penerimaan: ["Gudang"],
  catat_qc_bahan: ["QC"],
  cocokkan_dokumen: ["Purchasing"],
  sahkan_pencocokan: ["Accounting"],
  catat_invoice_utang: ["Accounting"],
  verifikasi_pembayaran_pemasok: ["Accounting"],
  bayar_pemasok: ["Finance"],
  rekonsiliasi_bank: ["Accounting"],
  lihat_laporan_pembelian: ["Purchasing", "Accounting", "Manajemen"],

  // Produksi
  kelola_data_produk: ["Produksi"],
  buat_perintah_produksi: ["Produksi"],
  ajukan_permintaan_bahan: ["Produksi"],
  cek_ketersediaan_bahan: ["Gudang"],
  terima_bahan: ["Gudang"],
  terima_barang_jadi: ["Gudang"],
  verifikasi_permintaan_bahan: ["Purchasing"],
  setujui_pembelian_bahan: ["Manajemen"],
  catat_pemakaian_bahan_keluar: ["Gudang"],
  catat_pemakaian_bahan_terpakai: ["Produksi"],
  catat_hasil_produksi: ["Produksi"],
  periksa_qc_hasil: ["QC"],
  catat_biaya_produksi: ["Accounting"],
  lihat_laporan_produksi: ["Produksi", "Gudang", "Manajemen", "Accounting"],

  // Penggajian
  kelola_data_karyawan: ["HR"],
  catat_presensi_mandiri: ["Karyawan", "HR"],
  ajukan_lembur_mandiri: ["Karyawan", "HR"],
  rekap_presensi: ["HR"],
  validasi_presensi: ["Supervisor Lapangan"],
  hitung_payroll: ["HR"],
  periksa_payroll: ["Accounting"],
  setujui_payroll: ["Direksi"],
  bayar_gaji: ["Finance"],
  terbitkan_slip: ["HR"],
  jurnal_payroll: ["Accounting"],
  lihat_laporan_payroll: ["HR", "Accounting", "Direksi"],

  // Tambahan default (D-58)
  ubah_batal_perintah_produksi: ["Produksi"],
  lihat_bom: ["Produksi", "Gudang", "Purchasing", "Manajemen", "Accounting"],
  catat_kartu_jam_kerja: ["Produksi"],
  tetapkan_tarif_overhead: ["Accounting"],
  lihat_hpp_perintah_produksi: ["Produksi", "Accounting", "Manajemen"],
  transfer_antar_gudang: ["Gudang"],
  tutup_exception_selisih: ["Purchasing"],
  ajukan_retur_pemasok: ["Purchasing"],
  setujui_retur_pemasok: ["Accounting"],
  catat_pengeluaran_retur: ["Gudang"],
} as const satisfies Record<string, readonly Peran[]>;

export type AksiDomain = keyof typeof MATRIKS_IZIN;

export function cekIzin(peran: Peran | null | undefined, aksi: AksiDomain): boolean {
  if (!peran) return false;
  const daftarPeran = MATRIKS_IZIN[aksi] as readonly Peran[];
  return daftarPeran.includes(peran);
}
