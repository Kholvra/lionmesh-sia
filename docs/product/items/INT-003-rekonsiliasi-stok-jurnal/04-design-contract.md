# Design Contract: INT-003 — Rekonsiliasi stok, jurnal, dan laporan

- Source: `docs/product/items/INT-003-rekonsiliasi-stok-jurnal/01-requirement.md` (`INT-003`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-08`)
- Status: `Proposed` — belum diverifikasi; semua aturan `Unverified`
- Profile: product app — persediaan dan jurnal (stok dan uang)
- Scope: pembandingan qty mutasi, saldo, nilai, jurnal persediaan, dan stok fisik
- Owner: tech lead (PT-08, `[USULAN-AGEN]`)
- Keputusan yang dipakai: `D-06`, `D-07`, `D-10`, `D-36`, `D-41`, `D-43`, `D-44` (1), `D-50`, `D-52`

## Intent and non-goals

**Intent.** Stok dan nilai persediaan dapat dipercaya karena ada pemeriksaan yang menunjuk selisih, bukan menyembunyikannya.

**Non-goals.** Penyesuaian otomatis, stock opname (`FND-005`), GR/IR dan aturan penerimaan (`C-013`), pemeriksaan jurnal gabungan (`INT-001`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | `mutasi_stok`, `saldo_stok` → pemeriksa | qty dan nilai | pembacaan saja | angka dari baris | tolak bila akun persediaan belum ada (D-41) |
| `B-02` | Neraca (`C-009`) → pemeriksa | total akun persediaan | pembacaan lewat core | angka neraca | gagal bila tidak cocok |
| `B-03` | Stok fisik (hasil stock opname, `D-52`) → pemeriksa | hasil stock opname | validasi jumlah dan produk | angka fisik | tolak bila tidak ada produk yang cocok |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | rekonsiliasi dijalankan | data uji dari reset + seed (`D-30`) | penguji | tolak jalan |
| `PRE-02` | rekonsiliasi nilai dijalankan | akun persediaan 120, 121, 122 ditetapkan (D-41) | core | tolak; sebut akun |
| `PRE-03` | rekonsiliasi dijalankan | `INT-001` dan `C-009` sudah lulus | penguji | tolak jalan |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | daftar selisih lengkap; lulus bila kosong | `mutasi_stok`, `saldo_stok`, jurnal | — |
| `POST-02` | nilai neraca persediaan dibandingkan dengan `saldo_stok` | — | — |
| `POST-03` | dua run identik | — | — |
| `POST-04` | toleransi nol: selisih satu satuan terkecil tampil (PT-03, `[USULAN-AGEN]`) | — | — |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | core inventory | qty `saldo_stok` = jumlah `mutasi_stok` (`INV-03` ARCH-001) | qty saldo tidak sama dengan mutasi |
| `INV-02` | core inventory | `nilai = qty × harga_rata` (`INV-02` ARCH-001) | nilai dan qty dari sumber berbeda |
| `INV-03` | core inventory | rekonsiliasi tidak menulis saldo atau mutasi | perubahan saldo oleh pemeriksa |
| `INV-04` | core ledger | nilai neraca persediaan = total `saldo_stok.nilai` (gate `EPIC-INT` nomor 3) | selisih tidak tampil |
| `INV-05` | core inventory | saldo negatif tampil sebagai selisih; pemeriksa tidak memperbaikinya (PT-07, `[USULAN-AGEN]`) | saldo negatif tersembunyi |
| `INV-06` | core inventory | rekonsiliasi tidak membuat mutasi penyesuaian (PT-02, `[USULAN-AGEN]`) | mutasi penyesuaian dibuat oleh pemeriksa |

Tidak ada state machine.

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Selisih ditemukan | tampilkan selisih per produk dan gudang; tidak memblokir transaksi (PT-02, `[USULAN-AGEN]`) | telusuri ke mutasi atau jurnal sumber |
| Akun persediaan belum ada | tolak jalan; sebut akun | tetapkan akun (PT-04) |
| Stok fisik tidak ada produk yang cocok | tolak baris; sebut produk | perbaiki data stock opname |

## Architecture boundaries

- Pemeriksaan membaca saldo lewat `core/inventory` dan jurnal lewat `core/ledger` (`D-06`, `D-07`).
- Pemeriksaan tidak menulis saldo atau jurnal (`INV-03`).
- Pemeriksaan lintas siklus lewat core (`D-25`, `ARCH-08`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | data uji dari reset + seed | perintah | `05-evidence.md` AC-06 | `Unverified` |
| `PRE-02` | akun belum ada → rekonsiliasi menolak | uji perilaku | `05-evidence.md` AC-08 | `Unverified` |
| `PRE-03` | prasyarat dari `INT-001` dan `C-009` | catatan | `05-evidence.md` AC-03 | `Unverified` |
| `POST-01` | daftar selisih sesuai | uji fixture | `05-evidence.md` AC-04 | `Unverified` |
| `POST-02` | nilai neraca = total saldo | pembanding | `05-evidence.md` AC-03 | `Unverified` |
| `POST-03` | dua run identik | pembanding | `05-evidence.md` AC-06 | `Unverified` |
| `INV-01` | qty saldo = mutasi | perintah SQL | `05-evidence.md` AC-01 | `Unverified` |
| `INV-02` | nilai = qty × harga_rata | perintah SQL | `05-evidence.md` AC-02 | `Unverified` |
| `INV-03` | tidak ada tulisan | perintah hitung baris | `05-evidence.md` AC-05 | `Unverified` |
| `INV-04` | neraca cocok dengan saldo | pembanding | `05-evidence.md` AC-03 | `Unverified` |
| `POST-04` | toleransi nol | uji fixture | `05-evidence.md` AC-11 | `Unverified` |
| `INV-05` | saldo negatif tampil | uji fixture | `05-evidence.md` AC-09 | `Unverified` |
| `INV-06` | tidak ada mutasi penyesuaian dari pemeriksa | perintah hitung baris | `05-evidence.md` AC-07 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Stok fisik dari stock opname (PT-01) | `Terjawab — D-52` | pemeriksaan tidak mencakup stok fisik |
| Keluaran dan selisih (PT-02) | `Proposed` `[USULAN-AGEN]` | selisih disembunyikan atau memblokir transaksi |
| Toleransi nol (PT-03) | `Proposed` `[USULAN-AGEN]` | selisih pembulatan dianggap error atau sebaliknya |
| Waktu rekonsiliasi (PT-05) | `Proposed` `[USULAN-AGEN]` (saat diminta; langkah `INT-002`) | selisih terlambat terlihat |
| Stok negatif (PT-07) | `Proposed` `[USULAN-AGEN]` (diperiksa di sini, ditegakkan di `FND-005`) | saldo negatif lolos tanpa tampil |
| Akun persediaan (PT-04) | `Terjawab — D-41` | — |
| Valuasi rata-rata bergerak (D-10, catatan konfirmasi FIFO) | `Locked` (D-10); konfirmasi belum ditutup | nilai persediaan memakai metode yang salah jika D-10 berubah |
| Rekonsiliasi hanya membaca (`[USULAN]`) | `Proposed` | selisih disembunyikan lewat penyesuaian |
