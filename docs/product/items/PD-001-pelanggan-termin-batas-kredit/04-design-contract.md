# Design Contract: PD-001 — Pelanggan, termin, dan batas kredit

- Source: `docs/product/items/PD-001-pelanggan-termin-batas-kredit/01-requirement.md` (`PD-001`); `docs/product/decisions.md` (`D-14`, `D-16`, `D-23`, `D-25`, `D-31`, `D-33`, `D-48`, `D-50`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-11`)
- Status: `Proposed`
- Profile: product app, modul Pendapatan (master)
- Scope: master pelanggan, termin, batas kredit, status aktif, visibilitas kontak
- Owner: tech lead (tabel `pelanggan` di `core/`, `D-31`)

## Intent and non-goals

**Intent.** Termin dan batas kredit pelanggan tersimpan sebagai nilai master yang dibaca dokumen penjualan, tanpa mengubah dokumen yang sudah dibuat, dan batas kredit hanya bisa diubah oleh peran yang berwenang.

**Non-goals.** Pengecekan kredit pada pesanan (`PD-002`), exposure piutang (`PD-002`, `PD-005`), dan izin umum (`FND-003`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server action | nama, termin, batas kredit, kontak | parse tipe dan rentang di server | nilai bertipe | tolak dengan pesan di `01-requirement.md` |
| `B-02` | Sesi → identitas aktor | cookie sesi | identitas dan peran dari sesi server, bukan dari form | peran tepercaya | tolak bila tidak berwenang |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Ubah batas kredit | aktor berperan Manajemen | server action | tolak; tidak ada baris berubah |
| `PRE-02` | Simpan termin | termin bilangan bulat ≥ 0 (kosong → 30) | server action | tolak dengan pesan validasi |
| `PRE-03` | Simpan batas kredit | batas kredit ≥ 0 | server action | tolak dengan pesan validasi |
| `PRE-04` | Baca kontak pelanggan | aktor berperan Penjualan, Accounting, atau Manajemen | server action | tolak; tidak ada data dikembalikan |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Pelanggan tersimpan dengan termin (default 30 bila kosong) dan batas kredit | dokumen lama tidak berubah | riwayat perubahan master (aktor, waktu) |
| `POST-02` | Nonaktifkan pelanggan tidak menghapus baris dan tidak mengubah dokumen terbuka | seluruh riwayat dokumen; status dokumen terbuka | baris `riwayat_status` master (`D-08`) |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Modul Pendapatan | Pelanggan `nonaktif` tidak bisa dipilih di dokumen baru (`D-50`) | pesanan baru memakai pelanggan nonaktif |
| `INV-02` | Core (`pelanggan`) | Data pelanggan tidak dihapus setelah dipakai dokumen (`D-50`) | baris pelanggan hilang |
| `INV-03` | Modul Pendapatan | Batas kredit hanya berubah lewat aksi Manajemen | perubahan batas kredit oleh peran lain |

State pelanggan: `aktif ⇄ nonaktif`, dipicu oleh Penjualan.

## Failure and recovery semantics

| Kegagalan | Perilaku | Pemulihan |
|---|---|---|
| Validasi gagal | tidak ada baris tersimpan | perbaiki input |
| Izin tidak cukup | tolak; pesan izin | minta peran yang berwenang |

## Architecture boundaries

- Modul hanya memakai service core (`D-25`). PD-001 tidak membaca tabel modul lain.
- Kepemilikan tabel `pelanggan` di `core/` (`D-31`); modul memiliki layar dan aturan.

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | perubahan batas oleh Penjualan ditolak; oleh Manajemen diterima | uji otomatis | `05-evidence.md` AC-05 | `Unverified` |
| `PRE-02` | termin 2,5 / "abc" / -1 ditolak; kosong → 30 | uji manual | `05-evidence.md` AC-02, AC-04 | `Unverified` |
| `PRE-03` | batas -1 ditolak | uji manual | `05-evidence.md` AC-03 | `Unverified` |
| `PRE-04` | kontak tidak terbaca oleh peran di luar daftar | uji otomatis | `05-evidence.md` AC-11 | `Unverified` |
| `POST-01` | termin kosong → 30 | uji manual | `05-evidence.md` AC-02 | `Unverified` |
| `POST-02` | nonaktifkan → baris tetap ada, dokumen terbuka tetap | pemeriksaan basis data | `05-evidence.md` AC-06, AC-09 | `Unverified` |
| `INV-01` | pelanggan nonaktif tidak muncul di dokumen baru | uji manual | `05-evidence.md` AC-06 | `Unverified` |
| `INV-02` | baris pelanggan tidak hilang setelah dipakai | pemeriksaan basis data | `05-evidence.md` AC-06 | `Unverified` |
| `INV-03` | perubahan batas oleh peran lain ditolak | uji otomatis | `05-evidence.md` AC-05 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Kepemilikan tabel `pelanggan` (`PQ-01`) — `D-31` | terjawab | lokasi migrasi, `ARCH-08` |
| Batas kredit diubah Manajemen; sisanya Penjualan (`PQ-02`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `PRE-01`, `INV-03` |
| Perilaku batas 0 (`PQ-07`) — `D-16` | terjawab | perilaku `PD-002` |
| Kontak sebagai data pribadi dasar (`PQ-06`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `PRE-04` |
| NPWP dan alamat nullable (`PQ-04`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | field faktur pajak `PD-005` |
