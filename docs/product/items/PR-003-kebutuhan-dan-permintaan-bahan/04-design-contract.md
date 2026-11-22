# Design Contract: PR-003 — Kebutuhan dan permintaan bahan

- Source: `docs/product/items/PR-003-kebutuhan-dan-permintaan-bahan/01-requirement.md` (`PR-003`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-12`)
- Status: `Proposed` — belum diverifikasi. Semua aturan `Unverified`
- Profile: product app / modul internal Next.js + Supabase
- Scope: perhitungan kebutuhan, pemeriksaan stok (baca saja), pembuatan permintaan untuk selisih lewat service core
- Owner: track PR-B (perilaku), tech lead (batas core)

## Intent and non-goals

**Intent.** Kebutuhan bahan selalu dihitung dari satu versi BOM, dan permintaan selalu lahir dari service pengadaan, sehingga tidak ada jalur pembelian kedua.

**Non-goals.** Layar dan alur approval pengadaan (`D-37`), PO, mutasi stok, dan reservasi penjualan.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server action | Permintaan dari detail WO | Parse di server; WO dan peran diambil ulang | ID WO tervalidasi | Tolak dengan pesan |
| `B-02` | Sesi → identitas aktor | Cookie sesi | Ambil dari sesi | `actor_id` dan peran | Tolak tanpa sesi; jangan terima `actor_id` dari klien |
| `B-03` | Core pengadaan → database | Insert permintaan lewat service | RLS dan constraint | Baris lolos kebijakan | Tolak di database |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Membuat permintaan | WO berstatus `BAHAN_KURANG` (`D-46` §5.3) | Service PR-003 | Tolak; pesan menyebut status WO |
| `PRE-02` | Menghitung kebutuhan | Versi BOM berlaku yang dipilih WO (`PR-001`) | Service PR-003 | Tolak; pesan menyebut BOM |
| `PRE-03` | Membuat permintaan | Ada selisih > 0 pada minimal satu komponen | Service PR-003 | Tidak membuat permintaan |
| `PRE-04` | Membuat permintaan | Aktor berperan Produksi atau Gudang (`D-33`) | Core pengadaan | Tolak sebelum menyentuh data |
| `PRE-05` | Membuat permintaan | Belum ada permintaan aktif untuk WO ini | Core pengadaan | Tolak; pesan menyebut permintaan aktif |
| `PRE-06` | Cek ketersediaan | WO berstatus `DIRENCANAKAN`; gudang sumber terisi | Service PR-003 | Tolak; pesan menyebut status |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Permintaan tercatat di `core/pengadaan` dengan `wo_id` dan baris per komponen selisih | Stok tidak berubah | Baris permintaan (oleh core) |
| `POST-02` | WO berstatus `BAHAN_KURANG` bila ada komponen kurang; `BAHAN_CUKUP` bila semua cukup | Versi BOM WO | Baris riwayat status |
| `POST-03` | Cek ketersediaan tidak menulis apa pun ke `saldo_stok` atau `mutasi_stok` | `saldo_stok`, `mutasi_stok` | Tidak ada |
| `POST-04` | Permintaan `DISETUJUI` memindahkan WO ke `MENUNGGU_PEMBELIAN`; `DITOLAK` memindahkan WO ke `DIBATALKAN` | Riwayat lama | Baris riwayat |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core pengadaan | Permintaan hanya dibuat lewat `pengadaan.ajukanPR()` (`D-05`, `ARCH-06`) | Insert langsung dari modul Produksi |
| `INV-02` | Core inventory | Item ini tidak menulis `saldo_stok` atau `mutasi_stok` (`ARCH-04`, `D-06`) | Mutasi dari `PR-003` |
| `INV-03` | Core pengadaan | PR yang ditolak tidak bisa menjadi PO (`analisis-sia.md` §8.1) | PO dibuat dari PR ditolak |
| `INV-04` | Service PR-003 | Kebutuhan dihitung dari versi BOM yang dipilih WO | Kebutuhan dari versi terbaru |
| `INV-05` | Service PR-003 | Tersedia = saldo gudang sumber − kebutuhan WO lain (`BAHAN_CUKUP`/`BAHAN_SIAP`, belum keluar) (`[USULAN-AGEN]`) | Tersedia dihitung tanpa mengurangi janji WO lain |
| `INV-06` | Core pengadaan | Satu permintaan aktif per WO (`[USULAN-AGEN]`) | Dua permintaan aktif untuk WO sama |

Status permintaan (`D-46` §5.2, milik `core/pengadaan`): `DIAJUKAN` → `MENUNGGU_PERSETUJUAN` → `DISETUJUI` / `DITOLAK`; `DIAJUKAN` ↔ `REVISI`. Item ini hanya membaca status tersebut.

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Service pengadaan gagal | WO tidak berubah ke `BAHAN_KURANG` tanpa permintaan | Ulangi |
| Stok tidak terbaca | Tidak ada permintaan dibuat dari angka kosong | Tampilkan pesan dan ulangi |
| Cek dan permintaan tidak satu transaksi | Tidak boleh ada status `BAHAN_KURANG` tanpa permintaan | Cek dan permintaan dijalankan sebagai satu aksi; bila gagal, status tetap `DIRENCANAKAN` |

## Architecture boundaries

Modul Produksi memanggil `pengadaan.ajukanPR()` dan membaca stok lewat service core. Tidak ada impor modul Pengeluaran (`ARCH-01`, `ARCH-06`, `D-05`). Pemeriksaan `ARCH-08` dilakukan lewat review dan pencarian query.

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Input tidak valid tidak diproses | Uji perilaku | — | `Unverified` |
| `B-02` | `actor_id` dari klien diabaikan | Uji perilaku | — | `Unverified` |
| `B-03` | RLS menolak akses di luar peran | Uji database | — | `Unverified` |
| `PRE-01` | Status WO selain `BAHAN_KURANG` ditolak | Uji perilaku | `05-evidence.md` AC-06 | `Unverified` |
| `PRE-02` | Produk tanpa BOM ditolak | Uji perilaku | `05-evidence.md` AC-07 | `Unverified` |
| `PRE-03` | Tidak ada selisih, tidak ada permintaan | Uji perilaku | `05-evidence.md` AC-01 | `Unverified` |
| `PRE-04` | Peran selain Produksi dan Gudang ditolak | Uji perilaku | `05-evidence.md` AC-08 | `Unverified` |
| `PRE-05` | Permintaan kedua untuk WO sama ditolak | Uji perilaku | `05-evidence.md` AC-11 | `Unverified` |
| `PRE-06` | Cek di luar `DIRENCANAKAN` ditolak | Uji perilaku | `05-evidence.md` AC-06 | `Unverified` |
| `POST-01` | Permintaan punya `wo_id` dan selisih | Uji perilaku | `05-evidence.md` AC-04, AC-09 | `Unverified` |
| `POST-02` | Status `BAHAN_KURANG` atau `BAHAN_CUKUP` dan riwayat | Uji perilaku | `05-evidence.md` AC-02 | `Unverified` |
| `POST-03` | Cek tidak mengubah stok | Uji perilaku | `05-evidence.md` AC-03 | `Unverified` |
| `POST-04` | Setujui dan tolak memindahkan WO | Uji perilaku | `05-evidence.md` AC-05, AC-12 | `Unverified` |
| `INV-01` | Tidak ada insert langsung dari Produksi | Review kode dan pencarian | `05-evidence.md` AC-04 | `Unverified` |
| `INV-02` | Tidak ada mutasi dari item ini | Review kode | `05-evidence.md` AC-03 | `Unverified` |
| `INV-03` | PR ditolak tidak bisa jadi PO | Uji perilaku | `05-evidence.md` AC-05 | `Unverified` |
| `INV-04` | Kebutuhan memakai versi WO | Uji perilaku | `05-evidence.md` AC-01 | `Unverified` |
| `INV-05` | Tersedia mengurangi janji WO lain | Uji perilaku | `05-evidence.md` AC-09 | `Unverified` |
| `INV-06` | Satu permintaan aktif per WO | Uji database | `05-evidence.md` AC-11 | `Unverified` |
| `ARCH-01` | Impor modul Pengeluaran tidak ada | dependency-cruiser | `pnpm arch:check` | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Alur approval (`D-37`) | `Locked` — mesin approval di `FND-004` | Dua alur approval bila mesin tidak dipakai |
| Rumus kebutuhan (Q-02) | `Proposed` — `[USULAN-AGEN]` | Jumlah bahan salah |
| Definisi stok tersedia (Q-03) | `Proposed` — `[USULAN-AGEN]` | Bahan dijanjikan dua kali |
| Koreksi permintaan via `REVISI` (Q-07) | `Proposed` — `[USULAN-AGEN]`; `D-47` (d) `Locked` | Pengaju tidak punya jalur koreksi |
| Reservasi penjualan (`PD-003`) | `Unknown` untuk integrasi; di luar item | Stok bisa dijanjikan ganda lintas modul |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| Kontrak mutasi stok | Milik `PR-004`; item ini tidak menulis stok |
| Pembatalan permintaan oleh pengaju | `D-47` (d) |
| Loop/termination | Tidak ada algoritma berulang |
