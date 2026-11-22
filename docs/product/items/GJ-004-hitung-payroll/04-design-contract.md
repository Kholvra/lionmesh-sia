# Design Contract: GJ-004 — Hitung draft payroll per periode

- Source: `01-requirement.md`, `02-acceptance-criteria.md`; `decisions.md` (D-08, D-19, D-25, D-33, D-35, D-41, D-43, D-46, D-48, D-51); `analisis-sia.md` §7.2, §8.2 #20, §9.1 G7; `EPIC-GJ`
- Status: `Proposed`
- Profile: product app (uang, status dokumen, data pribadi)
- Alasan kontrak wajib: menyentuh uang, status dokumen, dan data pribadi
- Owner: tech lead

## Intent and non-goals

**Intent.** Setiap angka payroll bisa dihitung ulang dari data dan tabel tarif yang sama. Setiap draft punya rincian yang bisa diaudit, dan tidak ada draft parsial yang tersimpan.

**Non-goals.** Pembayaran dan slip (GJ-006); jurnal (GJ-007); isi tabel tarif (proses data, `D-33`); penyesuaian tahunan PPh 21 penuh.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Tabel tarif → hitungan | Nilai tarif berversi | Pilih versi dengan `berlaku_dari` ≤ tanggal akhir periode (P-09); validasi jumlah baris dan kategori saat seed | Nilai tervalidasi | Tolak bila tidak ada versi; jangan menebak |
| `B-02` | Input override → server | Komponen, nilai, alasan | Parse; alasan wajib (`D-48`) | Nilai dan alasan tercatat | Tolak tanpa alasan |
| `B-03` | Sesi → identitas aktor | Cookie sesi | Dari sesi | `actor_id` dan peran | Tolak bila tidak ada sesi |
| `B-04` | Presensi dan karyawan → hitungan | Data sumber | Lewat service core (`D-25`) | Data tervalidasi | Tolak bila tidak tervalidasi |

`B-01` penting: tabel tarif diisi dari luar dan bisa salah. Hitungan harus menolak, bukan menebak.

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Hitung draft | Periode `TERVALIDASI` (`GJ-003`) | Server | Tolak (AC-03) |
| `PRE-02` | Hitung draft | Versi tarif berlaku ada untuk setiap tabel yang dipakai | Server | Tolak; sebut tabel dan periode (AC-04) |
| `PRE-03` | Hitung draft | Gaji pokok histori ada untuk periode (GJ-001) | Server | Tolak; sebut karyawan |
| `PRE-04` | Override | Alasan terisi (`D-48`) | Server | Tolak (AC-09) |
| `PRE-05` | Hitung draft atau ubah | Draft belum `DISETUJUI` (GJ-005) | Server + database | Tolak; sebut kunci (AC-04 GJ-005) |
| `PRE-06` | Hitung draft | Setiap karyawan aktif pada periode punya presensi tervalidasi, atau karyawan itu ditandai dan dilewati (AC-10) | Server | Karyawan ditandai; tidak diberi angka |
| `PRE-07` | Koreksi PPh 21 bulan terakhir | Alasan terisi (`D-51(b)`) | Server | Tolak (AC-13) |

## Postconditions

| ID | On success, MUST guarantee | Preserved | Side effects |
|---|---|---|---|
| `POST-01` | Draft tersimpan lengkap untuk semua karyawan yang diberi angka, atau tidak ada yang tersimpan | Data sumber | Baris draft dan rincian |
| `POST-02` | Setiap angka dapat ditelusuri ke versi tarif dan data sumber (AC-15) | Versi tarif lama | Referensi versi per tabel |
| `POST-03` | Status `DRAFT_TERHITUNG` dan `riwayat_status` bertambah | Riwayat lama | Baris riwayat |
| `POST-04` | Selisih pembulatan tampil sebagai komponen tersendiri (AC-12) | Komponen lain | — |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Hitungan | Hitung ulang dengan input sama menghasilkan output sama (gerbang EPIC-GJ 2) (AC-02) | Hasil berbeda pada input sama |
| `INV-02` | Hitungan | Angka draft tidak berubah karena perubahan versi tarif yang lebih baru (AC-05) | Draft lama berubah setelah tarif baru |
| `INV-03` | Server | Override selalu punya alasan dan jejak (AC-09) | Override diam-diam |
| `INV-04` | Database | Tidak ada draft parsial yang tersimpan (AC-14) | Draft setengah jadi |
| `INV-05` | Hitungan | Total nominal bersih = penambah − pengurang, dengan pembulatan per komponen (AC-12) | Total tidak balance |
| `INV-06` | Server | Draft tidak membuat jurnal (`D-43`, GJ-007) | Jurnal dibuat dari hitungan |

Transisi legal: `(tidak ada)` → `DRAFT_TERHITUNG`; `DRAFT_TERHITUNG` → `DRAFT_TERHITUNG` (hitung ulang menimpa, P-07); `REVISI` → `DRAFT_TERHITUNG` (`D-46`, AC-16).

## Failure and recovery semantics

| Kegagalan | Perilaku | Pemulihan |
|---|---|---|
| Versi tarif tidak ada | Ditolak; tidak ada draft tersimpan | Isi tabel tarif, lalu hitung ulang |
| Gagal di tengah hitungan | Rollback seluruh draft (AC-14) | Hitung ulang |
| Data sumber berubah setelah hitungan | Draft lama tetap; hitung ulang diperlukan | Hitung ulang (P-07) |
| Karyawan tanpa presensi tervalidasi | Karyawan ditandai dan dilewati | Lengkapi data lalu hitung ulang |

## Architecture boundaries

Mengikuti `ARCH-001`. Hitungan memakai service core untuk presensi dan karyawan (`ARCH-08`). Jurnal tidak ditulis di item ini (`ARCH-03`). Status lewat core dokumen (`ARCH-05`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Tanpa versi berlaku ditolak (AC-04) | Uji perilaku | — | `Unverified` |
| `B-02` | Override tanpa alasan ditolak (AC-09) | Uji perilaku | — | `Unverified` |
| `B-03` | `actor_id` dari klien diabaikan | Uji perilaku | — | `Unverified` |
| `B-04` | Data tidak tervalidasi tidak dihitung (AC-10) | Uji perilaku | — | `Unverified` |
| `PRE-01` | Periode belum tervalidasi ditolak (AC-03) | Uji perilaku | — | `Unverified` |
| `PRE-02` | Tabel tanpa versi ditolak (AC-04) | Uji perilaku | — | `Unverified` |
| `PRE-03` | Histori kosong ditolak | Uji perilaku | — | `Unverified` |
| `PRE-04` | Override tanpa alasan ditolak (AC-09) | Uji perilaku | — | `Unverified` |
| `PRE-05` | Draft `DISETUJUI` tidak dihitung ulang (AC-04 GJ-005) | Uji perilaku | — | `Unverified` |
| `PRE-06` | Karyawan tanpa presensi ditandai, bukan diberi angka (AC-10) | Uji perilaku | — | `Unverified` |
| `PRE-07` | PPh 21 bulan terakhir tanpa alasan ditolak (AC-13) | Uji perilaku | — | `Unverified` |
| `POST-01` | Draft lengkap atau tidak sama sekali (AC-14) | Uji database | — | `Unverified` |
| `POST-02` | Telusur ke versi tarif (AC-15) | Uji database | — | `Unverified` |
| `POST-03` | Status dan riwayat (AC-01, AC-16) | Uji perilaku | — | `Unverified` |
| `POST-04` | Selisih pembulatan tampil (AC-12) | Uji perilaku | — | `Unverified` |
| `INV-01` | Hitung ulang identik (AC-02) | Skrip pembanding | — | `Unverified` |
| `INV-02` | Perubahan tarif tidak mengubah draft (AC-05) | Uji perilaku | — | `Unverified` |
| `INV-03` | Override tercatat (AC-09) | Uji perilaku | — | `Unverified` |
| `INV-04` | Kegagalan di tengah tidak menyisakan draft (AC-14) | Uji database | — | `Unverified` |
| `INV-05` | Balance dengan pembulatan (AC-12) | Skrip pembanding | — | `Unverified` |
| `INV-06` | Tidak ada jurnal dari hitungan | Pencarian kode + review | — | `Unverified` |

Semua aturan `Unverified`.
