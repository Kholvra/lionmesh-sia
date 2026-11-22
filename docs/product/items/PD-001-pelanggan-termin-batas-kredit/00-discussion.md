# PD-001 — Diskusi

## Konteks

Siklus Pendapatan (`EPIC-PD`, milestone M1) dimulai dari master pelanggan. Pesanan, pengiriman, faktur, dan pembayaran membutuhkan data pelanggan, termin pembayaran, dan batas kredit. Item ini adalah track PD-A (master) di `backlog.md`, level 1, dengan dependensi `FND-003` (autentikasi dan peran).

Pelanggan adalah pihak luar dan tidak punya akun (`D-23`, `D-33`). Pelanggan tidak punya portal.

## Kenapa ini item pertama di siklus

`PD-002` (pesanan) memerlukan termin dan batas kredit pelanggan. Tanpa master ini, validasi kredit tidak punya angka pembanding.

## Alternatif yang dipertimbangkan

| Alternatif | Kenapa belum dipilih |
|---|---|
| Termin hanya di pesanan, tanpa default di pelanggan | Bertentangan dengan `D-14` (default 30 hari pada pelanggan, override per dokumen). |
| Batas kredit dihitung dari riwayat pembayaran | Tidak disebut di sumber mana pun. Di luar cakupan. |

## Keputusan yang diambil (terkunci, dirujuk dari sumber)

| ID | Keputusan | Sumber |
|---|---|---|
| `D-14` | Termin pelanggan: default 30 hari; override per pesanan/faktur. | `decisions.md` |
| `D-16` | Batas kredit: blokir + override. Exposure = piutang + pesanan terbuka. Default 0 = tunai. | `decisions.md` |
| `D-23` | Portal pelanggan di luar cakupan; pelanggan tidak punya akun. | `decisions.md` |
| `D-25` | Modul tidak membaca tabel modul lain; data lintas siklus lewat service core. | `decisions.md` |
| `D-31` | Tabel `pelanggan` dimiliki `core/`; modul memiliki layar dan aturan alurnya. | `decisions.md` |
| `D-33` | Izin "Buat / ubah pelanggan" = Penjualan. | `policies/matriks-izin.md` |
| `D-48` | Pemohon tidak boleh menyetujui dokumen miliknya; alasan wajib saat menolak atau membatalkan. | `decisions.md` |
| `D-50` | Master dinonaktifkan, bukan dihapus; master nonaktif tidak bisa dipilih untuk dokumen baru; dokumen terbuka tetap berjalan. | `decisions.md` |

## Pertanyaan (status akhir)

Tidak ada pertanyaan terbuka. Semua butir sudah dijawab dengan keputusan terkunci atau `[USULAN-AGEN]` (menunggu dikunci koordinator).

| ID | Pertanyaan | Kenapa penting | Status |
|---|---|---|---|
| `PQ-01` | Tabel `pelanggan` milik modul Pendapatan atau milik core? | Lokasi migrasi dan kepemilikan tabel (`ARCH-08`). | Terjawab — D-31: tabel `pelanggan` dimiliki `core/`; modul memiliki layar dan aturan alurnya. |
| `PQ-02` | Siapa yang mengatur batas kredit dan menonaktifkan pelanggan? | Izin di UI dan pemeriksaan server (`BOUNDARY-02`). | Terjawab — [USULAN-AGEN]: batas kredit diubah oleh Manajemen; nama, kontak, termin, dan status aktif diubah oleh Penjualan (D-33). Alasan: keputusan kredit ada di Manajemen (D-16), dan Penjualan tidak menetapkan batasnya sendiri (D-48). |
| `PQ-03` | Apa yang terjadi pada pesanan dan faktur terbuka saat pelanggan dinonaktifkan? | Menentukan validasi di PD-002 dan PD-005. | Terjawab — D-50: master nonaktif tidak bisa dipilih untuk dokumen baru; dokumen terbuka tetap berjalan sampai selesai. |
| `PQ-04` | Data pelanggan apa yang wajib untuk faktur pajak (NPWP, alamat)? | Field wajib memengaruhi PD-005. | Terjawab — [USULAN-AGEN]: NPWP dan alamat nullable, tanpa validasi format; nomor faktur pajak tetap diisi manual di faktur (D-51(a)). Alasan: NPWP tidak ada di sumber, dan kewajiban pengisian tidak perlu memblokir master. |
| `PQ-05` | Apakah ada kunci unik pelanggan untuk mencegah pelanggan ganda? | Pencegahan duplikasi. | Terjawab — sumber makalah (`SIKLUS_PENDAPATAN_SIA.txt`, tabel pelanggan): `kode_pelanggan` unik. NPWP tidak dijadikan kunci (lihat `PQ-04`). |
| `PQ-06` | Apakah nama dan kontak pelanggan dianggap data pribadi yang perlu aturan visibilitas? | Menentukan apakah syarat bersyarat "Menyentuh data pribadi" di DoR berlaku. | Terjawab — [USULAN-AGEN]: telepon, email, dan alamat diperlakukan sebagai data pribadi tingkat dasar; hanya peran yang membuka pesanan atau faktur (Penjualan, Accounting, Manajemen) yang dapat membacanya; tidak diekspor di versi awal. Alasan: kontak orang perorangan perlu batas visibilitas minimal. |
| `PQ-07` | Apakah batas kredit 0 berarti pesanan ditahan atau pembayaran dimuka? | Perilaku default harus diketahui sebelum menulis aturan. | Terjawab — D-16: default 0 = tunai; pesanan yang melampaui batas ditahan di `MENUNGGU_PERSETUJUAN_KREDIT` sampai override. Pembayaran dimuka tidak dikenal. |

## Asumsi (agent-proposed)

- `[USULAN]` Termin pelanggan dinyatakan sebagai jumlah hari, bukan tanggal jatuh tempo. Tanggal dihitung di dokumen (PD-002 dan PD-005).
- `[USULAN]` Nonaktifkan pelanggan tidak menghapus data (`D-50`, `analisis-sia.md` §7.1 prinsip 3).

## Alternatif yang ditolak

- Menyimpan `batas_kredit` sebagai angka tanpa riwayat perubahan. Jejak perubahan master belum disebut sumber; keputusan ini tidak membuka aturan baru, sehingga riwayat master tetap di luar cakupan v0.

## Langkah berikutnya

Tidak ada pertanyaan terbuka. Item hanya menunggu dependensi `FND-003` dan gate fondasi `FND-001`–`FND-006` berstatus `done` (lihat `03-readiness-review.md`).
