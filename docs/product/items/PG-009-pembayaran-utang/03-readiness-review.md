# PG-009 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: pembayaran dialokasikan, verifikasi sebelum transfer, saldo berkurang, gagal ditandai. |
| 2 | Aktor dan izin jelas | lolos | Finance mencatat dan mengeksekusi (D-33). Accounting memverifikasi (D-47 (e)). Manajemen tidak terlibat (D-51 (c)). Pemisahan satu akun satu peran (D-48) dan pemohon PR (D-42). |
| 3 | Status dan transisi eksplisit; jalur gagal juga | lolos | Status invoice `TERCATAT`, `DIBAYAR_SEBAGIAN`, `LUNAS` (D-46). Status pembayaran `GAGAL_TRANSFER` ([USULAN-AGEN]) dan `DIBATALKAN` (R-09). Jalur gagal: transfer gagal, kelebihan bayar, verifikasi belum ada, pembalikan tanpa alasan. |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Setiap kondisi punya isi informasi pesan yang tetap. Kalimat final adalah pekerjaan implementasi dan tidak mengubah perilaku. |
| 5 | Acceptance criteria dapat dibuktikan | lolos | 19 AC dengan langkah UI atau pemeriksaan sisa, status, jurnal, dan riwayat. Tidak ada AC yang menunggu pertanyaan terbuka. |
| 6 | Semua `depends on` berstatus `done` | belum | `PG-008` `specified`; `FND-006` `specified`. |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 11 pertanyaan: terjawab dengan D-xx, sumber, atau [USULAN-AGEN]. Tidak ada yang `Terbuka`. |
| 8 | Gate fondasi terpenuhi | belum | `FND-002` sampai `FND-006` belum `done`; hanya `FND-001` yang `done`. |
| 9 | Ukuran masuk akal untuk satu orang | lolos | Ukuran M (usulan). Satu track PG-D; laporan dikeluarkan ke core (C-009), sehingga item ini tidak membengkak. |

Pemeriksaan bersyarat:

| Kondisi | Kriteria | Status | Catatan |
|---|---|---|---|
| Menyentuh uang | akun debit/kredit dan sumber angka disebut | lolos | Dr 201 / Cr 102 senilai nominal pembayaran berhasil (D-41, R-06). Rekening bank dipilih dari master yang dipetakan ke `kas_bank`. Tidak ada pembulatan (R-07). |
| Mengubah stok | arah mutasi dan efek ke `saldo_stok` disebut | lolos | Pembayaran tidak mengubah stok. |
| Menyentuh status dokumen | siapa boleh ubah, dan jejak apa | lolos | Finance mencatat dan membatalkan dengan alasan. Accounting memverifikasi. Jejak riwayat (D-08, AC-13). |
| Melintasi modul | service core yang dipakai disebut | lolos | `core/pengadaan` (pembayaran, alokasi, sisa utang), `core/ledger` (jurnal dan saldo 201 dan 102), `core/dokumen` (nomor dan riwayat). Laporan lewat core (D-25). |
| Data pribadi | field dan pembaca disebut | lolos | Data rekening pemasok perorangan dapat memuat nama dan nomor rekening. Field: nomor rekening dan nama pemilik rekening pada master pemasok dan pembayaran. Pembaca: Finance dan Accounting. Tidak ditampilkan ke peran lain. |

## Verdict

`Blocked`

Alasan: dependensi belum `done`. Daftar dependensi (backlog `depends on`): `PG-008` dan `FND-006`. Gate fondasi `FND-002` sampai `FND-006` juga belum `done`.

Siap menjadi `Ready` begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

| Jenis | Item | Pemilik |
|---|---|---|
| Dependensi | PG-008 belum `done` | urutan backlog |
| Dependensi | FND-006 belum `done` (COA, `postJournal()`, periode, konfigurasi rekening) | gate fondasi |
| Dependensi | FND-002, FND-003, FND-004, FND-005 belum `done` | gate fondasi |

Tidak ada pertanyaan terbuka. Semua keputusan ada di `00-discussion.md`. Usulan [USULAN-AGEN] menunggu penguncian koordinator.

## Agent suggestions awaiting approval

| Hal | Usulan | Alasan |
|---|---|---|
| Ukuran | M | pembayaran, alokasi, jurnal, dan lampiran; laporan di C-009 |
| Prioritas | belum ditetapkan | keputusan pengguna |
| Owner | belum ditetapkan | backlog tidak memuat pemilik track |
| Penentuan aturan | R-03 (kolom verifikasi), R-04 (`GAGAL_TRANSFER`), R-05 (format lampiran), R-07, R-08, R-09 (pembalikan dan status invoice dihitung ulang), R-12 | belum ada keputusan terkunci yang langsung menjawab |
| Pertentangan untuk koordinator | D-48 "status tidak mundur" vs pembalikan yang menurunkan status invoice (R-09) | perlu keputusan: status derived dari sisa, atau larangan pembalikan di versi awal |
| Baris matriks izin | sudah ada: "Verifikasi pembayaran pemasok" = Accounting (D-47 (e)) | tidak ada tindakan |

## Readiness status

- Requirement package: lengkap. Pertanyaan: 11. Terjawab dengan keputusan terkunci atau sumber, dengan [USULAN-AGEN] 6, terbuka 0.
- Kontrak desain: `04-design-contract.md` berstatus `Proposed`; seluruh aturan `Unverified`.
- Bukti: `05-evidence.md` berstatus belum dijalankan.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Pembalikan pembayaran belum sejalan dengan D-48 | aturan status salah bila diimplementasikan | koordinator memutuskan sebelum desain final (R-09) |
| Alokasi multi-invoice dan kelebihan bayar | logika alokasi salah hitung | uji AC-03 dan AC-04 dengan data seed |
| Rekening bank dan akun kas belum final di COA | pembayaran tidak bisa dicatat | kesiapan FND-006 |
| Item ini memblokir `INT-001` dan termasuk jalur kritis | keterlambatan menjalar ke join | pantau di `backlog.md` |

## Handoff boundary

- Parent epic / milestone: `EPIC-PG` / `M1`
- Lane / sequence / predecessor: active; sequence belum ditetapkan; predecessor `PG-008`
- Foundation status / evidence: `partial`. FND-001 `done`; FND-002 sampai FND-006 `specified`.
- Artifact role / canonical source: `canonical` (paket item); `EPIC-PG` dan `backlog.md` untuk gate dan dependensi.
- Next domain: `design-contracts` untuk kontrak yang sudah ada, lalu `quick-dev` setelah verdict `Ready`.
- Required input artifacts: `01-requirement.md`, `02-acceptance-criteria.md`, `04-design-contract.md`, `EPIC-PG`, `D-07`, `D-08`, `D-25`, `D-41`, `D-42`, `D-48`, `D-49`, `D-51`.
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- `00-discussion.md`
- `01-requirement.md`
- `02-acceptance-criteria.md`
- `04-design-contract.md`
- `05-evidence.md`
- `docs/product/epics/EPIC-PG.md`
- `docs/product/backlog.md`
- `docs/product/decisions.md`
