# Design Contract: PR-001 — BOM berversi dan toleransi

- Source: `docs/product/items/PR-001-bom-berversi-dan-toleransi/01-requirement.md` (`PR-001`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-13`)
- Status: `Proposed` — belum diverifikasi. Semua aturan `Unverified`
- Profile: product app / modul internal Next.js + Supabase
- Scope: data BOM satu level, versi, dan toleransi; akses ke master produk lewat service core
- Owner: tech lead (skema; tabel di `core/` menurut `D-31`), track PR-A (perilaku)

## Intent and non-goals

**Intent.** Setiap perintah produksi dapat menunjuk satu versi BOM yang tetap, sehingga kebutuhan bahan dan HPP bisa ditelusuri.

**Non-goals.** Master produk (`C-011`), kebutuhan bahan (`PR-003`), HPP (`PR-006`), BOM bertingkat (`D-11`), penyimpanan stok atau harga di BOM, dan persetujuan versi (tidak ada di matriks v0).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server action | Form BOM: produk, komponen, qty, toleransi, `berlaku_dari` | Parse dan validasi skema di server sebelum menyentuh service | Nilai bertipe dan tervalidasi | Tolak dengan pesan dari `01-requirement.md`; jangan teruskan ke service |
| `B-02` | Sesi → identitas aktor | Cookie sesi | Ambil pengguna dari sesi di server | `actor_id` dan peran dari sesi | Tolak bila tidak ada sesi; jangan menerima `actor_id` dari klien |
| `B-03` | Server → database | Query dari service BOM | RLS dan constraint | Baris yang lolos kebijakan | Tolak di database; jangan andalkan pemeriksaan peran di klien |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Membuat versi BOM | Aktor terautentikasi dan berperan Produksi (`D-33`) | Service PR-001 | Tolak sebelum menyentuh data |
| `PRE-02` | Membuat versi BOM | Produk aktif di master `C-011` (dibaca lewat service core) | Service PR-001 | Tolak; pesan menyebut produk |
| `PRE-03` | Menyimpan komponen | Qty komponen > 0 | Service PR-001 | Tolak; pesan menyebut qty |
| `PRE-04` | Menyimpan toleransi | Nilai `0 ≤ t < 100` persen untuk scrap dan reject (`D-51`(e), `[USULAN-AGEN]` rentang) | Service PR-001 | Tolak; pesan menyebut toleransi |
| `PRE-05` | Menyimpan komponen | Tipe produk komponen = `bahan`; tidak duplikat dalam versi; versi memuat minimal satu komponen | Service PR-001 | Tolak; pesan sesuai tabel validasi |
| `PRE-06` | Menyimpan versi | `berlaku_dari` ≥ `berlaku_dari` versi terakhir dan tidak sama dengan versi yang ada | Service PR-001 | Tolak; pesan menyebut tanggal |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Versi baru tersimpan dengan nomor versi (naik 1 per produk), `berlaku_dari`, komponen, toleransi, dan kolom audit (`D-32`) | Versi lain | Baris versi dan komponen |
| `POST-02` | Membuat versi baru tidak mengubah komponen, toleransi, atau `berlaku_dari` versi sebelumnya | Seluruh versi lama | Tidak ada |
| `POST-03` | Setelah simpan, pembacaan ulang menghasilkan isi yang sama | Nilai toleransi dan qty | Tidak ada |
| `POST-04` | Simpan bersifat atomik: versi dan seluruh komponennya tersimpan bersama, atau tidak sama sekali | Data sebelumnya | Tidak ada |
| `POST-05` | `versiBerlakuPada(produk, tanggal)` mengembalikan versi dengan `berlaku_dari` terbesar yang tidak melewati tanggal, atau kosong | Semua versi | Tidak ada |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Service PR-001 | Isi versi yang sudah disimpan tidak berubah; versi yang dipakai WO tidak diubah (`EPIC-PR` gate 4) | Mengedit versi yang sudah disimpan atau yang dipakai WO |
| `INV-02` | Skema | Tabel BOM tidak memuat kolom stok, harga, atau harga rata (`D-06`, `D-10`) | Kolom `stok`, `harga`, atau `harga_rata` di tabel BOM atau versi |
| `INV-03` | Skema + service | Paling banyak satu versi per produk untuk `berlaku_dari` yang sama (`[USULAN-AGEN]`, penegakan di constraint unik) | Dua versi dengan tanggal berlaku sama |
| `INV-04` | Tech lead | Migrasi yang sudah di-merge tidak berubah (`D-09`, `INV-06` `ARCH-001`) | Menyunting migrasi lama |
| `INV-05` | Service PR-001 | Status versi diturunkan dari tanggal: `TERJADWAL` (`berlaku_dari` > hari ini), `BERLAKU` (versi terbaru yang tidak melewati hari ini), `DIGANTIKAN` (ada versi lebih baru yang sudah berlaku). Hanya satu `BERLAKU` per produk | Dua versi `BERLAKU` untuk produk sama |

State table (`[USULAN-AGEN]`, turunan tanggal; `D-46` tidak mencakup BOM):

| State | Arti | Transisi legal |
|---|---|---|
| `TERJADWAL` | Belum berlaku | → `BERLAKU` saat tanggal tercapai (otomatis) |
| `BERLAKU` | Berlaku sekarang | → `DIGANTIKAN` saat versi lebih baru berlaku |
| `DIGANTIKAN` | Sudah diganti | terminal |

Tidak ada transisi manual. Tidak ada edit setelah simpan.

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Simpan versi gagal di tengah | Tidak ada versi atau komponen setengah tersimpan (`POST-04`) | Ulangi dari form |
| Produk dinonaktifkan setelah versi dibuat | Versi tetap terbaca; WO baru tidak bisa memakainya (`D-50`) | Aktifkan kembali produk di `C-011` bila diperlukan |
| Migrasi nomor sama | Gagal sebelum database (`check:migrations`) | Tech lead menomori ulang |

## Architecture boundaries

Modul Produksi tidak mengimpor modul lain dan tidak membaca tabel produk milik `C-011` secara langsung (`ARCH-01`, `ARCH-08`, `D-25`). Tabel `produk_komponen` dimiliki `core/` (`D-31`); aturan dan layar tetap di modul Produksi. Pemeriksaan `ARCH-08` belum punya checker otomatis dan dilakukan lewat review dan pencarian query.

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Input tidak valid tidak tersimpan | Uji perilaku | `05-evidence.md` AC-04, AC-10 | `Unverified` |
| `B-02` | `actor_id` dari klien diabaikan | Uji perilaku | — | `Unverified` |
| `B-03` | RLS menolak akses di luar peran | Uji database | — | `Unverified` |
| `PRE-01` | Pengguna tanpa peran Produksi ditolak | Uji perilaku | — | `Unverified` |
| `PRE-02` | Produk nonaktif atau tidak ada ditolak | Uji perilaku | `05-evidence.md` AC-05 | `Unverified` |
| `PRE-03` | Qty 0 atau negatif ditolak | Uji perilaku | `05-evidence.md` AC-04 | `Unverified` |
| `PRE-04` | Toleransi di luar rentang ditolak | Uji perilaku | `05-evidence.md` AC-12 | `Unverified` |
| `PRE-05` | Duplikat, kosong, dan non-bahan ditolak | Uji perilaku | `05-evidence.md` AC-10 | `Unverified` |
| `PRE-06` | Tanggal tidak valid ditolak | Uji perilaku | `05-evidence.md` AC-11 | `Unverified` |
| `POST-01` | Versi baru dengan nomor dan tanggal | Uji perilaku | `05-evidence.md` AC-01, AC-06 | `Unverified` |
| `POST-02` | Versi lama identik setelah versi baru | Uji perilaku | `05-evidence.md` AC-02 | `Unverified` |
| `POST-03` | Pembacaan ulang identik | Uji perilaku | `05-evidence.md` AC-03 | `Unverified` |
| `POST-04` | Simpan atomik | Uji database | `05-evidence.md` AC-01 | `Unverified` |
| `POST-05` | `versiBerlakuPada` benar | Uji service | `05-evidence.md` AC-13 | `Unverified` |
| `INV-01` | Versi tersimpan tidak berubah; versi dipakai WO tetap | Uji perilaku lintas `PR-002` | `05-evidence.md` AC-02 | `Unverified` |
| `INV-02` | Skema BOM tanpa kolom stok atau harga | Review DDL | `05-evidence.md` AC-08 | `Unverified` |
| `INV-03` | Dua versi dengan tanggal sama ditolak di database | Uji database | `05-evidence.md` AC-11 | `Unverified` |
| `INV-04` | Migrasi lama tidak berubah | Riwayat git | `05-evidence.md` AC-07 | `Unverified` |
| `INV-05` | Status versi sesuai tanggal | Uji perilaku | `05-evidence.md` AC-06 | `Unverified` |
| `ARCH-01` | Impor antar modul tidak ada | dependency-cruiser | `05-evidence.md` AC-09 | `Unverified` |
| `ARCH-08` | Tidak ada query langsung ke tabel milik `C-011` | Review + pencarian SQL | `05-evidence.md` AC-09 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Pemilik tabel `produk_komponen` (Q-01) | `Locked` — `D-31`: `core/` | Jalur akses ditetapkan pada spec |
| Waktu pemilihan versi untuk WO (Q-02) | `Proposed` — `[USULAN-AGEN]`: saat WO dibuat | Melanggar `INV-01` bila tidak jelas |
| Format toleransi (Q-03) | `Locked` untuk reject (`D-51`(e)); `Proposed` untuk scrap | Angka `PR-003` dan `PR-005` tidak konsisten |
| Status versi berbasis tanggal (Q-06) | `Proposed` — `[USULAN-AGEN]` | Status tampilan tidak sesuai |
| Penegakan `INV-03` di constraint atau service | `Proposed` | Menentukan tingkat jaminan |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| Approval versi BOM | Tidak ada di matriks v0 (`D-33`) |
| BOM bertingkat | `D-11` |
| Kontrak jurnal atau stok | Item ini tidak menyentuh uang atau stok |
