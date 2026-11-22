# Design Contract: GJ-007 — Jurnal dan laporan payroll

- Source: `01-requirement.md`, `02-acceptance-criteria.md`; `decisions.md` (D-07, D-25, D-35, D-41, D-43, D-44, D-46, D-49, D-50); `analisis-sia.md` §6.7, §6.9, §8.3
- Status: `Proposed`
- Profile: product app (uang, jurnal)
- Alasan kontrak wajib: menyentuh uang dan batas modul (`D-07`, `D-25`)
- Owner: tech lead

## Intent and non-goals

**Intent.** Setiap rupiah payroll tercatat di buku besar pada periode yang benar (akrual saat disetujui, pembayaran saat dibayar), dengan jejak. Laporan payroll dan TKL tidak bisa berbeda dengan buku besar.

**Non-goals.** Penetapan akun dan nomor (`FND-006`); tutup buku (`C-010`); laporan keuangan gabungan (`C-009`); HPP produksi (`PR-006`); pembebanan TKL ke WIP (track Produksi, `D-44` 4); penyetoran BPJS dan PPh 21 ke negara.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Data payroll (draft, pembayaran) → jurnal | Nominal per komponen dan tipe karyawan | Nilai dari draft `DISETUJUI` atau pembayaran `DIBAYAR`; bukan dari klien | Baris jurnal tervalidasi | Tolak |
| `B-02` | Tipe karyawan → peran beban | Tipe Produksi atau Non-Produksi | Pemetaan tetap; nilai di luar pemetaan ditolak | Peran tepercaya | Tolak |
| `B-03` | Jurnal → buku besar | Baris jurnal | `postJournal()` saja (`D-07`) | Jurnal balance | Tolak seluruh |
| `B-04` | Sesi → laporan | Permintaan laporan | Peran dari sesi; RLS per laporan | Data sesuai izin | Tolak |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Posting jurnal | Total debit = total kredit; peran akun aktif dan terpetakan; periode akuntansi terbuka | Core ledger (`ARCH-03`) | Tolak; tidak ada baris (AC-03, AC-04) |
| `PRE-02` | Jurnal akrual | Status payroll `DISETUJUI` (`D-49`) | Server | Tolak (AC-01, AC-02) |
| `PRE-03` | Jurnal akrual | Belum ada jurnal akrual untuk payroll periode itu | Database | Tolak (AC-06) |
| `PRE-04` | Jurnal pembayaran | Status karyawan `DIBAYAR` pada transfer berhasil (`D-49`) | Server | Tolak (AC-12) |
| `PRE-05` | Jurnal pembayaran | Belum ada jurnal pembayaran untuk karyawan dan transfer sukses yang sama | Database | Tolak (AC-13) |

## Postconditions

| ID | On success, MUST guarantee | Preserved | Side effects |
|---|---|---|---|
| `POST-01` | Jurnal akrual balance tersimpan dalam transaksi yang sama dengan `DISETUJUI` (AC-01) | Jurnal lain | Baris jurnal dan detail |
| `POST-02` | Jurnal pembayaran per karyawan tersimpan saat `DIBAYAR` (AC-11) | Jurnal lain | Baris jurnal dan detail |
| `POST-03` | Laporan dan jurnal memakai angka yang sama (AC-07, AC-08) | Data sumber | — |
| `POST-04` | Jenis transaksi asal, nomor transaksi asal, dan pemicu tersimpan di setiap jurnal (`D-43`) | — | — |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core ledger (`ARCH-03`) | Total debit = total kredit untuk setiap jurnal (AC-03, AC-15) | Jurnal tidak balance tersimpan |
| `INV-02` | Core ledger | Jurnal yang sudah diposting tidak diubah (AC-09) | `UPDATE` pada baris jurnal |
| `INV-03` | Server | Satu jurnal akrual per payroll periode (AC-06) | Dua jurnal akrual untuk satu payroll |
| `INV-04` | Tech lead | Tidak ada tulis langsung ke tabel jurnal dari modul (`ARCH-03`) | Modul menulis tabel jurnal |
| `INV-05` | Server | Jurnal pembayaran tidak dibuat untuk karyawan yang belum `DIBAYAR` (AC-12) | Saldo `utang_gaji` berkurang tanpa pembayaran |
| `INV-06` | Server | Pembayaran tidak dijurnal dua kali (AC-13) | Dua jurnal pembayaran untuk satu transfer sukses |
| `INV-07` | Laporan | Laporan membaca buku besar, tidak menghitung ulang dari tabel transaksi (`D-43`) | Laporan dari sumber selain buku besar |

Transisi pemicu: `DISETUJUI` → jurnal akrual (dalam transaksi yang sama); `DIBAYAR` per karyawan → jurnal pembayaran; `DIPOSTING` = semua jurnal pembayaran draft sudah ada (`D-46`, J-03).

## Failure and recovery semantics

| Kegagalan | Perilaku | Pemulihan |
|---|---|---|
| Jurnal tidak balance | Transaksi dibatalkan seluruhnya | Perbaiki pemanggil |
| Periode akuntansi tertutup | Ditolak; persetujuan GJ-005 juga ditolak | Buka periode lewat `C-010` atau tunggu periode terbuka |
| Koreksi setelah posting | Jurnal pembalik baru (AC-09) | Sesuai J-08 |
| Jurnal pembayaran gagal | Status karyawan tetap `DIBAYAR` tidak berubah; jurnal diulang | Ulangi; tidak dobel (INV-06) |

## Jurnal dan akun peran

Akun dirujuk lewat peran (`D-35`). Nomor di `FND-006` (`D-41`). Tabel di 01 (bagian Jurnal) adalah sumber aturan sisi dan nilai.

| Pemicu | Peran akun | Sisi | Nilai |
|---|---|---|---|
| Akrual (`DISETUJUI`) | `tenaga_kerja_langsung` | Debit | Penambah minus potongan ketidakhadiran, tipe Produksi |
| Akrual | `beban_gaji_administrasi` | Debit | Sama, tipe Non-Produksi |
| Akrual | `utang_bpjs` | Kredit | BPJS karyawan (dan porsi perusahaan `[USULAN-AGEN]`) |
| Akrual | `utang_pph21` | Kredit | PPh 21 |
| Akrual | `utang_gaji` | Kredit | Nominal bersih |
| Akrual | `selisih_pembulatan` | Debit atau kredit | Selisih agar balance (`D-51(b)`) |
| Pembayaran (`DIBAYAR`) | `utang_gaji` | Debit | Nominal bersih karyawan |
| Pembayaran | `kas_bank` | Kredit | Nominal bersih karyawan |

Peran `tenaga_kerja_langsung` mengakumulasi gaji pabrik. Pembebanan ke WIP oleh track Produksi (`D-44` 4) mengosongkannya. Sisa diselesaikan saat tutup buku (`C-010`).

## Architecture boundaries

Mengikuti `ARCH-001`: `ARCH-03` (jurnal lewat ledger); `ARCH-08` tidak dipakai (tidak membaca data produksi, `D-44` 4). Akrual dipicu dari transisi `DISETUJUI` oleh service core dokumen, bukan oleh modul GJ-005 yang mengimpor GJ-007 (`D-04`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Nominal dari draft dan pembayaran, bukan klien | Uji perilaku | — | `Unverified` |
| `B-02` | Tipe di luar pemetaan ditolak | Uji perilaku | — | `Unverified` |
| `B-03` | Jurnal hanya lewat `postJournal()` | Pencarian kode + review | — | `Unverified` |
| `B-04` | Laporan sesuai izin (AC-10) | Uji perilaku | — | `Unverified` |
| `PRE-01` | Jurnal tidak balance atau periode tertutup ditolak (AC-03, AC-04) | Uji `postJournal()` | — | `Unverified` |
| `PRE-02` | Akrual sebelum disetujui ditolak (AC-01) | Uji perilaku | — | `Unverified` |
| `PRE-03` | Jurnal akrual kedua ditolak (AC-06) | Uji database | — | `Unverified` |
| `PRE-04` | Pembayaran sebelum dibayar tidak dijurnal (AC-12) | Uji perilaku | — | `Unverified` |
| `PRE-05` | Pembayaran kedua tidak dijurnal (AC-13) | Uji database | — | `Unverified` |
| `POST-01` | Akrual balance dalam transaksi yang sama (AC-01) | Uji perilaku + database | — | `Unverified` |
| `POST-02` | Pembayaran per karyawan (AC-11) | Uji perilaku | — | `Unverified` |
| `POST-03` | Laporan = jurnal (AC-07, AC-08) | Skrip pembanding | — | `Unverified` |
| `POST-04` | Jenis, nomor, dan pemicu tersimpan (AC-11) | Uji database | — | `Unverified` |
| `INV-01` | Debit = kredit (AC-03, AC-15) | Uji `postJournal()` | — | `Unverified` |
| `INV-02` | Jurnal diposting tidak diubah (AC-09) | Uji database | — | `Unverified` |
| `INV-03` | Satu akrual per payroll (AC-06) | Uji database | — | `Unverified` |
| `INV-04` | Tidak ada tulis langsung ke jurnal | Pencarian kode + review | — | `Unverified` |
| `INV-05` | Tidak ada jurnal pembayaran sebelum dibayar (AC-12) | Uji perilaku | — | `Unverified` |
| `INV-06` | Pembayaran tidak dijurnal dua kali (AC-13) | Uji database | — | `Unverified` |
| `INV-07` | Laporan membaca buku besar (AC-07, AC-08) | Pencarian kode + review | — | `Unverified` |

Semua aturan `Unverified`.
