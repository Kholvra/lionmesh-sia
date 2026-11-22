# Design Contract: PG-007 — QC bahan dan retur ke pemasok

- Source: `docs/product/items/PG-007-qc-bahan-dan-retur-pemasok/01-requirement.md` (`PG-007`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-18`)
- Status: `Proposed` — belum diverifikasi; seluruh aturan `Unverified`
- Profile: product app (aplikasi web internal)
- Scope: hasil QC bahan, mutasi masuk stok, jurnal QC lulus, retur ke pemasok
- Owner: tech lead (desain); keputusan produk dipegang pengguna (D-xx) atau koordinator (`[USULAN-AGEN]`)
- Kewajiban: item menyentuh uang, stok, dan status dokumen, sehingga kontrak wajib

## Intent and non-goals

**Intent.** Stok bahan hanya bertambah untuk barang yang lulus QC, dan setiap pertambahan punya jurnal yang balance dalam transaksi yang sama. Retur tidak mengubah stok, jurnal, atau utang.

**Non-goals.** Penerimaan (`PG-006`), pengakuan utang (`PG-008`), pembayaran (`PG-009`), rekonsiliasi (`PG-010`), rework dan reject produksi (`PR-005`), nota kredit pemasok, struktur folder dan tabel.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server action | Qty lulus, qty gagal, referensi baris, referensi penerimaan untuk retur, alasan | Parse dan validasi skema di server | Nilai tervalidasi bertipe | Tolak dengan pesan terbaca |
| `B-02` | Sesi → identitas aktor | Cookie sesi | Ambil dari sesi | `actor_id` dan peran tepercaya | Tolak bila tidak ada sesi; abaikan `actor_id` dari klien |
| `B-03` | Server → service core inventory dan ledger | Mutasi dan jurnal yang dihasilkan | Core memeriksa saldo, akun, periode, dan keseimbangan | Transaksi tervalidasi | Core membatalkan seluruh transaksi |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | QC dicatat | Baris penerimaan berstatus `DITERIMA` dan belum final | Core pengadaan | Tolak; pesan menyebut status |
| `PRE-02` | QC dicatat | Qty lulus + qty gagal = qty diterima untuk baris (R-01) | Core pengadaan | Tolak; pesan menyebut baris |
| `PRE-03` | QC lulus diposting | Akun 120 dan 202 aktif di konfigurasi (D-41) | Core ledger | Tolak; tidak ada baris tersimpan |
| `PRE-04` | QC lulus diposting | Tanggal posting tidak berada di periode terkunci (FND-006, D-43) | Core ledger | Tolak; pesan menyebut periode terkunci |
| `PRE-05` | Retur dibuat | Referensi baris penerimaan ada dan punya qty gagal; qty retur tidak melebihi qty gagal yang belum diretur (D-49, R-05) | Core pengadaan | Tolak; pesan menyebut qty tersedia |
| `PRE-06` | Retur disetujui | Aktor berperan Accounting dan bukan pengaju retur (D-48, R-09) | Core pengadaan | Tolak; pesan menyebut peran |
| `PRE-07` | Retur dibatalkan | Status `DIAJUKAN`; alasan terisi (D-48, R-05) | Core pengadaan | Tolak; pesan menyebut status atau alasan |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | QC lulus: mutasi masuk untuk qty lulus, `saldo_stok` diperbarui dengan rata-rata bergerak, dan jurnal Dr 120 / Cr 202 senilai qty lulus × harga PO dibuat, dalam satu transaksi (R-03) | Qty dan nilai saldo konsisten | Mutasi, saldo, jurnal, riwayat |
| `POST-02` | QC gagal: tidak ada mutasi masuk, tidak ada jurnal, dan tidak ada perubahan `saldo_stok` | Saldo stok dan jurnal | Barang gagal tercatat terpisah (R-04) |
| `POST-03` | Setiap perubahan status baris QC dan dokumen retur punya baris riwayat | Riwayat lama | Baris riwayat |
| `POST-04` | Retur disetujui: status `DISETUJUI`, tanpa mutasi, tanpa jurnal, dan tanpa perubahan utang (R-06) | Saldo stok, jurnal, utang | Status dan riwayat |
| `POST-05` | Lokasi pemisahan barang gagal tersimpan sebagai teks pada baris QC gagal (R-04) | Mutasi | Teks pada baris |
| `POST-06` | Tidak ada beban atau jurnal untuk barang gagal bahan (R-07) | Beban dan jurnal | Tidak ada |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core ledger | Setiap jurnal QC lulus: total debit = total kredit (`ARCH-001` INV-01) | Jurnal tidak balance tersimpan |
| `INV-02` | Core inventory | Nilai `saldo_stok` = qty × harga rata-rata (`ARCH-001` INV-02) | Nilai dan qty dari sumber berbeda |
| `INV-03` | Core inventory | Qty `saldo_stok` = jumlah mutasi untuk produk dan gudang (`ARCH-001` INV-03) | Saldo dihitung dengan rumus lain |
| `INV-04` | Core pengadaan | Jumlah qty lulus per baris tidak melebihi qty diterima | Stok masuk lebih besar dari barang diterima |
| `INV-05` | Core pengadaan | Satu baris QC final hanya sekali; mutasi masuk per baris hanya sekali | Stok masuk dua kali untuk QC yang sama |
| `INV-06` | Core ledger | Jurnal QC lulus hanya lewat `postJournal()` (D-07, `ARCH-001` ARCH-03) | Modul menulis jurnal langsung |
| `INV-07` | Core pengadaan | Jumlah retur per baris (termasuk yang diajukan dan disetujui) tidak melebihi qty gagal baris (D-49) | Retur melebihi barang gagal |
| `INV-08` | Core inventory | Retur tidak menghasilkan mutasi apa pun (R-06) | Mutasi keluar akibat retur |

Status (D-46, D-48, D-49):

| State | Objek | Arti | Transisi legal |
|---|---|---|---|
| `DITERIMA` | baris penerimaan | menunggu QC | ke `QC_LULUS` atau `QC_GAGAL` |
| `QC_LULUS` | baris penerimaan | qty lulus sudah masuk stok | tidak ada |
| `QC_GAGAL` | baris penerimaan | qty gagal dipisahkan, tidak masuk stok | ke retur (R-05) |
| `DIAJUKAN` | dokumen retur | diajukan Purchasing | ke `DISETUJUI`, `DITOLAK`, atau `DIBATALKAN` |
| `DISETUJUI` | dokumen retur | disetujui Accounting | tidak ada (versi awal) |
| `DITOLAK` | dokumen retur | ditolak Accounting dengan alasan | tidak ada |
| `DIBATALKAN` | dokumen retur | dibatalkan sebelum disetujui dengan alasan | tidak ada |

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Mutasi berhasil, jurnal gagal | Seluruh transaksi dibatalkan; saldo tidak berubah | Perbaiki akun atau periode, catat QC ulang |
| Jurnal berhasil, mutasi gagal | Seluruh transaksi dibatalkan | Sama seperti di atas |
| Dua QC bersamaan untuk baris sama | Satu ditolak | Pengguna memuat ulang dan melihat hasil yang ada |
| Akun belum aktif | QC lulus ditolak sebelum menyentuh data | Aktifkan akun di konfigurasi lalu ulangi |
| Dua retur bersamaan melebihi qty gagal | Salah satu ditolak (lock per baris) | Pengguna memuat ulang |

## Architecture boundaries

- Mutasi stok hanya lewat `core/inventory` (`ARCH-001` ARCH-04, D-06).
- Jurnal hanya lewat `core/ledger` (`ARCH-001` ARCH-03, D-07).
- Data penerimaan dan retur di `core/pengadaan` (D-05, ARCH-06).
- Layar QC dan retur di modul Pengeluaran dan hanya memanggil service core (D-04, D-25).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Input tidak valid ditolak | Uji perilaku | `05-evidence.md` AC-05, AC-14 | `Unverified` |
| `B-02` | `actor_id` dari klien diabaikan | Uji perilaku | — | `Unverified` |
| `B-03` | Kegagalan jurnal membatalkan mutasi | Uji transaksi | `05-evidence.md` AC-03 | `Unverified` |
| `PRE-01` | QC pada status salah ditolak | Uji perilaku | `05-evidence.md` AC-06 | `Unverified` |
| `PRE-02` | Jumlah tidak cocok ditolak | Uji perilaku | `05-evidence.md` AC-05 | `Unverified` |
| `PRE-03` | Akun tidak aktif menolak posting | Uji service | `05-evidence.md` AC-03 | `Unverified` |
| `PRE-04` | Periode terkunci menolak posting | Uji service | `05-evidence.md` AC-11 | `Unverified` |
| `PRE-05` | Retur melebihi qty gagal ditolak | Uji perilaku | `05-evidence.md` AC-08, AC-14 | `Unverified` |
| `PRE-06` | Retur oleh pengaju atau selain Accounting ditolak | Uji perilaku | `05-evidence.md` AC-15 | `Unverified` |
| `PRE-07` | Pembatalan retur setelah disetujui ditolak | Uji perilaku | `05-evidence.md` AC-16 | `Unverified` |
| `POST-01` | Mutasi, saldo, dan jurnal berubah bersama | Uji transaksi + perbandingan | `05-evidence.md` AC-01, AC-02, AC-13 | `Unverified` |
| `POST-02` | QC gagal tidak mengubah saldo dan jurnal | Uji perbandingan | `05-evidence.md` AC-04, AC-17 | `Unverified` |
| `POST-03` | Riwayat tercatat untuk setiap transisi | Uji perilaku | `05-evidence.md` AC-01, AC-09 | `Unverified` |
| `POST-04` | Retur disetujui tanpa efek stok, jurnal, atau utang | Uji perbandingan | `05-evidence.md` AC-09 | `Unverified` |
| `POST-05` | Lokasi pemisahan tersimpan tanpa mutasi | Uji perilaku | `05-evidence.md` AC-18 | `Unverified` |
| `POST-06` | Tidak ada beban atau jurnal barang gagal | Uji perbandingan | `05-evidence.md` AC-04 | `Unverified` |
| `INV-01` | Jurnal tidak balance tidak tersimpan | Uji `postJournal()` | `05-evidence.md` AC-02 | `Unverified` |
| `INV-02` | Nilai = qty × harga rata-rata | Uji inventory | `05-evidence.md` AC-13 | `Unverified` |
| `INV-03` | Qty saldo = jumlah mutasi | Uji inventory | `05-evidence.md` AC-01 | `Unverified` |
| `INV-04` | Qty lulus tidak melebihi qty diterima | Uji service | `05-evidence.md` AC-05 | `Unverified` |
| `INV-05` | QC kedua untuk baris sama ditolak | Uji concurrency | `05-evidence.md` AC-07, AC-10 | `Unverified` |
| `INV-06` | Tidak ada penulisan jurnal di luar core | Pencarian kode + review | — | `Unverified` |
| `INV-07` | Retur melebihi qty gagal tidak tersimpan | Uji concurrency | `05-evidence.md` AC-08 | `Unverified` |
| `INV-08` | Retur tidak membuat mutasi | Uji perbandingan | `05-evidence.md` AC-09 | `Unverified` |

Tidak ada aturan yang berstatus `PASS`.

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Status rework bahan (Q-01) | Dijawab sumber (diterima atau ditolak saja) | Daftar status dan `PRE-01` |
| Lokasi barang gagal (Q-02) | Dijawab [USULAN-AGEN]: teks pada baris, tanpa mutasi | `POST-05` |
| QC sebagian (Q-03) | Dijawab [USULAN-AGEN]: per baris | `PRE-02` dan `INV-04` |
| Bentuk retur (Q-04) | Dijawab D-49; status retur [USULAN-AGEN] | `PRE-05`, `PRE-06`, `POST-04` |
| Efek retur ke stok (Q-05) | Dijawab D-36 | `INV-08` |
| Efek retur ke utang dan jurnal (Q-06) | Dijawab [USULAN-AGEN]: tidak ada jurnal atau perubahan utang | `POST-04`; kontrak PG-008 (qty pembanding = qty lulus) |
| Akun jurnal (Q-07) | Dijawab D-41/D-44 | `PRE-03` dan `POST-01` |
| Sumber harga satuan (Q-08) | Dijawab D-44 (harga PO) | Nilai di `POST-01` |
| Biaya barang gagal (Q-09) | Dijawab [USULAN-AGEN]: tidak ada beban | `POST-06` |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| Rework dan reject produksi | Milik `PR-005` (G6) |
| Pengakuan utang | Milik `PG-008` |
| Nota kredit pemasok atas retur | Tidak ada di sumber; di luar versi awal |
| Mutasi keluar untuk retur | Barang gagal tidak pernah masuk saldo (D-36) |
| Loop/termination | Tidak ada algoritma berulang |
| Batas modul | Milik `ARCH-001` |
