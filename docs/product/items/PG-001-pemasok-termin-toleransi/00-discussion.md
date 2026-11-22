# PG-001 — Diskusi

## Konteks

Item backlog `PG-001` berjudul "Pemasok, termin, toleransi match" (`backlog.md`, track PG-A master, level 1, depends on `FND-003`). Sumber fitur: `reference/analisis-sia.md` §5.3 fitur PG-1 (CRUD, termin, toleransi match, nonaktifkan; P0).

Pemasok adalah pihak luar yang tidak punya akun (`analisis-sia.md` §3.1). Tidak ada portal pemasok (`D-23`), jadi seluruh data pemasok diisi oleh staf internal.

## Kenapa ini item

Master pemasok dipakai oleh pemilihan pemasok (`PG-004`), penerbitan PO (`PG-005`), dan pencocokan tiga dokumen serta utang (`PG-008`). Termin dan toleransi harus sudah tersimpan sebelum dokumen-dokumen itu memakainya. Tanpa master ini, pencocokan tidak punya aturan yang bisa diacu.

## Alternatif yang dipertimbangkan

| Alternatif | Kenapa tidak dipilih |
|---|---|
| Toleransi disimpan di setiap invoice | `D-15` mengunci toleransi per pemasok, default 0 |
| Termin pemasok punya default seperti pelanggan (30 hari) | `D-14` mengunci termin pemasok tanpa default, wajib diisi |

## Keputusan yang diambil (dari sumber terkunci)

1. `D-14`: termin pemasok tidak punya default dan wajib diisi. Pelanggan default 30 hari tidak berlaku untuk pemasok.
2. `D-15`: toleransi per pemasok, default 0, hanya untuk harga dan total. Selisih qty selalu menjadi exception.
3. `D-05` dan `D-25`: tabel dan aturan pengadaan berada di core. Modul hanya memanggil service core.
4. `D-09`: DDL dari kelompok dikirim sebagai usulan; tech lead yang menomori dan merge migrasi.
5. `D-31`: tabel domain bersama, termasuk `pemasok`, dimiliki `core/`. Modul memiliki layar dan aturan alurnya.
6. `D-33`: matriks izin v0. Pengeluaran: "Buat / ubah pemasok" hanya Purchasing.
7. `D-32`: audit berupa kolom `created_by`, `created_at`, `updated_by`, `updated_at`; perubahan status ke `riwayat_status`.
8. `D-38`: transaksi IDR; mata uang dan kurs hanya di master.
9. `D-50`: master dinonaktifkan, bukan dihapus. Dokumen terbuka tetap berjalan; master nonaktif tidak bisa dipilih untuk dokumen baru.
10. `D-48`: satu akun satu peran; akun dinonaktifkan kehilangan sesinya.

## Pertanyaan terbuka

Ringkasan klasifikasi (diperbarui 2026-11-22 setelah `D-47` sampai `D-53`): 9 pertanyaan. Terjawab `D-xx`: 5. Terjawab `[USULAN-AGEN]`: 4. Terbuka: 0.

- `Q-01` Tabel `pemasok` ada di daftar tabel inti core (`analisis-sia.md` §7.2), tetapi backlog menempatkan pemasok di track PG-A dan `C-011` tidak mencakup pemasok. Siapa pemilik tabel dan penulisnya?
  → **Terjawab — D-31.** Tabel `pemasok` dimiliki `core/` (lihat juga `D-05`). Modul PG-A hanya memiliki layar dan aturan alur. DDL dibuat oleh item pertama yang membutuhkannya, dinomori tech lead (`D-09`).

- `Q-02` Siapa yang boleh membuat, mengubah, dan menonaktifkan pemasok?
  → **Terjawab — D-33.** Matriks v0 disahkan: "Buat / ubah pemasok" dan nonaktifkan dilakukan Purchasing. Manajemen tidak memiliki baris pemasok.

- `Q-03` Field apa saja yang wajib pada master pemasok, dan apakah kontak orang termasuk data pribadi?
  → **Terjawab — [USULAN-AGEN].** Wajib: nama, termin (`D-14`), dan status. Opsional: alamat, NPWP, telepon atau email perusahaan. Kontak orang (nama PIC, telepon dan email pribadi PIC) diperlakukan sebagai data pribadi: hanya Purchasing dan Accounting yang membacanya. Alasan: sumber menyebut identitas, alamat, dan kontak tanpa menyebut mana yang wajib, sementara peran yang memproses pencocokan dan pembayaran perlu membacanya.

- `Q-04` Apakah `term_hari` pada master boleh kosong?
  → **Terjawab — D-14.** Termin wajib diisi saat pemasok disimpan, tanpa default. Konsekuensi di AC-05.

- `Q-05` Mata uang `toleransi_nominal`: hanya IDR, atau mengikuti mata uang pemasok?
  → **Terjawab — D-38.** Transaksi IDR sampai ada kebutuhan. `mata_uang` dan `kurs` hanya di master, tidak dipakai transaksi. `toleransi_nominal` dicatat dalam IDR.

- `Q-06` Aturan kombinasi `toleransi_persen` dan `toleransi_nominal`: keduanya berlaku bersamaan, atau ambang yang lebih kecil/besar yang menang?
  → **Terjawab — [USULAN-AGEN].** Kedua batas berlaku bersama: selisih harga atau total lolos hanya bila memenuhi `toleransi_persen` dan `toleransi_nominal`, sehingga batas yang lebih ketat menang. Alasan: default 0 (`D-15`) menuntut batas ketat, dan batas longgar tidak boleh meloloskan selisih yang melewati salah satu batas. Penerapannya dibuktikan di `PG-008`.

- `Q-07` Arti "nonaktifkan": apakah pemasok nonaktif tetap bisa dipakai pada PR atau PO yang sudah ada, dan bisakah diaktifkan kembali?
  → **Terjawab — D-50.** Pemasok nonaktif tidak bisa dipilih untuk dokumen baru (PR, PO, dan kandidat pemilihan `PG-004`). Dokumen terbuka tetap berjalan. Aktivasi ulang oleh Purchasing diizinkan dan tercatat di `riwayat_status` (`[USULAN-AGEN]`: `D-50` hanya menyebut nonaktif dan tidak melarang aktivasi kembali).

- `Q-08` Apakah perubahan termin atau toleransi berlaku surut untuk dokumen yang sudah ada?
  → **Terjawab — [USULAN-AGEN].** Perubahan hanya berlaku untuk dokumen yang dibuat sesudahnya. Nilai termin dan toleransi yang berlaku disalin (snapshot) ke dokumen saat dokumen itu dibuat. Alasan: sejalan dengan `D-43` dan `D-48` (dokumen yang sudah berjalan tidak berubah diam-diam), dan sumber tidak menyebut perubahan surut.

- `Q-09` Apakah perubahan master pemasok perlu jejak nilai lama per field?
  → **Terjawab — [USULAN-AGEN].** Cukup kolom audit (`D-32`) dan `riwayat_status` untuk perubahan status. Nilai lama per field tidak disimpan di versi awal. Alasan: `D-32` menetapkan audit sebagai kolom tanpa tabel audit terpisah.

## Assumptions (agent-proposed)

- `[ANALISIS]` Satu organisasi (satu PT). Multi-perusahaan di luar cakupan (`analisis-sia.md` G22).
- `[SUMBER]` Pemasok tidak punya akun login (`analisis-sia.md` §3.1).
- `[USULAN]` Validasi dasar (nama wajib, toleransi tidak negatif) mengikuti pola yang sudah dipakai di sumber. Pesan teks adalah usulan dan ikut kunci koordinator.
- `[USULAN]` (`diagram-sia-lengkap.md` PG01, catatan rancangan) Validasi nama: "nama belum terdaftar". Belum diputuskan sebagai aturan.

## Next step

Tidak ada pertanyaan terbuka. Semua `[USULAN-AGEN]` di atas menunggu kunci koordinator. Item tetap `specified` sampai dependensi `done`; lihat `03-readiness-review.md`.
