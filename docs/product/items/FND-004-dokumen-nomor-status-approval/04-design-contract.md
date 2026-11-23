# Design Contract: FND-004 — Dokumen

- Source: `docs/product/items/FND-004-dokumen-nomor-status-approval/01-requirement.md` (`FND-004`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-16`)
- Status: `Approved`
- Profile: product app / document lifecycle
- Scope: nomor dokumen, status, riwayat, approval berjenjang, pembatalan, revisi, konkurensi
- Owner: tech lead
- Referensi: `ARCH-001` (`ARCH-05`, `INV-04`, `INV-05`, `INV-06`, `POST-03`, `POST-04`); `D-08`, `D-35`, `D-37`, `D-42`, `D-43`, `D-46`, `D-47`, `D-48`, `D-50`, `D-51`

## Intent and non-goals

**Intent.** Setiap dokumen punya nomor unik, jejak status yang lengkap, dan approval yang tidak bisa dilewati. Perubahan hanya lewat `core/dokumen`.

**Non-goals.** Daftar status per jenis dokumen modul (item pemilik), layar, notifikasi, jurnal pembalik (`FND-006`), dan nominal final.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Pemanggil modul → `core/dokumen` | jenis dokumen, aksi, alasan, nominal | aktor dari sesi (`FND-003`); jenis terdaftar; transisi ada di tabel; alasan ada bila wajib | transisi tervalidasi | Tolak sebelum menyentuh data |
| `B-02` | Dua permintaan → baris dokumen | aksi bersamaan | `UPDATE ... WHERE status = asal` dan hitung baris | satu perubahan menang | Yang kalah: "Dokumen ini sudah diproses oleh pengguna lain." |
| `B-03` | Modul → penanda diposting | status posting dari modul pemilik | dibaca dari transaksi modul; bila tidak terbaca, dianggap sudah diposting | penanda konsisten dengan efek | Pembatalan ditolak (fail-safe) |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Dokumen baru dibuat | Jenis dokumen terdaftar dengan kode `TIPE`; periode sumber tidak terkunci (`ARCH-001` `PRE-04`) | Core dokumen | Tolak |
| `PRE-02` | Transisi diminta | Status asal sama dengan status tersimpan; transisi ada di tabel (`D-46`, `D-47`) | Core dokumen | Tolak dengan pesan |
| `PRE-03` | Dokumen dinyatakan `DISETUJUI` atau `DIPROSES` | Semua level aturan sudah `SETUJUI` (`D-37`) | Core dokumen | Tolak |
| `PRE-04` | Persetujuan atau pemeriksaan | Aktor bukan pembuat dokumen (`D-48`) | Core dokumen | Tolak |
| `PRE-05` | Pembatalan | Dokumen belum diposting (`B-03`) dan alasan terisi (`D-48`) | Core dokumen | Tolak dengan pesan |
| `PRE-06` | Penolakan | Alasan terisi (`D-48`) | Core dokumen | Tolak |
| `PRE-07` | Persetujuan level n | Level n-1 sudah `SETUJUI`; aturan aktif untuk jenis dokumen | Core dokumen | Tolak |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Dokumen baru punya nomor unik dan satu baris riwayat `BUAT` | Dokumen lain | Nomor terpakai; counter naik |
| `POST-02` | Transisi sah menambah tepat satu baris riwayat | Riwayat lama | Baris riwayat baru |
| `POST-03` | Transisi ditolak tidak mengubah status atau riwayat | Status dan riwayat | Tidak ada |
| `POST-04` | Revisi menggugurkan approval aktif; baris `SETUJUI` lama tetap ada | Riwayat | Approval baru harus diulang dari level 1 |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core dokumen | Nomor unik per tipe per bulan (`ARCH-001` `INV-04`, `D-50`) | Dua dokumen dengan nomor sama |
| `INV-02` | Core dokumen | Setiap transisi punya baris riwayat dengan aktor dan waktu (`INV-05`) | Status berubah tanpa jejak |
| `INV-03` | Core dokumen | Riwayat tambah-saja (`POST-04`) | Baris riwayat diubah atau dihapus |
| `INV-04` | Core dokumen | Dokumen tidak dihapus; batal menjadi `DIBATALKAN` | Baris dokumen dihapus |
| `INV-05` | Core dokumen | Level approval berurutan; level n+1 tidak mendahului level n | Level dilompati |
| `INV-06` | Core dokumen | `DITOLAK` dan `DIBATALKAN` final; status tidak mundur setelah posting | Status final berubah |
| `INV-07` | Core dokumen | Status hanya dari daftar `D-46` dan `D-47` | Status ke-N di luar daftar |

Status yang dipakai: `DRAFT`, `DIAJUKAN`, `DIPERIKSA`, `DISETUJUI`, `DIPROSES`, `SELESAI`, `REVISI`, `DITOLAK`, `DIBATALKAN` (generik), plus status penambalan `D-47` yang didaftarkan pemilik modul.

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Dua proses memperbarui status bersamaan | Hanya satu berhasil; yang kedua ditolak tanpa perubahan | Pengguna memuat ulang dokumen |
| Penulisan riwayat gagal | Status tidak berubah (satu transaksi) | Ulangi aksi |
| Counter gagal naik | Nomor tidak dibuat | Ulangi pembuatan |
| Penanda diposting tidak terbaca | Dianggap diposting; pembatalan ditolak | Perbaiki pembacaan modul |

## Architecture boundaries

- `ARCH-05`: nomor, status, dan riwayat hanya lewat `core/dokumen`. Hak tulis tabel dicabut dari `anon`/`authenticated`; RPC hanya untuk server tepercaya. Penegakan tambahan lewat review.
- `D-48`: aturan pembatalan, revisi, dan approval berlaku di semua item modul melalui item ini.

## Data dan nominal

- Nominal dokumen untuk ambang diambil dari total yang disediakan modul pemilik dan disimpan `numeric(18,2)` (konvensi `FND-002` `INV-06`).
- `FND-004` tidak memposting jurnal; akun debit dan kredit tidak berlaku di item ini dan dicatat di item pemicu (`PD-005`, `PG-007`, `GJ-005`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Aktor dari sesi; transisi tidak ada ditolak | AC-04, AC-08; uji sesi | `05-evidence.md` | `PASS` |
| `B-02` | Dua aksi bersamaan, satu menang | AC-02, AC-06 | `05-evidence.md` | `PASS` |
| `B-03` | Penanda posting membuat pembatalan ditolak | AC-13 | `05-evidence.md` | `PASS` |
| `PRE-01` | Jenis/status tidak terdaftar ditolak; periode sumber belum diperiksa | AC-01, AC-14 | `05-evidence.md` | `PARTIAL` |
| `PRE-02` | Status asal salah ditolak | AC-04 | `05-evidence.md` | `PASS` |
| `PRE-03` | Level belum lengkap ditolak | AC-07 | `05-evidence.md` | `PASS` |
| `PRE-04` | Pemohon tidak menyetujui sendiri | AC-08 | `05-evidence.md` | `PASS` |
| `PRE-05` | Batal setelah posting dan tanpa alasan ditolak | AC-10, AC-13 | `05-evidence.md` | `PASS` |
| `PRE-06` | Tolak tanpa alasan ditolak | AC-12 | `05-evidence.md` | `PASS` |
| `PRE-07` | Level lompat ditolak | AC-07 | `05-evidence.md` | `PASS` |
| `POST-01` | Nomor unik dan riwayat pertama | AC-01, AC-03 | `05-evidence.md` | `PASS` |
| `POST-02` | Riwayat bertambah satu | AC-05 | `05-evidence.md` | `PASS` |
| `POST-03` | Penolakan tidak mengubah apa pun | AC-04 | `05-evidence.md` | `PASS` |
| `POST-04` | Revisi menggugurkan approval | AC-11 | `05-evidence.md` | `PASS` |
| `INV-01` | Nomor tidak ganda | AC-02, AC-15 | `05-evidence.md` | `PASS` |
| `INV-02` | Setiap transisi ada riwayat | AC-03, AC-05 | `05-evidence.md` | `PASS` |
| `INV-03` | Riwayat lama tidak berubah | AC-05, AC-11 | `05-evidence.md` | `PASS` |
| `INV-04` | Tidak ada hapus dokumen | AC-09 | `05-evidence.md` | `PASS` |
| `INV-05` | Level berurutan | AC-07 | `05-evidence.md` | `PASS` |
| `INV-06` | Status final tidak berubah | AC-12 | `05-evidence.md` | `PASS` |
| `INV-07` | Status di luar daftar ditolak | AC-14 | `05-evidence.md` | `PASS` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Format nomor (`OQ-04-01`, `D-50`) | Terjawab dan diuji | Nomor di dokumen cetak berubah |
| Ambang dan level (`OQ-04-02`, `D-51` c) | Seed placeholder `PERMINTAAN_PEMBELIAN`/`PERIODE_GAJI`; belum final | Approval seed salah sampai koreksi |
| Status per jenis (`OQ-04-04`) | Terjawab; registry tipe/status diimplementasikan | Bentuk API dokumen |
| Penanda diposting dan fail-safe (`B-03`) | Diuji dengan AC-13 | Pembatalan dokumen posting bisa lolos |
| Approval sebagai baris riwayat (`D-08`) | Diimplementasikan tanpa tabel approval terpisah | Tabel approval kedua |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| Otorisasi per peran | Milik `FND-003` |
| Loop/termination | Tidak ada algoritma berulang |
| Jurnal pembalik | Milik `FND-006` (`D-35`) |
| Tabel approval terpisah | `D-08` dan `D-37`: satu mesin, satu riwayat |
