# Design Contract: PR-005 — Hasil produksi dan QC

- Source: `docs/product/items/PR-005-hasil-produksi-dan-qc/01-requirement.md` (`PR-005`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-14`)
- Status: `Proposed` — belum diverifikasi. Semua aturan `Unverified`
- Profile: product app / modul internal Next.js + Supabase
- Scope: hasil per WO, keputusan QC, reject dan toleransi, rework, penerimaan barang jadi, jurnal barang jadi dan kerugian
- Owner: track PR-C (perilaku), tech lead (batas core), Accounting (akun dan nilai)

## Intent and non-goals

**Intent.** Setiap unit hasil punya satu keputusan QC yang tidak bisa diubah diam-diam, dan setiap reject punya perlakuan yang jelas: diserap atau menjadi kerugian.

**Non-goals.** Pembebanan TKL dan overhead, HPP final (`PR-006`), retur produk jadi (`D-13`), dan penjualan.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server action | Jumlah diproses, keputusan QC (L, R, J), penerimaan | Parse dan validasi di server | Nilai bertipe | Tolak dengan pesan |
| `B-02` | Sesi → identitas aktor | Cookie sesi | Ambil dari sesi | `actor_id` dan peran | Tolak tanpa sesi; jangan terima `actor_id` dari klien |
| `B-03` | Core inventory dan ledger → database | Mutasi, saldo, jurnal | Constraint, RLS, transaksi | Baris dalam satu transaksi | Batalkan seluruh transaksi |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Mencatat hasil | WO berstatus `BERJALAN` atau `REWORK` (`D-46` §5.3); konfirmasi pemakaian lengkap (`PR-004`) | Service PR-005 | Tolak |
| `PRE-02` | Keputusan QC | Aktor berperan QC (`D-33`) dan bukan pencatat hasil yang sama (`D-48`) | Service PR-005 | Tolak sebelum menyentuh data |
| `PRE-03` | Penerimaan barang jadi | Qty ≤ L yang belum diterima; WO `QC_PASSED` | Service PR-005 | Tolak; pesan menyebut status atau jumlah |
| `PRE-04` | Keputusan QC | L + R + J = jumlah diproses; masing-masing ≥ 0 | Service PR-005 | Tolak; pesan menyebut selisih |
| `PRE-05` | Mutasi barang jadi | Tanggal tidak mendahului mutasi terakhir (`ARCH-001` `PRE-03`) | Core inventory | Tolak |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Hasil tercatat dengan L, R, J; riwayat status | Jumlah diproses | Baris hasil, riwayat |
| `POST-02` | Penerimaan barang jadi menambah saldo barang jadi dan memindahkan nilai dari WIP dalam satu transaksi | Total nilai WIP + barang jadi | Mutasi masuk; jurnal `persediaan_barang_jadi` / `barang_dalam_proses` |
| `POST-03` | WO berstatus `SELESAI` setelah seluruh L diterima | Riwayat | Baris riwayat |
| `POST-04` | Kerugian produksi abnormal dibukukan untuk reject di atas batas toleransi, atau seluruh saldo WIP bila `L = 0` dan `R = 0` | Total reject | Jurnal `kerugian_produksi_abnormal` / `barang_dalam_proses` |
| `POST-05` | Nilai per unit baik ditetapkan sekali saat `QC_PASSED` | Nilai per unit | Tidak ada |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Service PR-005 | Reject ≤ toleransi diserap ke barang baik; di atasnya kerugian (`D-13`, `D-51`(e)) | Reject di atas toleransi hilang tanpa catatan |
| `INV-02` | Service PR-005 | L + R + J = jumlah diproses | Jumlah tidak cocok tersimpan |
| `INV-03` | Core inventory | Saldo sama dengan jumlah mutasi (`ARCH-001` `INV-03`) | Saldo barang jadi dihitung ulang dengan rumus lain |
| `INV-04` | Core ledger | Jurnal balance; hanya lewat `postJournal()` (`D-07`, `ARCH-001` `INV-01`) | Jurnal tidak balance |
| `INV-05` | Service PR-005 | Barang yang belum lulus QC atau berstatus `REWORK` tidak masuk saldo | Barang rework atau belum diputuskan masuk saldo |
| `INV-06` | Service PR-005 | Keputusan QC tidak diubah; koreksi lewat dokumen baru (`D-48`) | Keputusan diedit diam-diam |
| `INV-07` | Service PR-005 | Jumlah diterima kumulatif ≤ L (`[USULAN-AGEN]`) | Penerimaan melebihi lulus |

State table (`D-46` §5.3; aturan keputusan `[USULAN-AGEN]`):

| State | Arti | Transisi legal |
|---|---|---|
| `HASIL_DICATAT` | Hasil dicatat | → `QC_PASSED` (R = 0, L > 0); → `REWORK` (R > 0); → `REJECTED` (L = 0, R = 0) |
| `REWORK` | Perlu perbaikan | → `HASIL_DICATAT` (hasil ulang dicatat) |
| `QC_PASSED` | Lulus, boleh diterima sebagian | → `SELESAI` (seluruh L diterima) |
| `REJECTED` | Ditolak QC | terminal |
| `SELESAI` | Barang jadi diterima seluruhnya | terminal |

## Rumus

- Kerugian produksi abnormal = max(0, J kumulatif − p% × D) × biaya terserap per unit. Biaya terserap per unit = total biaya WO yang sudah dibebankan ÷ D. Nilai `p%` dari BOM (`D-51`(e)).
- Nilai per unit baik = (nilai WIP WO saat `QC_PASSED` − kerugian) ÷ L.
- Nilai penerimaan = qty diterima × nilai per unit baik.

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Penerimaan gagal di tengah | Saldo, WIP, dan status tidak berubah sebagian | Ulangi |
| Jurnal gagal | Mutasi dan jurnal dibatalkan bersama | Ulangi |
| Keputusan QC diubah setelah penerimaan | Ditolak; koreksi lewat dokumen baru (`INV-06`) | Dokumen koreksi |
| Nilai WIP belum tersedia saat `QC_PASSED` | Keputusan tidak diterapkan; tidak ada angka parsial | Tunggu sumber; ulangi |

## Architecture boundaries

Mutasi hanya lewat `core/inventory` (`ARCH-04`). Jurnal hanya lewat `core/ledger` (`ARCH-03`, `D-07`). Modul tidak membaca tabel modul lain (`ARCH-08`). Nilai WIP per WO berasal dari modul Produksi melalui service (lihat `03-readiness-review.md` Risiko).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | Status tidak diizinkan ditolak | Uji perilaku | `05-evidence.md` AC-01 | `Unverified` |
| `PRE-02` | Peran selain QC ditolak; pencatat tidak memeriksa sendiri | Uji perilaku | `05-evidence.md` AC-03 | `Unverified` |
| `PRE-03` | Barang belum lulus dan melebihi L ditolak | Uji perilaku | `05-evidence.md` AC-08, AC-10 | `Unverified` |
| `PRE-04` | Jumlah tidak cocok ditolak | Uji perilaku | `05-evidence.md` AC-02 | `Unverified` |
| `PRE-05` | Backdate ditolak | Uji perilaku | `05-evidence.md` AC-14 | `Unverified` |
| `POST-01` | Hasil tercatat lengkap | Uji perilaku | `05-evidence.md` AC-01 | `Unverified` |
| `POST-02` | Saldo naik dan WIP turun sama besarnya | Uji database | `05-evidence.md` AC-07 | `Unverified` |
| `POST-03` | WO `SELESAI` setelah seluruh L diterima | Uji perilaku | `05-evidence.md` AC-07 | `Unverified` |
| `POST-04` | Kerugian dibukukan untuk reject di atas batas dan untuk `REJECTED` | Uji perilaku | `05-evidence.md` AC-06, AC-12 | `Unverified` |
| `POST-05` | Nilai per unit tetap sepanjang penerimaan | Uji perilaku | `05-evidence.md` AC-07 | `Unverified` |
| `B-01` | Input tidak valid tidak diproses | Uji perilaku | `05-evidence.md` AC-04 | `Unverified` |
| `B-02` | `actor_id` dari klien diabaikan | Uji perilaku | `05-evidence.md` AC-03 | `Unverified` |
| `B-03` | Kegagalan membatalkan seluruh transaksi | Uji database | `05-evidence.md` AC-07 | `Unverified` |
| `INV-01` | Reject di bawah batas diserap; di atasnya kerugian | Uji perilaku | `05-evidence.md` AC-05, AC-06 | `Unverified` |
| `INV-02` | Jumlah cocok | Uji perilaku | `05-evidence.md` AC-02 | `Unverified` |
| `INV-03` | Saldo = mutasi | Uji inventory | `05-evidence.md` AC-07 | `Unverified` |
| `INV-04` | Jurnal balance dan hanya lewat `postJournal()` | Uji `postJournal()` | `05-evidence.md` AC-13 | `Unverified` |
| `INV-05` | Barang belum lulus tidak masuk saldo | Uji perilaku | `05-evidence.md` AC-08, AC-11 | `Unverified` |
| `INV-06` | Keputusan QC tidak diedit diam-diam | Uji perilaku | `05-evidence.md` AC-09 | `Unverified` |
| `INV-07` | Penerimaan tidak melebihi L | Uji perilaku | `05-evidence.md` AC-10 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Basis toleransi reject (Q-01) | `Locked` — `D-51`(e) | Batas kerugian salah bila basis salah |
| Perlakuan fisik reject (Q-02) | `Proposed` — `[USULAN-AGEN]` | Stok dan nilai salah bila reject punya nilai jual |
| Akun kerugian (Q-03) | `Locked` untuk peran (`D-41`); nomor saat `FND-006` | Jurnal kerugian tidak bisa dibuat |
| Rework dengan bahan tambahan (Q-04) | `Proposed` — `[USULAN-AGEN]`; status `Locked` (`D-46`) | Mutasi rework salah |
| Pembagian L/R/J dan status (Q-05) | `Proposed` — `[USULAN-AGEN]`; tiga status `Locked` | Layar QC menawarkan pilihan yang salah |
| Jurnal barang jadi (Q-06) | `Proposed` — `[USULAN-AGEN]`; akun `Locked` (`D-41`) | Bentuk laporan keuangan |
| Nilai per unit baik (Q-07) | `Proposed` — `[USULAN-AGEN]` | HPP sementara salah |
| Penegakan `INV-01` di database atau service | `Proposed` | Menentukan tingkat jaminan |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| Retur produk jadi | `D-13`: retur hanya untuk bahan |
| Status "sebagian lolos" | Tidak ada di `D-46`; diselesaikan lewat pembagian L/R/J |
| Loop/termination | Tidak ada algoritma berulang |
