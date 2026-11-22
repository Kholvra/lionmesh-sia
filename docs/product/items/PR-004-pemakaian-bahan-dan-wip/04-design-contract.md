# Design Contract: PR-004 — Pemakaian bahan dan WIP

- Source: `docs/product/items/PR-004-pemakaian-bahan-dan-wip/01-requirement.md` (`PR-004`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-14`)
- Status: `Proposed` — belum diverifikasi. Semua aturan `Unverified`
- Profile: product app / modul internal Next.js + Supabase
- Scope: mutasi keluar bahan per WO, sisa kembali, konfirmasi pemakaian, saldo bahan, nilai WIP bahan, selisih
- Owner: track PR-B (perilaku), tech lead (batas core), Accounting (akun dan nilai)

## Intent and non-goals

**Intent.** Setiap bahan yang keluar dari gudang tercatat di saldo dan di WIP WO dalam satu transaksi, sehingga stok dan nilai selalu sesuai.

**Non-goals.** TKL dan overhead (`PR-006`), HPP, scrap bernilai jual, dan transfer antar gudang.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server action | Qty keluar, konfirmasi (terpakai, sisa, scrap), WO, tanggal | Parse dan validasi di server | Nilai bertipe, tanggal tervalidasi | Tolak dengan pesan |
| `B-02` | Sesi → identitas aktor | Cookie sesi | Ambil dari sesi | `actor_id` dan peran | Tolak tanpa sesi |
| `B-03` | Core inventory → database | Mutasi dan `saldo_stok` | Constraint, RLS, transaksi | Saldo dan mutasi dalam satu transaksi | Batalkan seluruh transaksi |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Mutasi keluar | Produk (bahan) dan gudang ada | Core inventory | Tolak |
| `PRE-02` | Mutasi keluar | Qty > 0; stok cukup (tidak boleh negatif) | Core inventory | Tolak; pesan menyebut alasan |
| `PRE-03` | Mutasi | Tanggal tidak mendahului mutasi terakhir (`ARCH-001` `PRE-03`, `D-10`) | Core inventory | Tolak; pesan menyebut tanggal |
| `PRE-04` | Mutasi keluar untuk WO | Status WO `BAHAN_CUKUP`, `BAHAN_SIAP`, atau `REWORK` (`D-46` §5.3) | Service PR-004 | Tolak; pesan menyebut status |
| `PRE-05` | Mencatat keluar atau konfirmasi | Aktor berperan Gudang (keluar) atau Produksi (konfirmasi) (`D-33`) | Service PR-004 | Tolak sebelum menyentuh data |
| `PRE-06` | Konfirmasi | Terpakai + sisa + scrap = qty keluar belum dikonfirmasi; sisa ≤ belum dikonfirmasi | Service PR-004 | Tolak; pesan sesuai `01-requirement.md` |
| `PRE-07` | Berpindah ke `BERJALAN` | Pemakaian pertama adalah mutasi keluar pertama untuk WO | Service PR-004 | — |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | `saldo_stok` bahan turun sebesar qty keluar dalam transaksi yang sama dengan mutasi | `INV-02`, `INV-03` `ARCH-001` | Baris mutasi keluar |
| `POST-02` | Nilai WIP WO bertambah sebesar nilai keluar (qty × harga rata-rata saat keluar) lewat jurnal | Harga rata-rata | Jurnal `barang_dalam_proses` / `persediaan_bahan` |
| `POST-03` | WO berstatus `BERJALAN` pada pemakaian pertama, dengan baris riwayat | Riwayat lama | Baris riwayat |
| `POST-04` | Konfirmasi sisa menaikkan saldo dan memindahkan nilai sisa dari WIP ke persediaan pada harga keluar | Harga rata-rata bahan | Mutasi masuk, jurnal |
| `POST-05` | Konfirmasi scrap tidak mengubah saldo di luar qty yang sudah keluar; nilainya tetap di WIP | Saldo | Baris konfirmasi |
| `POST-06` | Kegagalan tidak meninggalkan mutasi tanpa saldo atau saldo tanpa mutasi, atau mutasi tanpa jurnal | Saldo, mutasi, jurnal | Tidak ada |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core inventory | Nilai saldo = qty × harga rata-rata (`INV-02` `ARCH-001`) | Nilai dihitung dari sumber berbeda |
| `INV-02` | Core inventory | Qty saldo = jumlah mutasi (`INV-03` `ARCH-001`) | Saldo dihitung ulang dengan rumus lain |
| `INV-03` | Core inventory | Stok tidak negatif | Mutasi keluar melebihi saldo |
| `INV-04` | Service PR-004 | Item ini tidak menulis `saldo_stok` atau `mutasi_stok` langsung (`ARCH-04`) | Tulis langsung dari modul |
| `INV-05` | Service PR-004 | Jumlah keluar = terpakai + sisa + scrap setelah konfirmasi lengkap; WO tidak masuk `HASIL_DICATAT` sebelumnya (`[USULAN-AGEN]`) | Hasil dicatat saat konfirmasi belum lengkap |
| `INV-06` | Core ledger | Jurnal balance; jurnal bahan dibuat hanya dari mutasi (`D-43`, `D-07`) | Jurnal tanpa mutasi atau sebaliknya |

State WO yang disentuh: `BERJALAN` (`D-46` §5.3). Transisi keluar dari `BERJALAN` ke `HASIL_DICATAT` diatur `PR-005`. Tidak ada jalur dari `BERJALAN` ke `DIBATALKAN` (`PR-002`).

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Mutasi gagal di tengah | Saldo, mutasi, dan jurnal tidak berubah sebagian (`POST-06`) | Ulangi |
| Jurnal gagal | Mutasi dan jurnal dibatalkan bersama | Ulangi |
| Nilai rata-rata tidak tersedia | Tolak; tidak ada mutasi dengan nilai nol | Tampilkan pesan |
| Koreksi setelah posting | Hanya lewat mutasi balik dan jurnal pembalik (`D-43`, `D-48`) | Dokumen koreksi baru |

## Jurnal yang dihasilkan

| Peran akun (`D-35`) | Arah | Sumber angka |
|---|---|---|
| `barang_dalam_proses` (WIP) | Debit saat keluar; kredit saat sisa kembali | qty × harga per unit |
| `persediaan_bahan` | Kredit saat keluar; debit saat sisa kembali | qty × harga per unit |

Nomor akun ada di konfigurasi (`D-41`); modul tidak menyimpan nomor.

## Architecture boundaries

Mutasi stok hanya lewat `core/inventory` (`ARCH-04`). Jurnal hanya lewat `core/ledger` (`D-07`, `ARCH-03`). Modul tidak membaca tabel modul lain (`ARCH-08`). Pembebanan TKL dan overhead adalah milik `PR-006`.

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | Bahan atau gudang tidak ada ditolak | Uji perilaku | — | `Unverified` |
| `PRE-02` | Qty nol dan stok negatif ditolak | Uji perilaku | `05-evidence.md` AC-03, AC-04 | `Unverified` |
| `PRE-03` | Backdate ditolak | Uji perilaku | `05-evidence.md` AC-05 | `Unverified` |
| `PRE-04` | Status WO di luar daftar ditolak | Uji perilaku | `05-evidence.md` AC-13 | `Unverified` |
| `PRE-05` | Peran tidak sesuai ditolak | Uji perilaku | — | `Unverified` |
| `PRE-06` | Konfirmasi tidak cocok ditolak | Uji perilaku | `05-evidence.md` AC-09 | `Unverified` |
| `PRE-07` | Pemakaian pertama membawa WO ke `BERJALAN` | Uji perilaku | `05-evidence.md` AC-07 | `Unverified` |
| `POST-01` | Saldo turun dan mutasi bertambah dalam satu transaksi | Uji database | `05-evidence.md` AC-01 | `Unverified` |
| `POST-02` | Nilai WIP = qty × harga rata-rata saat keluar | Uji perilaku | `05-evidence.md` AC-02 | `Unverified` |
| `POST-03` | WO `BERJALAN` dan riwayat | Uji perilaku | `05-evidence.md` AC-07 | `Unverified` |
| `POST-04` | Sisa menaikkan saldo dan menurunkan WIP pada harga keluar | Uji database | `05-evidence.md` AC-10 | `Unverified` |
| `POST-05` | Scrap tidak membuat mutasi tambahan | Uji perilaku | `05-evidence.md` AC-11 | `Unverified` |
| `POST-06` | Kegagalan tidak meninggalkan setengah transaksi | Uji database | `05-evidence.md` AC-01 | `Unverified` |
| `INV-01` | Nilai = qty × harga rata | Uji inventory | `05-evidence.md` AC-02 | `Unverified` |
| `INV-02` | Qty saldo = jumlah mutasi | Uji inventory | `05-evidence.md` AC-01 | `Unverified` |
| `INV-03` | Stok negatif ditolak | Uji inventory | `05-evidence.md` AC-03 | `Unverified` |
| `INV-04` | Tidak ada tulis langsung ke saldo dari modul | Review + pencarian | `05-evidence.md` AC-08 | `Unverified` |
| `INV-05` | Hasil tidak bisa dicatat sebelum konfirmasi lengkap | Uji perilaku | `05-evidence.md` AC-12 | `Unverified` |
| `INV-06` | Jurnal balance dan hanya dari mutasi | Uji `postJournal()` | `05-evidence.md` AC-14 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Arah mutasi sisa (Q-01) | `Proposed` — `[USULAN-AGEN]` | Stok bahan salah |
| Scrap tanpa mutasi tambahan (Q-02) | `Proposed` — `[USULAN-AGEN]` | Stok dan nilai WIP salah bila akun scrap dibutuhkan |
| Jurnal pemakaian (Q-03) | `Locked` untuk akun (`D-41`); `Proposed` untuk titik posting | Jurnal tidak lengkap |
| Cakupan WIP bahan saja (Q-04) | `Proposed` — `[USULAN-AGEN]` | HPP (`PR-006`) harus menambahkan TKL dan overhead |
| Toleransi selisih (Q-05) | `Locked` mekanisme (`D-51`); `Proposed` pemakaian | Penanda investigasi salah |
| Penegakan `INV-03` di database (constraint) atau service | `Proposed` | Menentukan tingkat jaminan |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| Mutasi scrap terpisah | Tidak ada akun dan nilai scrap (`D-41`) |
| Approval pemakaian di atas BOM | Matriks v0 tidak punya baris (`Q-07`) |
| Loop/termination | Tidak ada algoritma berulang |
