# Design Contract: FND-002 — Skema domain inti

- Source: `docs/product/items/FND-002-skema-domain-inti/01-requirement.md` (`FND-002`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-09`)
- Status: `Approved`
- Profile: infrastructure / database schema (domain)
- Scope: tiga tabel dasar bersama, relasi, constraint dasar, kepemilikan tabel, migrasi bernomor, konvensi tipe
- Owner: tech lead
- Referensi: `ARCH-001` (`ARCH-07`, `ARCH-08`, `INV-06`); `D-04`, `D-05`, `D-06`, `D-07`, `D-08`, `D-09`, `D-25`, `D-30`, `D-31`, `D-32`, `D-38`, `D-52`, `D-54`, `D-55`, `D-56`, `D-58`; keputusan eksplisit pengguna untuk actor audit
## Intent and non-goals

**Intent.** Setiap tabel domain didefinisikan sekali, punya satu pemilik, dan masuk lewat migrasi yang bisa diulang. Dengan begitu tidak ada dua tabel untuk fakta yang sama.

**Non-goals.** Perilaku tabel (nomor dokumen, approval, mutasi, jurnal), RLS, seed data, dan tabel yang belum punya pemakai.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Berkas migrasi → runner | `.sql` dari branch mana pun | `FND-001` `B-01`: pola nama, nomor unik, urutan | Daftar migrasi tervalidasi | Gagal sebelum database |
| `B-02` | DDL kelompok → `main` | usulan DDL dari branch kelompok | Tinjauan tech lead sebelum merge (`D-09`). Tidak ada pemeriksa otomatis untuk kepemilikan tabel | Migrasi bernomor di `main` | Tidak di-merge; kelompok memperbaiki usulan |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Tabel domain baru ditambahkan | Definisi tabel hanya lewat berkas migrasi, tidak lewat dashboard atau SQL manual | Tech lead | Ditolak saat review; bukan bagian `db:reset` |
| `PRE-02` | Tabel baru didaftarkan | Tabel punya tepat satu pemilik di tabel kepemilikan | Tech lead | Tidak di-merge |
| `PRE-03` | Migrasi domain dijalankan | Migrasi sebelumnya sudah tercatat dan tidak ada nomor yang sama (`FND-001` `PRE-02`) | Runner | Gagal sebelum koneksi |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Setelah `db:reset`, skema publik = gabungan seluruh migrasi | Tidak ada data aplikasi | Versi skema tercatat |
| `POST-02` | Insert dengan foreign key yang tidak ada ditolak database | Baris yang sudah ada | Tidak ada |
| `POST-03` | Daftar tabel publik = `profiles` dari `0001` ditambah tepat `satuan`, `produk`, `gudang` | — | Tidak ada |
| `POST-04` | Kode `satuan`, `produk`, `gudang` unik per tabel | Baris yang sudah ada | Tidak ada |
| `POST-05` | `nama` wajib dan tidak kosong setelah trim; `aktif` non-null default `true` | — | Tidak ada |
| `POST-06` | `produk.satuan_dasar_id` wajib FK ke `satuan.id`, dengan indeks | — | Tidak ada |
| `POST-07` | Tiap tabel punya PK UUID default `gen_random_uuid()`, `kode`/`nama`/`aktif`, dan empat kolom audit | — | Tidak ada |
| `POST-08` | `created_by`/`updated_by` nullable UUID tanpa FK; timestamp audit non-null `timestamptz` default `now()` | — | Tidak ada |
## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Tech lead | Migrasi yang sudah di-merge tidak berubah isinya (`ARCH-001` `INV-06`) | Menyunting `0001_initial.sql` atau migrasi merged lain |
| `INV-02` | Tech lead | Setiap tabel publik punya satu pemilik (`ARCH-001` `ARCH-08`; analisis §4 aturan 4) | Tabel tanpa pemilik; tabel dengan dua pemilik |
| `INV-03` | Core | Tabel `produk` tidak punya kolom stok (`D-06`) | Kolom `stok` pada `produk` |
| `INV-04` | Core | `saldo_stok` hanya didefinisikan di `FND-005` dan ditulis hanya oleh `core/inventory` (`ARCH-001` `ARCH-04`). Jurnal hanya didefinisikan di `FND-006` (`ARCH-001` `ARCH-03`) | Tabel saldo atau jurnal didefinisikan di item lain |
| `INV-05` | Core | Setiap tabel domain punya kolom audit empat (`D-32`); actor `created_by`/`updated_by` adalah UUID nullable tanpa FK sesuai keputusan pengguna | Tabel tanpa kolom audit atau actor audit non-UUID, non-null, atau ber-FK |
| `INV-06` | Tech lead | `D-56`: uang total `numeric(18,2)`, harga satuan/rata dan qty `numeric(18,4)`; waktu `timestamptz` UTC, tampil `Asia/Jakarta`. Tiga tabel ini tidak punya numeric | Uang `float`; waktu tanpa zona |

Skema item ini menetapkan tipe/constraint berikut:

| Tabel | Kolom dan constraint |
|---|---|
| `satuan` | `id uuid primary key default gen_random_uuid()`, `kode text not null unique`, `nama text not null check (btrim(nama) <> '')`, `aktif boolean not null default true`; `created_by uuid null`, `created_at timestamptz not null default now()`, `updated_by uuid null`, `updated_at timestamptz not null default now()` |
| `produk` | Kolom dasar yang sama; `satuan_dasar_id uuid not null references satuan(id)` dan indeks pada `satuan_dasar_id`; tidak ada `stok` |
| `gudang` | Kolom dasar yang sama dengan `satuan` |

Kode memiliki unique constraint per tabel. Tidak ada numeric column di ketiga tabel. Tidak ada FK untuk kolom actor audit.

Kondisi lingkungan mengikuti `FND-001` (`kosong` → `siap` → `terisi`). Item ini tidak menambah transisi.

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Migrasi domain gagal di tengah | Versi tidak tercatat naik (`FND-001` `INV-04`) | Perbaiki berkas; `db:reset` |
| Dua tabel dengan pemilik sama | Review menolak | Pindahkan kepemilikan atau naikkan ke core |
| Kolom stok ditambahkan ke produk | Review menolak (`INV-03`) | Hapus dari usulan |

## Architecture boundaries

- `ARCH-07`: migrasi dinomori dan di-merge hanya oleh tech lead (`PASS` untuk nomor unik lewat `check:migrations`, bagian nomor saja).
- `ARCH-08`: modul tidak membaca tabel modul lain. Item ini menentukan kepemilikan; penegakan ada di item pemilik.
- `D-05`/`D-31`: tabel pengadaan berada di core; definisinya di `C-013`, `PG-008`, `PG-009` (`OQ-02-02`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Nomor duplikat ditolak sebelum database | Uji runner (sudah ada) | `FND-001` `05-evidence.md` AC-03 | `Unverified` |
| `B-02` | Usulan DDL tanpa pemilik ditolak review | Review | — | `Unverified` |
| `PRE-01` | Tidak ada tabel di luar berkas migrasi | Perbandingan dump dengan migrasi | `05-evidence.md` AC-01 | `Verified` |
| `PRE-02` | Setiap tabel punya tepat satu pemilik | AC-07 | `05-evidence.md` AC-07 | `Verified` |
| `PRE-03` | Migrasi tidak berjalan bila nomor sama | `pnpm check:migrations` | — | `Unverified` |
| `POST-01` | Skema = gabungan migrasi setelah reset | AC-01, AC-02 | `05-evidence.md` AC-01–02 | `Verified` |
| `POST-02` | Foreign key menolak parent tidak ada | AC-04 | `05-evidence.md` AC-04 | `Verified` |
| `POST-03` | Daftar tabel = `profiles`, `satuan`, `produk`, `gudang` | AC-01, AC-07 | `05-evidence.md` AC-01, AC-07 | `Verified` |
| `POST-04` | Kode unik per tabel | AC-05 | `05-evidence.md` AC-05 | `Verified` |
| `POST-05` | Nama wajib/nonempty; `aktif` default true | AC-05; query metadata | `05-evidence.md` AC-05, bukti tambahan | `Verified` |
| `POST-06` | FK wajib dan indeks produk-unit ada | AC-04; inspeksi indeks | `05-evidence.md` AC-04, bukti tambahan | `Verified` |
| `POST-07` | PK UUID default dan kolom dasar/audit ada | AC-08; inspeksi ID default | `05-evidence.md` AC-08, bukti tambahan | `Verified` |
| `POST-08` | Actor nullable UUID tanpa FK; timestamp non-null `timestamptz` default `now()` | Inspeksi metadata audit | `05-evidence.md` AC-08–09 | `Verified` |
| `INV-01` | Migrasi lama tidak berubah | AC-03 | `05-evidence.md` AC-03 | `Verified` |
| `INV-02` | Tidak ada tabel tanpa atau dengan dua pemilik | AC-07 | `05-evidence.md` AC-07 | `Verified` |
| `INV-03` | Tidak ada `produk.stok` | AC-06 | `05-evidence.md` AC-06 | `Verified` |
| `INV-04` | `saldo_stok` dan jurnal tidak didefinisikan di item lain | Review migrasi (`FND-005`, `FND-006` memeriksa) | — | `Unverified` |
| `INV-05` | Empat kolom audit; actor UUID nullable tanpa FK | AC-08; inspeksi metadata actor | `05-evidence.md` AC-08 | `Verified` |
| `INV-06` | Tipe waktu dan ketiadaan kolom numeric sesuai D-56 | AC-09 | `05-evidence.md` AC-09 | `Verified` |

## Pemilik tabel

| Tabel | Pemilik fitur | Dibuat oleh | Sumber |
|---|---|---|---|
| `satuan`, `produk`, `gudang` | `C-011` | `FND-002` | `D-55` |
| `profiles` (dari `0001`), kolom peran | `FND-003` | `FND-003` | `D-33`, `OQ-03-11` |
| `riwayat_status`, `dokumen_counter`, `aturan_approval` | `FND-004` | `FND-004` | `D-08`, `D-37` |
| `mutasi_stok`, `saldo_stok` | `FND-005` | `FND-005` | `D-06`, `D-10` |
| `akun`, `jurnal`, `detail_jurnal`, `periode_akuntansi` | `FND-006` | `FND-006` | `D-07`, `D-41`, `D-43` |
| `permintaan_pembelian`, `po`, `penerimaan`, tabel QC | `C-013` | `C-013` | `D-31` |
| `invoice_supplier`, `utang` | `core/` | `PG-008`, `PG-009` | `D-31` |
| Tabel domain lain | Pemilik masing-masing item | Item pertama yang membutuhkan | `D-31` |

Tabel lain dibuat bersama item pemiliknya.

Tidak ada baris yang berstatus `PASS`. Status `Verified` hanya bisa diberikan setelah AC dijalankan dan dicatat di `05-evidence.md`.

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| State machine dokumen | Milik `FND-004` |
| Loop/termination | Tidak ada algoritma berulang |
| Otorisasi per peran / RLS | Milik `FND-003` |
| Batas modul penuh | Milik `ARCH-001` dan `FND-003` |
