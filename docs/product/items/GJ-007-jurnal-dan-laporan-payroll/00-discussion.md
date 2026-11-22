# GJ-007 — Diskusi

## Konteks

Track GJ-D (bayar). Payroll menghasilkan jurnal dan laporan. Di `backlog.md` item ini `specified`, depends on `GJ-006` dan `FND-006`. Item ini memblokir `INT-001` (jurnal gabungan).

Diperbarui 2026-11-22 setelah `D-41`, `D-43`, `D-44`, `D-46`, `D-49`, dan `D-50`. `D-49` menetapkan jurnal akrual saat DISETUJUI dan jurnal pembayaran per transfer berhasil. Bagian ini memakai peran akun (`D-35`), nomor akun hanya di konfigurasi `FND-006`.

Sumber: `analisis-sia.md` §5.5 (GJ-7), §6.7 (tabel jurnal `[USULAN]`), §6.9 langkah 40, §8.3 (dua arti periode), `D-07`; makalah UC-GJ-10, UC-GJ-11, KF-GJ-07.

## Raw request

Daftar backlog: "Jurnal & laporan payroll" (track GJ-D, level 7).

## Actor / consumer

- Akuntansi: membuat jurnal payroll (`D-33`). Jurnal dibuat otomatis oleh pemicu status; Accounting memantau dan memakai laporan.
- HR, Akuntansi, Direksi: melihat laporan (`D-33`).
- Produksi: tidak membaca modul ini; TKL ke WIP lewat jurnal dan track Produksi (`D-44` 4).

## Problem

Payroll yang dibayar tapi tidak dijurnal membuat laporan keuangan tidak lengkap. Beban gaji yang diakui hanya saat pembayaran membuat laporan periode salah.

## Desired outcome

Setiap payroll `DISETUJUI` menghasilkan jurnal akrual yang balance. Setiap pembayaran `DIBAYAR` per karyawan menghasilkan jurnal pembayaran. Laporan payroll dan TKL cocok dengan buku besar.

## Known constraints

- `D-07`: jurnal hanya lewat `postJournal()` di `core/ledger`.
- `D-43`: jurnal hanya dari transaksi operasional, langsung diposting, tidak bisa diubah; setiap jurnal menyimpan jenis transaksi asal, nomor transaksi asal, dan pemicunya; header dan baris dalam satu transaksi; debit = kredit; laporan membaca buku besar.
- `D-44` (4): tenaga kerja langsung ke perintah produksi dari kartu jam kerja Produksi, bukan dari data payroll; gaji pabrik mengisi akun tenaga kerja langsung, pembebanan mengosongkannya.
- `D-44` (5): tutup buku lewat jurnal pembalik; periode akuntansi tertutup menolak jurnal baru.
- `D-49`: jurnal akrual saat DISETUJUI (Dr beban / Cr utang gaji); pembayaran dijurnal terpisah (Dr utang gaji / Cr kas bank).
- `D-35`: akun dirujuk lewat peran; koreksi lewat jurnal pembalik.
- `D-41`: akun dasar; utang BPJS dan utang PPh 21 bernomor saat `FND-006`.
- `D-46`: `DIPOSTING` (jurnal dibuat) setelah `DIBAYAR`.
- `D-25` / `ARCH-08`: modul tidak membaca data produksi.
- `D-50`: laporan tampil di layar dulu; ekspor menyusul.
- §8.3 [USULAN]: kunci payroll terpisah dari tutup buku.

## Open questions

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| J-01 | Kode dan nama akun untuk beban gaji, kas, utang BPJS, utang pajak, dan WIP belum ditetapkan. | Syarat DoR bersyarat "akun debit/kredit dan sumber angka". | Pengguna + tech lead | Terjawab — D-35 dan D-41: akun dipanggil lewat peran (`tenaga_kerja_langsung`, `beban_gaji_administrasi`, `utang_gaji`, `kas_bank`, `utang_bpjs`, `utang_pph21`, `selisih_pembulatan`); nomor di `FND-006`. WIP tidak dipakai di item ini (J-04) |
| J-02 | Tabel jurnal §6.7 (`[USULAN]`) disahkan atau tidak? | Menentukan bentuk jurnal yang diuji. | Pengguna | Terjawab — [USULAN-AGEN]: tabel disahkan dalam bentuk peran akun di `01` (bagian Jurnal) dan `04`. Alasan: D-43, D-44, dan D-49 menentukan aturan; §6.7 hanya draf. Setoran BPJS dan PPh 21 tidak punya use case di makalah: saldo kewajiban tampil di laporan, penyetoran tidak dijurnal di item ini |
| J-03 | Kapan jurnal dibuat: saat draft, saat `DISETUJUI`, saat `DIBAYAR`, atau saat `DIPOSTING`? | Menentukan periode akuntansi dan efek di laporan. | Pengguna | Terjawab — D-49: jurnal akrual saat `DISETUJUI`; jurnal pembayaran per karyawan saat `DIBAYAR`. Pertentangan dengan D-46 (`DIPOSTING` setelah `DIBAYAR`) diselesaikan: `DIPOSTING` dipakai untuk "semua jurnal pembayaran sudah dibuat" dan tidak menandai jurnal akrual. Dicatat untuk koordinator |
| J-04 | Dasar alokasi TKL ke WIP: jam DLH per WO, jam per karyawan tipe Produksi, atau lainnya? | Tanpa dasar, alokasi tidak bisa dihitung ulang. | Pengguna | Terjawab — D-44 (4): TKL ke WIP dibebankan Produksi dari kartu jam kerja; bukan urusan payroll. Item ini tidak menentukan dasar alokasi |
| J-05 | Sumber data jam produksi: apakah GJ-007 membaca lewat service core atau menunggu `PR-006`? | Menentukan dependensi lintas siklus. | Tech lead | Terjawab — D-44 (4) dan D-25: GJ-007 tidak membaca data produksi; pembebanan TKL ke WIP milik track Produksi |
| J-06 | Laporan payroll dan laporan TKL: isi, kolom, dan periode. | Syarat gerbang 3 "laporan cocok". | Pengguna | Terjawab — D-50 (layar dulu, ekspor menyusul) + [USULAN-AGEN]: laporan payroll per periode, per departemen, dan per tipe (Produksi, Non-Produksi) per komponen; laporan TKL per periode dengan saldo akun tenaga kerja langsung dan beban gaji administrasi. Alasan: makalah KF-GJ-07 dan UC-GJ-11 |
| J-07 | Payroll Desember dibayar Januari: beban diakui di periode mana? | §8.3 menunjuk masalah ini. | Pengguna | Terjawab — D-49 + [USULAN-AGEN]: beban akrual diakui di periode akuntansi saat payroll `DISETUJUI`; pembayaran di periode saat transfer berhasil. Alasan: D-49 menetapkan akrual saat disetujui |
| J-08 | Koreksi setelah jurnal dibuat: lewat jurnal penyesuaian atau pembalik? | Menentukan jejak koreksi. | Pengguna | Terjawab — D-35 dan D-43: jurnal tidak diubah; koreksi lewat jurnal pembalik |
| J-09 | Apa yang dimaksud "laporan cocok" di gerbang 3 `EPIC-GJ`? | Membuat AC bisa diuji. | Pengguna | Terjawab — D-43: laporan membaca buku besar, sehingga cocok dengan jurnal per akun |
| J-10 | Apakah GJ-007 menambah primitive UI baru? | Gate `FND-007`. | Tech lead | Terjawab — [USULAN-AGEN]: ya, tabel laporan memakai primitive `FND-007`; item menunggu `FND-007`. Alasan: backlog aturan 1 dan DoR butir 8 |
| J-11 | Data karyawan dan nominal dalam laporan adalah data pribadi. Siapa yang boleh melihat? | DoR bersyarat. | Pengguna | Terjawab — D-33: laporan payroll dibaca HR, Accounting, Direksi. Laporan per karyawan tidak tampil untuk Direksi (`[USULAN-AGEN]`, sama dengan GJ-004 P-13) |

## Pertentangan sumber vs keputusan

- Makalah UC-GJ-10 dan keputusan tabel 24 membentuk alokasi dari tipe karyawan saat jurnal, dan analisis §6.7 memuat "Alokasi payroll produksi: WIP / beban gaji". Bertentangan dengan D-44 (4): TKL ke WIP dari kartu jam kerja Produksi. D-44 menang; pembebanan ke WIP keluar dari item ini.
- Makalah UC-GJ-10 mensyaratkan payroll "Paid" dan analisis §6.7 mencatat "Payroll dibayar"; catatan proses-bisnis §6 menaruh jurnal saat gaji dihitung; `D-49` menaruh akrual saat `DISETUJUI`; `D-46` menaruh `DIPOSTING` setelah `DIBAYAR`. `D-49` diikuti untuk waktu; `DIPOSTING` ditafsirkan sebagai jurnal pembayaran selesai (J-03). **Pertentangan untuk koordinator.**
- `D-49` (jurnal akrual saat disetujui) membutuhkan `FND-006` dan periode akuntansi terbuka; `D-44` (5) menolak jurnal ke periode tertutup. Ditangani di GJ-005 (R-07).

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| D-07 | Jurnal hanya lewat `postJournal()` | 2026-11-17 | Pengguna | Tidak ada tulis langsung ke tabel jurnal dari modul. |
| D-33 | Matriks izin v0 disahkan sebagai baseline | 2026-11-22 | Keputusan terkunci | Accounting memantau jurnal; HR, Accounting, Direksi melihat laporan. |
| D-35 | COA dirujuk lewat peran akun; koreksi lewat jurnal pembalik | 2026-11-22 | Keputusan terkunci | Akun dipanggil lewat peran. |
| D-41 | COA dasar mengikuti rancangan proses bisnis | 2026-11-22 | Keputusan terkunci | Peran akun (nomor di FND-006). |
| D-43 | Aturan jurnal | 2026-11-22 | Keputusan terkunci | Langsung diposting; tidak bisa diubah; laporan membaca buku besar. |
| D-44 | Saat pengakuan; TKL ke WIP dari kartu jam kerja Produksi | 2026-11-22 | Keputusan terkunci | Pembebanan TKL ke WIP keluar dari GJ-007 (butir 4). |
| D-49 | Jurnal akrual saat disetujui; jurnal pembayaran terpisah | 2026-11-22 | Keputusan terkunci | Waktu jurnal (J-03, J-07). |
| D-50 | Laporan tampil di layar dulu | 2026-11-22 | Keputusan terkunci | Ekspor menyusul. |

## Assumptions (agent-proposed)

- `[USULAN-AGEN]` Jurnal akrual dibuat dalam transaksi yang sama dengan transisi `DISETUJUI` (GJ-005, `D-43`).
- `[USULAN-AGEN]` Jurnal pembayaran dibuat per karyawan saat transfer berhasil (GJ-006).
- `[USULAN-AGEN]` Prioritas `P1` (§5.5 analisis). Ini hanya usulan.

## Rejected alternatives

- Modul payroll menulis jurnalnya sendiri: ditolak `D-07`.
- Jurnal manual untuk gaji: ditolak `D-43`.
- Akrual saat draft dihitung: ditolak `D-49` (akrual saat disetujui).

## Next step

Tidak ada pertanyaan terbuka. Daftar `[USULAN-AGEN]` (J-02 bagian setoran BPJS dan PPh 21, J-06, J-07, J-10, J-11, dan asumsi waktu transaksi) sudah disahkan `D-58` (tingkat item). Pertentangan `D-46` dan `D-49` (J-03) perlu dikunci koordinator. Verdict tetap `Blocked` karena `GJ-006` dan `FND-006` belum `done`.
