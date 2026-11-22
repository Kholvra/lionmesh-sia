# Design Contract: C-011 — Master data terpadu

- Source: `docs/product/items/C-011-master-data/01-requirement.md` (`C-011`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-07`)
- Status: `Proposed` — belum diverifikasi; semua aturan `Unverified`
- Profile: product app — master lintas siklus
- Scope: daftar produk, gudang, dan satuan; status aktif dan nonaktif; kode unik; kategori produk, konversi satuan, mata uang dan kurs (master, D-38)
- Owner: tech lead
- Keputusan yang dipakai: `D-04`, `D-06`, `D-25`, `D-31`, `D-38`, `D-41`, `D-50`, `D-52`

## Intent and non-goals

**Intent.** Satu daftar produk, gudang, dan satuan untuk semua modul, sehingga barang yang sama punya kode yang sama.

**Non-goals.** COA (`FND-006`), transaksi dalam mata uang asing (D-38), BOM (`PR-001`), saldo dan mutasi stok (`FND-005`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server | data entri master | validasi skema: kode, nama, satuan dasar | entri bertipe | tolak dengan pesan; tidak ada tulisan |
| `B-02` | Sesi → identitas aktor | cookie sesi | peran dari sesi dan tabel `pengguna` | `actor_id` + peran | tolak bila peran tidak sesuai matriks-izin (PT-06, `[USULAN-AGEN]`; produk oleh Produksi, D-33) |
| `B-03` | Server → database | baris master | constraint `UNIQUE` pada kode; RLS | baris yang lolos kebijakan | tolak di database |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Entri ditambah atau diubah | aktor berperan sesuai PT-06 (`[USULAN-AGEN]`) | server | tolak sebelum tulisan |
| `PRE-02` | Produk ditambah | satuan dasar ada dan aktif | server | tolak; pesan menyebut satuan |
| `PRE-03` | Entri dipilih di dokumen baru | entri berstatus `aktif` | modul pemanggil lewat core | tolak; pesan menyatakan entri nonaktif |
| `PRE-04` | Konversi satuan dicatat | kedua satuan berstatus `aktif` | server | tolak; pesan menyebut satuan |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | entri tersimpan dengan kode unik | entri lain | — |
| `POST-02` | entri nonaktif tidak tampil sebagai pilihan baru | dokumen lama tetap terbaca | — |
| `POST-03` | mata uang dan kurs tersimpan sebagai master; dokumen dan jurnal baru tetap IDR (`D-38`) | transaksi | — |
| `POST-04` | kategori produk tersimpan dan bisa dipasang ke produk | produk lain | — |
| `POST-05` | entri nonaktif yang diaktifkan kembali tersedia lagi sebagai pilihan (PT-07, `[USULAN-AGEN]`) | — | — |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | core master | kode produk, gudang, dan satuan unik per jenis | dua entri dengan kode sama |
| `INV-02` | core master | satu sumber untuk daftar produk, gudang, dan satuan | tabel master duplikat di modul |
| `INV-03` | core master | kode tidak berubah setelah dipakai dokumen `[USULAN]` | kode berubah dan dokumen menunjuk entri yang salah |
| `INV-04` | core master | transaksi dan jurnal baru tidak memakai mata uang asing (`D-38`) | dokumen atau jurnal dalam mata uang asing |

| State | Transisi legal | Transisi ilegal |
|---|---|---|
| `aktif` | → `nonaktif` (tidak dihapus, `D-50`) | hapus fisik entri yang sudah dipakai dokumen |
| `nonaktif` | → `aktif` `[USULAN-AGEN]` (PT-07) | — |

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Kode ganda | tolak; tidak ada baris | pilih kode lain |
| Satuan dasar tidak ada | tolak produk | tambahkan satuan lebih dulu |

## Architecture boundaries

- Master berada di `core/` (`D-04`). Modul tidak boleh mengimpor `modules/**` (`ARCH-02`, `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`).
- `ARCH-08` berlaku: modul tidak membaca tabel master milik modul lain; akses lewat service core.
- `ARCH-06` tidak berlaku di sini; pengadaan milik `C-013`.

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | entri tidak valid ditolak | uji perilaku | `05-evidence.md` AC-03 | `Unverified` |
| `B-02` | aktor tanpa hak ditolak | uji perilaku (PT-06, `[USULAN-AGEN]`) | `05-evidence.md` AC-06 | `Unverified` |
| `B-03` | kode ganda ditolak di database | uji database | `05-evidence.md` AC-02 | `Unverified` |
| `PRE-01` | perubahan oleh peran tanpa hak ditolak | uji perilaku | `05-evidence.md` AC-06 | `Unverified` |
| `PRE-02` | produk tanpa satuan ditolak | uji perilaku | `05-evidence.md` AC-03 | `Unverified` |
| `PRE-03` | entri nonaktif tidak bisa dipilih | uji perilaku | `05-evidence.md` AC-04 | `Unverified` |
| `POST-01` | entri tersimpan | uji fixture | `05-evidence.md` AC-01 | `Unverified` |
| `POST-02` | entri nonaktif tidak tampil sebagai pilihan | uji perilaku | `05-evidence.md` AC-04 | `Unverified` |
| `PRE-04` | konversi dengan satuan nonaktif ditolak | uji perilaku | `05-evidence.md` AC-09 | `Unverified` |
| `POST-03` | mata uang master; transaksi IDR | uji perilaku | `05-evidence.md` AC-10 | `Unverified` |
| `POST-04` | kategori terpasang ke produk | uji perilaku | `05-evidence.md` AC-08 | `Unverified` |
| `POST-05` | aktivasi kembali terlihat sebagai pilihan | uji perilaku | `05-evidence.md` AC-11 | `Unverified` |
| `INV-04` | tidak ada transaksi asing | uji perilaku | `05-evidence.md` AC-10 | `Unverified` |
| `INV-01` | tidak ada kode ganda | uji database | `05-evidence.md` AC-02 | `Unverified` |
| `INV-02` | tidak ada tabel master di modul | pencarian kode | `05-evidence.md` AC-05 | `Unverified` |
| `INV-03` | kode tidak berubah setelah dipakai | uji perilaku | — | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Cakupan: kategori, mata uang, konversi (PT-01 sampai PT-03) | `Terjawab — D-38` (AC-08 sampai AC-10) | — |
| Izin pengelola master (PT-06) | `Proposed` `[USULAN-AGEN]` | pengelola salah peran, atau master diubah tanpa hak |
| Batas tabel dengan `FND-002` (PT-08) | `Proposed` `[USULAN-AGEN]` | dua definisi tabel produk |
| Aktivasi kembali entri nonaktif (PT-07) | `Proposed` `[USULAN-AGEN]` | entri yang tidak dipakai lagi tiba-tiba muncul |
| Aturan kode tidak berubah (INV-03) | `Proposed` `[USULAN]` | dokumen menunjuk entri yang salah |
