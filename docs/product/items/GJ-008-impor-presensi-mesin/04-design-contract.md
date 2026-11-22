# Design Contract: GJ-008 — Impor presensi dari mesin absensi

- Source: `01-requirement.md`, `02-acceptance-criteria.md`; `decisions.md` (D-01, D-25, D-32, D-39, D-47, D-52, D-53); `analisis-sia.md` §5.6, §9.3 G19
- Status: `Proposed`
- Profile: product app (trust boundary berkas impor; data pribadi; status presensi)
- Alasan kontrak wajib: menerima berkas dari luar (trust boundary) dan menulis presensi (status dokumen) serta data pribadi (ID mesin, NIK)
- Owner: tech lead

## Intent and non-goals

**Intent.** Berkas dari luar tidak pernah dipercaya mentah. Setiap baris dipetakan, dilewati dengan alasan, atau ditolak seluruh berkas. Tidak ada baris yang masuk diam-diam, dan tidak ada presensi yang tertimpa.

**Non-goals.** Merek atau protokol mesin (`D-52`); pencatatan manual (GJ-002); validasi (GJ-003); konektor API.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Berkas CSV → server | Baris presensi dari berkas | Format sesuai profil (pemisah, tanggal, jam); tipe; panjang; baris rusak menggagalkan seluruh berkas | Baris tervalidasi | Tolak sebelum simpan (AC-02, AC-04) |
| `B-02` | Pemetaan ID → NIK | ID mesin dari berkas | Hanya NIK karyawan aktif yang ada; satu ID satu NIK (AC-10, AC-13) | NIK tepercaya | Tampilkan sebagai tidak terpetakan |
| `B-03` | Sesi → identitas aktor | Cookie sesi | Dari sesi di server | `actor_id` dan peran | Tolak bila tidak ada sesi atau peran bukan HR |
| `B-04` | Berkas → penyimpanan | Hash isi berkas | Hash dihitung di server dari isi; tidak dari nama berkas | Identitas berkas | Tolak bila sudah pernah diimpor (AC-05) |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Impor | Aktor berperan HR (`D-52`, `[USULAN-AGEN]`) | Server + RLS | Tolak (AC-08) |
| `PRE-02` | Impor | Format berkas sesuai profil pemetaan dan berkas tidak kosong | Server | Tolak sebelum simpan (AC-02, AC-12) |
| `PRE-03` | Impor | Periode tanggal semua baris berstatus `TERBUKA` (`D-53`, `D-47` c) | Server | Tolak; sebut periode tertutup (AC-07) |
| `PRE-04` | Impor | Berkas belum pernah diimpor (hash belum ada) (AC-05) | Server + database (unique hash) | Tolak |
| `PRE-05` | Tambah pemetaan | ID mesin belum dipetakan ke NIK lain; NIK aktif (AC-10, AC-13) | Server + database (unique ID profil) | Tolak; sebut ID atau NIK |

## Postconditions

| ID | On success, MUST guarantee | Preserved | Side effects |
|---|---|---|---|
| `POST-01` | Hanya baris valid dan terpetakan yang tersimpan sebagai presensi `MENUNGGU_VALIDASI_SUPERVISOR` dengan penanda sumber impor (AC-01) | Presensi manual lain | Baris presensi |
| `POST-02` | Daftar baris dilewati (tidak terpetakan, tidak lengkap, bentrok, di luar periode) tampil dengan alasan (AC-03, AC-06) | — | — |
| `POST-03` | Ringkasan dan jejak aktor, waktu, dan jumlah tersimpan, dilewati, bentrok tercatat (`D-32`) (AC-14) | Jejak lama | Baris log impor (bukan status) |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Database | Satu presensi per NIK per tanggal (dari GJ-002) (AC-06) | Dua baris untuk NIK dan tanggal sama |
| `INV-02` | Server | Impor atomik per berkas untuk kegagalan format atau baris rusak: tidak ada baris parsial dari berkas gagal (AC-04) | Sebagian baris tersimpan dari berkas yang ditolak |
| `INV-03` | Database | Berkas dengan hash yang sama tidak menambah baris (AC-05) | Impor ulang menggandakan baris |
| `INV-04` | Server | Presensi manual yang sudah ada tidak diubah oleh impor (AC-06) | Penimpaan diam-diam |
| `INV-05` | Database | Tidak ada status impor tersimpan (`D-47`) | Kolom status impor `diunggah`, `diproses`, `selesai`, atau `gagal` |

Transisi: hanya presensi, mengikuti GJ-002 (`MENUNGGU_VALIDASI_SUPERVISOR`). Tidak ada transisi khusus impor.

## Failure and recovery semantics

| Kegagalan | Perilaku | Pemulihan |
|---|---|---|
| Format salah | Seluruh berkas ditolak (AC-02) | Perbaiki profil atau berkas |
| Baris rusak di tengah | Seluruh berkas ditolak; pesan nomor baris (AC-04) | Perbaiki berkas, impor ulang |
| Gagal di tengah simpan | Rollback seluruh berkas (`INV-02`) | Impor ulang |
| Berkas identik | Ditolak (AC-05) | Tidak perlu tindakan |

## Architecture boundaries

Mengikuti `ARCH-001`: presensi lewat aturan GJ-002 (`D-25`); karyawan lewat service core (`ARCH-08`). Profil pemetaan dimiliki modul GJ-008 (bukan tabel domain bersama). Format berkas tidak dikunci merek (`D-52`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Format salah dan baris rusak ditolak (AC-02, AC-04) | Uji perilaku | — | `Unverified` |
| `B-02` | ID tanpa NIK tidak tersimpan (AC-03) | Uji perilaku | — | `Unverified` |
| `B-03` | Peran bukan HR ditolak (AC-08); `actor_id` dari klien diabaikan | Uji perilaku | — | `Unverified` |
| `B-04` | Berkas identik ditolak (AC-05) | Uji database | — | `Unverified` |
| `PRE-01` | Peran tanpa izin ditolak (AC-08) | Uji perilaku | — | `Unverified` |
| `PRE-02` | Format salah dan berkas kosong ditolak (AC-02, AC-12) | Uji perilaku | — | `Unverified` |
| `PRE-03` | Periode tertutup ditolak (AC-07) | Uji perilaku | — | `Unverified` |
| `PRE-04` | Berkas ulang ditolak (AC-05) | Uji database | — | `Unverified` |
| `PRE-05` | ID ganda dan NIK nonaktif ditolak (AC-10, AC-13) | Uji database | — | `Unverified` |
| `POST-01` | Baris terpetakan tersimpan (AC-01, AC-09) | Uji database | — | `Unverified` |
| `POST-02` | Daftar baris dilewati tampil (AC-03, AC-06) | Uji perilaku | — | `Unverified` |
| `POST-03` | Ringkasan dan jejak tercatat (AC-14) | Uji database | — | `Unverified` |
| `INV-01` | Duplikat presensi ditolak (AC-06) | Uji database | — | `Unverified` |
| `INV-02` | Impor gagal tidak parsial (AC-04) | Uji perilaku | — | `Unverified` |
| `INV-03` | Impor ulang tidak menambah baris (AC-05) | Uji database | — | `Unverified` |
| `INV-04` | Presensi manual tidak ditimpa (AC-06) | Uji perilaku | — | `Unverified` |
| `INV-05` | Tidak ada kolom status impor | Pencarian skema + review | — | `Unverified` |

Semua aturan `Unverified`.
