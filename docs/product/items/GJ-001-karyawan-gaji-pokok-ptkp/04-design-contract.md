# Design Contract: GJ-001 — Data karyawan, gaji pokok, dan PTKP

- Source: `01-requirement.md`, `02-acceptance-criteria.md`; `docs/product/decisions.md` (D-19, D-25, D-31, D-33, D-50, D-51(b), D-51(d), D-53); `reference/analisis-sia.md` §7.2, §8.1
- Status: `Proposed`
- Profile: product app (data master, histori, data pribadi)
- Alasan kontrak wajib: menyentuh uang (gaji pokok), data pribadi (NIK, rekening, gaji, PTKP), dan batas modul (`D-25`)
- Owner: tech lead

## Intent and non-goals

**Intent.** Gaji pokok tersimpan sebagai histori yang tidak bisa ditimpa, NIK unik, dan data pribadi hanya dibaca peran yang diizinkan. Akun karyawan tidak membaca data karyawan mana pun.

**Non-goals.** Tarif lembur, BPJS, PPh 21, dan prorata (GJ-004); presensi (GJ-002); tampilan slip (GJ-006); pembuatan akun karyawan (FND-003 dan GJ-002).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Form HR → server action | NIK, nama, gaji, tanggal berlaku, PTKP, rekening | Parse dan validasi skema di server | Nilai bertipe | Tolak dengan pesan; jangan teruskan |
| `B-02` | Sesi → identitas aktor | Cookie sesi | Ambil pengguna dari sesi di server | `actor_id` dan peran | Tolak bila tidak ada sesi; jangan terima `actor_id` dari klien |
| `B-03` | Server → database | Query | RLS per peran dan constraint | Baris yang lolos kebijakan | Tolak di database |
| `B-04` | Akun Karyawan → data karyawan | Permintaan baca atau tulis | RLS: tidak ada baris karyawan yang dapat dibaca peran Karyawan (`D-53`) | Tidak ada baris | Tolak di database |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Simpan karyawan atau gaji pokok | Aktor berperan HR (`D-33`) | Server | Tolak sebelum menyentuh data |
| `PRE-02` | Simpan karyawan | NIK 16 digit numerik dan belum dipakai (`D-51(d)`) | Server + database (constraint) | Tolak; sebut NIK atau format |
| `PRE-03` | Simpan gaji pokok | Tanggal berlaku terisi dan tidak sama dengan entri lain karyawan yang sama | Server + database (unik per karyawan dan tanggal) | Tolak; sebut tanggal |
| `PRE-04` | Simpan PTKP | Kategori ada di daftar aktif tabel berversi (`D-19`) | Server | Tolak; sebut kategori yang dikenal |
| `PRE-05` | Simpan rekening | Nama bank, nomor, dan nama pemilik terisi (`D-51(d)`) | Server | Tolak; sebut bagian kosong |
| `PRE-06` | Pilih karyawan untuk dokumen baru | Status master AKTIF (`D-50`) | Server | Tolak; sebut status nonaktif |

## Postconditions

| ID | On success, MUST guarantee | Preserved | Side effects |
|---|---|---|---|
| `POST-01` | Karyawan tersimpan dengan NIK unik | Data karyawan lain | Baris karyawan |
| `POST-02` | Gaji pokok baru menambah satu baris histori | Semua baris histori lama | Tidak ada perubahan status tersimpan (`D-47`) |
| `POST-03` | Perubahan mencatat aktor dan waktu | Jejak lama | Kolom audit (`D-32`) |
| `POST-04` | Karyawan nonaktif menyimpan tanggal keluar; data dan riwayat tetap ada | Riwayat gaji dan presensi | Status master NONAKTIF (`D-50`) |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Database | NIK unik di seluruh karyawan | Dua karyawan dengan NIK sama |
| `INV-02` | Server | Baris histori gaji pokok tidak diubah nominalnya dan tidak dihapus | `UPDATE` atau `DELETE` pada nominal yang sudah tersimpan |
| `INV-03` | Tech lead | Modul GJ-002..GJ-007 tidak membaca tabel karyawan langsung; lewat service core (`ARCH-08`, `D-31`) | Query langsung ke tabel karyawan dari modul |
| `INV-04` | Database | Field pribadi hanya dibaca peran di tabel "Siapa boleh melihat" (01); selain itu tidak kembali | Peran di luar daftar menerima NIK, rekening, gaji, atau PTKP |
| `INV-05` | Database | Peran Karyawan tidak membaca baris karyawan (`D-53`) | Akun Karyawan membaca baris karyawan manapun |

## Failure and recovery semantics

| Kegagalan | Perilaku | Pemulihan |
|---|---|---|
| NIK duplikat atau format salah | Ditolak, tidak ada baris | Pengguna memperbaiki NIK |
| Tanggal berlaku bentrok | Ditolak, tidak ada baris | Pengguna memilih tanggal lain |
| Gagal simpan di tengah | Tidak ada perubahan parsial | Ulangi |
| Gaji salah sudah tersimpan | Entri baru dengan tanggal berlaku sama atau sesudahnya (AC-04) | Entri lama tetap |

## Architecture boundaries

Mengikuti `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`. Tabel `karyawan` dimiliki `core/` (`D-31`); aturan `ARCH-08` tetap `Unverified` sampai diverifikasi. Peran Karyawan dibuat oleh `FND-003` (`D-53`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Input tidak valid ditolak dengan pesan | Uji perilaku | — | `Unverified` |
| `B-02` | `actor_id` dari klien diabaikan | Uji perilaku | — | `Unverified` |
| `B-03` | RLS menolak peran tanpa izin | Uji database | — | `Unverified` |
| `B-04` | Peran Karyawan tidak membaca karyawan (AC-13) | Uji database | — | `Unverified` |
| `PRE-01` | Peran tanpa izin ditolak (AC-07) | Uji perilaku | — | `Unverified` |
| `PRE-02` | NIK duplikat dan format salah ditolak (AC-02, AC-14) | Uji perilaku | — | `Unverified` |
| `PRE-03` | Tanggal berlaku sama ditolak (AC-11) | Uji database | — | `Unverified` |
| `PRE-04` | Kategori PTKP tidak dikenal ditolak (AC-06) | Uji perilaku | — | `Unverified` |
| `PRE-05` | Rekening tidak lengkap ditolak (AC-15) | Uji perilaku | — | `Unverified` |
| `PRE-06` | Karyawan nonaktif tidak dipilih (AC-12) | Uji perilaku | — | `Unverified` |
| `POST-01` | Karyawan tersimpan (AC-01) | Uji perilaku | — | `Unverified` |
| `POST-02` | Histori tidak tertimpa (AC-03, AC-04) | Uji perilaku | — | `Unverified` |
| `POST-03` | Aktor dan waktu tercatat (AC-09) | Uji perilaku | — | `Unverified` |
| `POST-04` | Nonaktif dengan tanggal keluar; riwayat tetap (AC-12) | Uji perilaku | — | `Unverified` |
| `INV-01` | Constraint unik NIK | Uji database | — | `Unverified` |
| `INV-02` | Tidak ada UPDATE/DELETE pada histori | Pencarian kode + uji | — | `Unverified` |
| `INV-03` | Tidak ada query langsung ke tabel karyawan dari modul | Pencarian SQL + review | — | `Unverified` |
| `INV-04` | Field pribadi hanya untuk pembaca yang diizinkan (AC-08) | Uji database + uji perilaku | — | `Unverified` |
| `INV-05` | Peran Karyawan tidak membaca karyawan (AC-13) | Uji database | — | `Unverified` |

Semua aturan `Unverified`. Persetujuan kontrak bukan bukti.
