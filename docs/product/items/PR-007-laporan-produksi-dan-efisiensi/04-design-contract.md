# Design Contract: PR-007 — Laporan produksi dan efisiensi

- Source: `docs/product/items/PR-007-laporan-produksi-dan-efisiensi/01-requirement.md` (`PR-007`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-13`)
- Status: `Proposed` — belum diverifikasi. Semua aturan `Unverified`
- Profile: product app / modul internal Next.js + Supabase
- Scope: pembacaan laporan produksi, WIP, persediaan, dan indikator efisiensi
- Owner: track PR-D (perilaku), tech lead (service atau read model)

## Intent and non-goals

**Intent.** Setiap angka di laporan bisa dicocokkan dengan dokumen sumbernya, dan laporan tidak pernah mengubah data.

**Non-goals.** Laporan keuangan (`C-009`), tutup buku (`C-010`), rekonsiliasi lintas siklus (`INT-003`), dan ekspor file (`D-50`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server | Parameter periode akuntansi, gudang | Parse dan validasi di server | Rentang periode tervalidasi | Tolak dengan pesan |
| `B-02` | Sesi → identitas aktor | Cookie sesi | Ambil dari sesi | `actor_id` dan peran | Tolak tanpa sesi |
| `B-03` | Core service → laporan | Angka dari sumber | Hanya lewat service core | Angka dari sumber tepercaya | Tampilkan pesan bila data tidak lengkap |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Membuka laporan | Aktor berperan yang punya hak lihat (`D-33`) | Service PR-007 | Tolak |
| `PRE-02` | Membuka laporan | Periode awal ≤ periode akhir | Service PR-007 | Tolak; pesan menyebut rentang |
| `PRE-03` | Menghitung indikator | Pembagi lebih dari nol | Service PR-007 | Tampilkan keterangan; bukan nol |
| `PRE-04` | Menampilkan angka final | Data sumber untuk periode lengkap | Service PR-007 | Tampilkan pesan belum lengkap |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Angka laporan sama dengan angka sumber pada saat pembacaan | Semua data sumber | Tidak ada |
| `POST-02` | Laporan tidak menulis ke tabel apa pun | Semua data | Tidak ada |
| `POST-03` | Kerugian di atas toleransi tampil sebagai kerugian | Total kerugian | Tidak ada |
| `POST-04` | Nilai persediaan per gudang = saldo akun persediaan di buku besar; kuantitas = `saldo_stok` | Data sumber | Tidak ada |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Service PR-007 | Laporan hanya membaca | Tulis dari laporan |
| `INV-02` | Core | Laporan membaca lewat service core atau read model (`D-25`, `ARCH-08`) | Query langsung ke tabel modul lain |
| `INV-03` | Service PR-007 | Laporan dihitung saat dibuka, tidak disimpan (makalah Tabel 4.2.6 nomor 36; G14) | Tabel laporan tersimpan |
| `INV-04` | Service PR-007 | Yield dan efisiensi bahan memakai rumus `D-51`(f) | Rumus lain |
| `INV-05` | Service PR-007 | Nilai buku besar dan kuantitas `saldo_stok` harus cocok per gudang (`[USULAN-AGEN]`) | Laporan menampilkan dua angka yang tidak cocok tanpa penanda |

State transition: tidak ada. Laporan tidak punya status.

## Rumus

- Yield = lolos ÷ diproses.
- Efisiensi bahan = Σ(qty BOM × lulus) ÷ bahan aktual yang dikonfirmasi.
- Pembagi nol → keterangan "belum ada data".

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Sumber tidak lengkap | Tampilkan pesan; jangan tampilkan angka final | Ulangi setelah data lengkap |
| Dua angka tidak cocok (`INV-05`) | Tampilkan penanda selisih; jangan tampilkan sebagai final | Periksa jurnal dan mutasi |
| Read model belum ada | Tidak berlaku; versi awal memakai query service | — |

## Architecture boundaries

Laporan membaca lewat service core (`D-25`, `ARCH-08`). Tidak ada impor modul lain (`ARCH-01`). Tidak ada tabel laporan (`INV-03`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Periode tidak valid ditolak | Uji perilaku | `05-evidence.md` AC-06 | `Unverified` |
| `B-02` | `actor_id` dari klien diabaikan | Uji perilaku | — | `Unverified` |
| `B-03` | Angka sama dengan sumber | Uji perilaku | `05-evidence.md` AC-01, AC-02, AC-03 | `Unverified` |
| `PRE-01` | Peran tanpa hak ditolak | Uji perilaku | `05-evidence.md` AC-07 | `Unverified` |
| `PRE-02` | Rentang terbalik ditolak | Uji perilaku | `05-evidence.md` AC-06 | `Unverified` |
| `PRE-03` | Pembagi nol tidak menghasilkan nol | Uji perilaku | `05-evidence.md` AC-10 | `Unverified` |
| `PRE-04` | Data belum lengkap tidak menampilkan angka final | Uji perilaku | `05-evidence.md` AC-11 | `Unverified` |
| `POST-01` | Angka sama dengan sumber | Uji perilaku | `05-evidence.md` AC-01 | `Unverified` |
| `POST-02` | Tidak ada tulis | Perbandingan tabel | `05-evidence.md` AC-05 | `Unverified` |
| `POST-03` | Kerugian tampil | Uji perilaku | `05-evidence.md` AC-04 | `Unverified` |
| `POST-04` | Nilai per gudang sama dengan buku besar; kuantitas sama dengan `saldo_stok` | Uji database | `05-evidence.md` AC-03 | `Unverified` |
| `INV-01` | Tidak ada tulis dari laporan | Review + perbandingan tabel | `05-evidence.md` AC-05 | `Unverified` |
| `INV-02` | Tidak ada query langsung ke tabel modul lain | Review + pencarian | `05-evidence.md` AC-08 | `Unverified` |
| `INV-03` | Tidak ada tabel laporan | Review DDL | — | `Unverified` |
| `INV-04` | Rumus efisiensi sesuai `D-51`(f) | Uji perilaku | `05-evidence.md` AC-09 | `Unverified` |
| `INV-05` | Selisih nilai dan kuantitas ditandai | Uji perilaku | `05-evidence.md` AC-03 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Rumus efisiensi (Q-01) | `Locked` — `D-51`(f) | Angka dikarang bila rumus berubah |
| Cakupan persediaan dan per gudang (Q-02) | `Locked` (`D-52`); cakupan akun `Proposed` | Angka tidak lengkap |
| Filter periode akuntansi (Q-03) | `Locked` (`D-43`); bentuk filter `Proposed` | WO lintas periode salah |
| Hak lihat (`D-33`) | `Locked` | Akses salah bila matriks diubah tanpa revisi |
| Query service atau read model (Q-06) | `Proposed` — `[USULAN-AGEN]`: query service | Batas modul salah bila read model dibuat |
| Sumber nilai persediaan (`D-43` vs `D-06`) | `Proposed` — nilai buku besar, kuantitas `saldo_stok` | Laporan dua sumber tidak cocok |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| State machine laporan | Laporan tidak punya status |
| Ekspor file | `D-50`: menyusul |
| Loop/termination | Tidak ada algoritma berulang |
