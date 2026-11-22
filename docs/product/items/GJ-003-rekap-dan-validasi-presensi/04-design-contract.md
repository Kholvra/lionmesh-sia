# Design Contract: GJ-003 — Rekap dan validasi presensi

- Source: `01-requirement.md`, `02-acceptance-criteria.md`; `decisions.md` (D-08, D-33, D-46, D-47 c, D-48, D-53); `analisis-sia.md` §5.4, §6.9, §8.1; makalah UC-GJ-03, UC-GJ-04
- Status: `Proposed`
- Profile: product app (status dokumen periode, data pribadi)
- Alasan kontrak wajib: menyentuh status dokumen periode dan data pribadi (rekap per karyawan)
- Owner: tech lead

## Intent and non-goals

**Intent.** Payroll hanya boleh dimulai untuk periode yang diperiksa Supervisor per departemen. Setiap perpindahan status punya jejak, dan presensi tervalidasi tidak berubah diam-diam.

**Non-goals.** Pencatatan presensi (GJ-002); hitungan (GJ-004); notifikasi (`C-012`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Aksi rekap, validasi, atau pengembalian → server | Keputusan, alasan, departemen | Parse dan validasi | Nilai bertipe | Tolak dengan pesan |
| `B-02` | Sesi → identitas aktor | Cookie sesi | Dari sesi di server | `actor_id`, peran, dan departemen penugasan | Tolak bila tidak ada sesi; jangan terima `actor_id` dari klien |
| `B-03` | Server → database | Query | RLS per peran dan departemen | Baris yang lolos kebijakan | Tolak di database |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Validasi departemen | Aktor berperan Supervisor Lapangan untuk departemen itu; status periode `REKAP`; aktor bukan pencatat presensi di departemen itu (`D-48`) | Server + RLS | Tolak |
| `PRE-02` | Kembalikan rekap | Alasan terisi; status `REKAP` (`D-48`) | Server | Tolak; sebut alasan |
| `PRE-03` | Mulai payroll | Status periode `TERVALIDASI` | Server + database | Tolak; sebut validasi belum dilakukan |
| `PRE-04` | Simpan rekap | Semua karyawan aktif punya entri pada periode (Q-04) | Server | Tolak; sebut NIK |
| `PRE-05` | Koreksi `TERVALIDASI` → `REKAP` | Otorisasi Manajemen dan alasan; draft belum `DISETUJUI` (`[USULAN-AGEN]`) | Server | Tolak; sebut otorisasi |

## Postconditions

| ID | On success, MUST guarantee | Preserved | Side effects |
|---|---|---|---|
| `POST-01` | Status periode berubah sesuai transisi legal | Data presensi | Baris `riwayat_status` |
| `POST-02` | Riwayat mencatat aktor, waktu, status lama dan baru, dan alasan bila ada | Riwayat lama | — |
| `POST-03` | Saat periode menjadi `TERVALIDASI`, semua departemen punya validasi | Validasi departemen lain | — |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core dokumen (`ARCH-05`) | Setiap transisi punya baris riwayat | Status berubah tanpa riwayat |
| `INV-02` | Server | Payroll tidak mulai tanpa `TERVALIDASI` | Hitung payroll pada `TERBUKA` atau `REKAP` |
| `INV-03` | Server | Presensi tidak berubah saat periode `TERVALIDASI` tanpa `PRE-05` | Perubahan diam-diam setelah validasi |
| `INV-04` | Database | Satu validasi per departemen per periode | Dua validasi untuk departemen yang sama |

Transisi legal:
- `TERBUKA` → `REKAP` (HR, `D-46`).
- `REKAP` → `TERVALIDASI` (Supervisor semua departemen, `D-46`).
- `REKAP` → `TERBUKA` (Supervisor mengembalikan dengan alasan, `D-47` c).
- `TERVALIDASI` → `REKAP` (`[USULAN-AGEN]`, `PRE-05`, hanya bila draft belum `DISETUJUI`). Diikuti validasi ulang.
- Tidak ada transisi `TERVALIDASI` → `TERBUKA` langsung.

## Failure and recovery semantics

| Kegagalan | Perilaku | Pemulihan |
|---|---|---|
| Validasi gagal di tengah | Status tidak berubah | Ulangi |
| Transisi ilegal | Ditolak | Pengguna memakai jalur yang benar |
| Pengembalian satu departemen | Periode kembali `TERBUKA`; validasi departemen lain dihapus | HR memperbaiki, rekap ulang |

## Architecture boundaries

Mengikuti `ARCH-001`: status lewat core dokumen (`ARCH-05`). Pengingat ke Supervisor lewat `C-012` (notifikasi, belum dikerjakan item ini).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Alasan kosong ditolak | Uji perilaku | — | `Unverified` |
| `B-02` | `actor_id` dari klien diabaikan | Uji perilaku | — | `Unverified` |
| `B-03` | RLS membatasi validasi ke departemen penugasan | Uji database | — | `Unverified` |
| `PRE-01` | Pengguna selain Supervisor departemen, dan pencatat sendiri, ditolak (AC-04, AC-09) | Uji perilaku | — | `Unverified` |
| `PRE-02` | Kembalikan tanpa alasan ditolak (AC-10) | Uji perilaku | — | `Unverified` |
| `PRE-03` | Mulai payroll tanpa tervalidasi ditolak (AC-05) | Uji perilaku | — | `Unverified` |
| `PRE-04` | Rekap dengan karyawan tanpa entri ditolak (AC-08) | Uji perilaku | — | `Unverified` |
| `PRE-05` | Koreksi tanpa otorisasi ditolak (AC-06); dengan otorisasi diterima (AC-07) | Uji perilaku | — | `Unverified` |
| `POST-01` | Status sesuai transisi (AC-01 sampai AC-03) | Uji perilaku | — | `Unverified` |
| `POST-02` | Riwayat lengkap dengan alasan (AC-02, AC-03) | Uji database | — | `Unverified` |
| `POST-03` | Periode `TERVALIDASI` hanya bila semua departemen tervalidasi (AC-02, AC-11) | Uji perilaku | — | `Unverified` |
| `INV-01` | Setiap transisi punya riwayat | Uji database | — | `Unverified` |
| `INV-02` | Payroll tidak mulai tanpa tervalidasi (AC-05) | Uji perilaku | — | `Unverified` |
| `INV-03` | Presensi tervalidasi tidak berubah diam-diam (AC-06) | Uji perilaku | — | `Unverified` |
| `INV-04` | Satu validasi per departemen per periode | Uji database | — | `Unverified` |

Semua aturan `Unverified`.
