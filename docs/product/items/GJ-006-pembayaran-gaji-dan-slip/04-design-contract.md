# Design Contract: GJ-006 — Pembayaran gaji dan cetak slip

- Source: `01-requirement.md`, `02-acceptance-criteria.md`; `decisions.md` (D-07, D-08, D-33, D-35, D-41, D-42, D-46, D-47, D-49, D-51(d), D-53); `analisis-sia.md` §6.9, §8.1
- Status: `Proposed`
- Profile: product app (uang, status dokumen, data pribadi, bukti)
- Alasan kontrak wajib: menyentuh uang, status dokumen, dan data pribadi (rekening, nominal, slip)
- Owner: tech lead

## Intent and non-goals

**Intent.** Setiap pembayaran tercatat per karyawan dengan bukti. Kegagalan terlihat dan hanya bisa diulang dengan alasan. Slip hanya terbit untuk karyawan yang sudah `DIBAYAR`.

**Non-goals.** Jurnal (`GJ-007`); integrasi bank (menunggu konfirmasi); portal karyawan (`D-53`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Hasil transfer → server | Status per karyawan, nominal, referensi | Parse; nominal dari draft, bukan dari klien | Nilai tervalidasi | Tolak |
| `B-02` | Berkas bukti → penyimpanan | Lampiran bukti batch | Tipe dan ukuran (T-04) | Berkas tersimpan | Tolak |
| `B-03` | Sesi → identitas aktor | Cookie sesi | Dari sesi | `actor_id`, peran, dan pencatat draft | Tolak |
| `B-04` | Akun Karyawan → slip | Baca slip | RLS: tidak ada baris slip untuk peran Karyawan (`D-53`) | Tidak ada baris | Tolak di database |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Kirim batch | Draft `DISETUJUI`; aktor Finance | Server | Tolak (AC-08) |
| `PRE-02` | Status `DIBAYAR` per karyawan | Bukti batch ada (AC-07) | Server | Tolak |
| `PRE-03` | Cetak slip | Status karyawan `DIBAYAR`; aktor HR (AC-10) | Server | Tolak |
| `PRE-04` | Percobaan ulang | Status karyawan `GAGAL_TRANSFER`; alasan terisi (`D-49`, AC-04) | Server | Tolak |
| `PRE-05` | Catat pembayaran | Pencatat bukan penghitung draft (`D-42`, AC-11) | Server | Tolak |
| `PRE-06` | Masuk batch | Rekening lengkap (`D-51(d)`, AC-12) | Server | Karyawan dilewati; daftar tampil |
| `PRE-07` | Slip pengganti | Alasan terisi (AC-14) | Server | Tolak |

## Postconditions

| ID | On success, MUST guarantee | Preserved | Side effects |
|---|---|---|---|
| `POST-01` | Status per karyawan dan draft sesuai transisi (AC-01, AC-02, AC-05) | Nominal draft | Riwayat |
| `POST-02` | Bukti tersimpan dengan referensi per karyawan | Bukti lama | Berkas |
| `POST-03` | Cetak slip tercatat dengan nomor, aktor, dan waktu (AC-09) | Slip lama | Baris slip |
| `POST-04` | Slip pengganti tercatat dan slip lama tidak berubah (AC-14) | Slip lama | Baris slip baru |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Server | Kegagalan tidak tercatat sebagai `DIBAYAR`; draft `DIBAYAR` hanya bila semua karyawan `DIBAYAR` (AC-05) | `GAGAL_TRANSFER` ditampilkan sebagai lunas |
| `INV-02` | Server | Karyawan `DIBAYAR` tidak masuk batch ulang (AC-15) | Pembayaran ganda diam-diam |
| `INV-03` | Core dokumen (`ARCH-05`) | Setiap transisi punya riwayat | Status berubah tanpa riwayat |
| `INV-04` | Database | Rekening dan nominal hanya dibaca peran di tabel "Siapa boleh melihat" (AC-17) | Baca di luar lingkup |
| `INV-05` | Database | Slip tidak dibaca peran Karyawan (AC-16) | Slip terbaca dari akun Karyawan |

Transisi legal: karyawan `DISETUJUI` (dalam batch) → `DIBAYAR` atau `GAGAL_TRANSFER`; `GAGAL_TRANSFER` → `DIBAYAR` (percobaan ulang dengan alasan). Draft: `DISETUJUI` → `DIBAYAR` atau `GAGAL_TRANSFER` (agregat). Tidak ada `PARSIAL`.

## Failure and recovery semantics

| Kegagalan | Perilaku | Pemulihan |
|---|---|---|
| Transfer sebagian gagal | Karyawan gagal `GAGAL_TRANSFER`; yang berhasil `DIBAYAR` (AC-06) | Percobaan ulang untuk yang gagal dengan alasan |
| Gagal di tengah pencatatan | Tidak ada status parsial yang tidak tercatat | Ulangi |
| Dana tidak cukup | Batch tidak diproses; draft tetap `DISETUJUI` (AC-13) | Tunggu dana, lalu kirim batch |
| Rekening tidak lengkap | Karyawan dilewati (AC-12) | HR memperbaiki data rekening (GJ-001), lalu batch berikutnya |

## Architecture boundaries

Mengikuti `ARCH-001`. Jurnal pembayaran lewat `core/ledger` (`ARCH-03`), disusun di GJ-007. Status lewat `core/dokumen` (`ARCH-05`). Akun bank dan utang gaji dirujuk lewat peran (`D-35`, `D-41`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Nominal dari draft, bukan dari klien | Uji perilaku | — | `Unverified` |
| `B-02` | Jenis berkas tidak valid ditolak | Uji perilaku | — | `Unverified` |
| `B-03` | `actor_id` dari klien diabaikan | Uji perilaku | — | `Unverified` |
| `B-04` | Akun Karyawan tidak membaca slip (AC-16) | Uji database | — | `Unverified` |
| `PRE-01` | Bayar sebelum disetujui ditolak (AC-08) | Uji perilaku | — | `Unverified` |
| `PRE-02` | Dibayar tanpa bukti ditolak (AC-07) | Uji perilaku | — | `Unverified` |
| `PRE-03` | Slip sebelum dibayar ditolak (AC-10) | Uji perilaku | — | `Unverified` |
| `PRE-04` | Percobaan ulang tanpa alasan atau dari status salah ditolak (AC-04) | Uji perilaku | — | `Unverified` |
| `PRE-05` | Penghitung draft membayar gaji ditolak (AC-11) | Uji perilaku | — | `Unverified` |
| `PRE-06` | Rekening tidak lengkap tidak masuk batch (AC-12) | Uji perilaku | — | `Unverified` |
| `PRE-07` | Slip pengganti tanpa alasan ditolak (AC-14) | Uji perilaku | — | `Unverified` |
| `POST-01` | Status sesuai (AC-01 sampai AC-03, AC-05, AC-06) | Uji perilaku | — | `Unverified` |
| `POST-02` | Bukti tersimpan per karyawan | Uji database | — | `Unverified` |
| `POST-03` | Slip tercatat (AC-09) | Uji perilaku | — | `Unverified` |
| `POST-04` | Slip pengganti tidak mengubah slip lama (AC-14) | Uji database | — | `Unverified` |
| `INV-01` | Gagal tidak dihitung lunas (AC-02, AC-05) | Uji perilaku | — | `Unverified` |
| `INV-02` | Pembayaran ganda ditolak (AC-15) | Uji database | — | `Unverified` |
| `INV-03` | Setiap transisi punya riwayat | Uji database | — | `Unverified` |
| `INV-04` | Rekening dan nominal sesuai izin (AC-17) | Uji perilaku | — | `Unverified` |
| `INV-05` | Slip tidak terbaca Karyawan (AC-16) | Uji database | — | `Unverified` |

Semua aturan `Unverified`.
