# Design Contract: GJ-002 — Presensi dan pengajuan lembur

- Source: `01-requirement.md`, `02-acceptance-criteria.md`; `decisions.md` (D-08, D-33, D-46, D-47, D-48, D-53, D-25); `analisis-sia.md` §6.9, §8.1; makalah UC-GJ-02, UC-GJ-03, aturan 4
- Status: `Proposed`
- Profile: product app (dokumen dengan status, data pribadi, akses per pemilik)
- Alasan kontrak wajib: menyentuh status dokumen (presensi dan lembur, periode) dan data pribadi
- Owner: tech lead

## Intent and non-goals

**Intent.** Setiap presensi dan lembur punya satu pemilik data yang jelas, tidak ganda, dan lembur tidak tercatat tanpa nomor SPL. Karyawan hanya menyentuh barisnya sendiri. Perubahan setelah periode ditutup hanya lewat HR dengan otorisasi.

**Non-goals.** Rekap dan validasi (GJ-003); perhitungan upah (GJ-004); impor mesin (GJ-008); pembuatan akun karyawan (`FND-003`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Form presensi/lembur → server | NIK, tanggal, nilai kehadiran, jam, jam lembur, nomor SPL, alasan | Parse dan validasi di server | Nilai bertipe | Tolak dengan pesan |
| `B-02` | Sesi → identitas aktor | Cookie sesi | Dari sesi di server | `actor_id`, peran, dan NIK (untuk Karyawan) | Tolak bila tidak ada sesi; jangan terima `actor_id` atau NIK pemilik dari klien |
| `B-03` | Server → database | Query | RLS per peran dan constraint | Baris yang lolos kebijakan | Tolak di database |
| `B-04` | Akun Karyawan → presensi | Baca dan tulis presensi | RLS: hanya baris dengan NIK milik sesi (`D-53`) | Baris milik sendiri | Tolak di database |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Simpan presensi | Aktor berperan HR, atau Karyawan untuk NIK miliknya sendiri (`D-33`, `D-53`) | Server + RLS | Tolak |
| `PRE-02` | Simpan presensi atau lembur | Tanggal dalam periode yang periode-nya `TERBUKA` (`D-47` c) | Server | Tolak; sebut periode dan status |
| `PRE-03` | Simpan presensi | Belum ada presensi untuk NIK dan tanggal sama | Database (unique) | Tolak; sebut NIK dan tanggal |
| `PRE-04` | Simpan lembur | Nomor SPL terisi (`D-53`) dan jam lembur tidak melebihi batas berversi (`D-51`) | Server | Tolak; sebut yang kurang |
| `PRE-05` | Batalkan lembur | Status `MENUNGGU_VALIDASI_SUPERVISOR`; alasan terisi; pemohon yang sama (`D-48`) | Server | Tolak; sebut status atau alasan |
| `PRE-06` | Ubah status presensi atau lembur | Transisi sesuai Status di 01; aktor sesuai peran (`D-48`: validator bukan pemohon) | Server | Tolak; sebut status saat ini |
| `PRE-07` | Koreksi periode `REKAP` | Ada otorisasi Manajemen dan alasan; periode `REKAP` menjadi `TERBUKA` (`D-47` c, `D-53`) | Server | Tolak; sebut otorisasi atau alasan |

`PRE-07` untuk periode `TERVALIDASI`: `[USULAN-AGEN]` transisi `TERVALIDASI` → `REKAP` dengan otorisasi Manajemen dan alasan, hanya bila draft payroll periode itu belum `DISETUJUI`; diikuti validasi ulang oleh Supervisor (GJ-003). Transisi ini tidak ada di `D-46`/`D-47` dan perlu dikunci koordinator.

## Postconditions

| ID | On success, MUST guarantee | Preserved | Side effects |
|---|---|---|---|
| `POST-01` | Presensi tersimpan dengan NIK dan tanggal unik dan status `MENUNGGU_VALIDASI_SUPERVISOR` | Presensi lain | Baris presensi |
| `POST-02` | Lembur tersimpan dengan nomor SPL dan status `MENUNGGU_VALIDASI_SUPERVISOR` | Pengajuan lain | Baris lembur |
| `POST-03` | Setiap transisi status menambah satu baris `riwayat_status` dengan aktor dan alasan bila ada | Riwayat lama | Baris riwayat |
| `POST-04` | Entri yang dibuat HR atas nama karyawan menyimpan penanda pencatat HR | Entri lain | Kolom audit (`D-32`) |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Database | Satu presensi per NIK per tanggal | Dua baris untuk NIK dan tanggal sama |
| `INV-02` | Server | Setiap lembur punya nomor SPL | Lembur tanpa SPL tersimpan |
| `INV-03` | Core dokumen (`ARCH-05`) | Riwayat status hanya lewat core dokumen | Status diubah tanpa baris riwayat |
| `INV-04` | Database | Presensi dan lembur hanya dibaca peran di tabel "Siapa boleh melihat" (01); Supervisor hanya departemennya | Baca di luar lingkup |
| `INV-05` | Database | Karyawan hanya membaca dan menulis baris dengan NIK miliknya (`D-53`) | Karyawan membaca baris orang lain |
| `INV-06` | Server | Presensi `TERVALIDASI` dan periode `REKAP` atau lebih lanjut tidak berubah tanpa `PRE-07` | Perubahan diam-diam setelah validasi |

Transisi legal:
- Presensi dan lembur: `MENUNGGU_VALIDASI_SUPERVISOR` → `TERVALIDASI` (oleh Supervisor, lewat GJ-003); `MENUNGGU_VALIDASI_SUPERVISOR` → `DIBATALKAN` (oleh pemohon dengan alasan, lembur saja).
- Periode: `TERBUKA` → `REKAP` (HR, `D-46`); `REKAP` → `TERBUKA` (koreksi dengan `PRE-07`, `D-47` c); `REKAP` → `TERVALIDASI` (GJ-003); `TERVALIDASI` → `REKAP` (`[USULAN-AGEN]`, `PRE-07`, hanya bila draft belum `DISETUJUI`).
- Tidak ada transisi dari `TERVALIDASI` kembali ke `MENUNGGU_VALIDASI_SUPERVISOR`.

## Failure and recovery semantics

| Kegagalan | Perilaku | Pemulihan |
|---|---|---|
| Presensi ganda | Ditolak | HR atau Karyawan memperbaiki baris yang ada |
| Lembur tanpa SPL | Ditolak | Lengkapi nomor SPL |
| Periode tertutup | Ditolak; arahkan ke jalur koreksi HR | Ajukan koreksi dengan otorisasi |
| Gagal di tengah transisi | Tidak ada transisi parsial | Ulangi |

## Architecture boundaries

Mengikuti `ARCH-001`. Status dokumen lewat `core/dokumen` (`ARCH-05`). Tabel karyawan dimiliki core (`D-31`, lihat GJ-001). Akun Karyawan dibuat `FND-003` dengan RLS (`D-53`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Input tidak valid ditolak | Uji perilaku | — | `Unverified` |
| `B-02` | `actor_id` dan NIK dari klien diabaikan | Uji perilaku | — | `Unverified` |
| `B-03` | RLS menolak peran tanpa izin | Uji database | — | `Unverified` |
| `B-04` | Karyawan tidak membaca presensi orang lain (AC-08) | Uji database | — | `Unverified` |
| `PRE-01` | Peran tanpa izin ditolak (AC-07) | Uji perilaku | — | `Unverified` |
| `PRE-02` | Di luar periode dan periode tertutup ditolak (AC-03, AC-11) | Uji perilaku | — | `Unverified` |
| `PRE-03` | Presensi ganda ditolak (AC-02) | Uji database | — | `Unverified` |
| `PRE-04` | Lembur tanpa SPL ditolak (AC-04) | Uji perilaku | — | `Unverified` |
| `PRE-05` | Pembatalan tanpa alasan atau setelah validasi ditolak (AC-14, AC-15) | Uji perilaku | — | `Unverified` |
| `PRE-06` | Transisi ilegal ditolak | Uji perilaku | — | `Unverified` |
| `PRE-07` | Koreksi tanpa otorisasi atau alasan ditolak (AC-13) | Uji perilaku | — | `Unverified` |
| `POST-01` | Presensi tersimpan (AC-01, AC-10) | Uji perilaku | — | `Unverified` |
| `POST-02` | Lembur tersimpan dengan SPL (AC-05) | Uji perilaku | — | `Unverified` |
| `POST-03` | Riwayat status bertambah (AC-06) | Uji perilaku | — | `Unverified` |
| `POST-04` | Penanda pencatat HR tersimpan (AC-12) | Uji database | — | `Unverified` |
| `INV-01` | Constraint unik presensi | Uji database | — | `Unverified` |
| `INV-02` | Lembur tanpa SPL tidak tersimpan (AC-04) | Uji perilaku | — | `Unverified` |
| `INV-03` | Status hanya lewat core dokumen | Pencarian kode + review | — | `Unverified` |
| `INV-04` | Pembaca presensi sesuai izin (AC-09) | Uji database | — | `Unverified` |
| `INV-05` | Karyawan hanya membaca baris sendiri (AC-08) | Uji database | — | `Unverified` |
| `INV-06` | Presensi tervalidasi tidak berubah diam-diam (AC-11) | Uji perilaku | — | `Unverified` |

Semua aturan `Unverified`.
