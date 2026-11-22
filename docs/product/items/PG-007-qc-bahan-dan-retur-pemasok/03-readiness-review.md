# PG-007 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: QC mencatat, stok bertambah setelah lulus, retur disetujui. |
| 2 | Aktor dan izin jelas | lolos | QC mencatat QC (D-33). Gudang memisahkan dan mengeluarkan retur fisik. Purchasing mengajukan retur. Accounting menyetujui retur dan memiliki jurnal (D-49). Baris matriks untuk pengajuan dan pengeluaran retur belum ada; diusulkan di "Agent suggestions". |
| 3 | Status dan transisi eksplisit; jalur gagal juga | lolos | Status baris `DITERIMA` → `QC_LULUS` / `QC_GAGAL` (D-46). Retur `DIAJUKAN` → `DISETUJUI` / `DITOLAK` / `DIBATALKAN` (D-48, D-49). Jalur gagal: QC gagal tanpa jurnal, jurnal gagal membatalkan mutasi, retur melebihi qty gagal ditolak. |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Setiap kondisi punya isi informasi pesan yang tetap. Kalimat final adalah pekerjaan implementasi dan tidak mengubah perilaku. |
| 5 | Acceptance criteria dapat dibuktikan | lolos | 18 AC dengan langkah UI atau pemeriksaan saldo, jurnal, dan status. Tidak ada AC yang menunggu pertanyaan terbuka. |
| 6 | Semua `depends on` berstatus `done` | belum | `PG-006` `specified`; `FND-005` `specified`. |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 10 pertanyaan: terjawab dengan D-xx atau [USULAN-AGEN]. Tidak ada yang `Terbuka`. |
| 8 | Gate fondasi terpenuhi | belum | `FND-002` sampai `FND-006` belum `done`; hanya `FND-001` yang `done`. |
| 9 | Ukuran masuk akal untuk satu orang | lolos | Ukuran M (usulan). QC, mutasi, jurnal, dan retur berada dalam satu track PG-C dan satu alur penerimaan. Retur menambah satu dokumen dan satu persetujuan, tidak lebih. |

Pemeriksaan bersyarat:

| Kondisi | Kriteria | Status | Catatan |
|---|---|---|---|
| Menyentuh uang | akun debit/kredit dan sumber angka disebut | lolos | QC lulus: Dr 120 / Cr 202 senilai qty lulus × harga PO (D-44 (1), D-41). Retur: tidak ada jurnal (R-06). Barang gagal: tidak ada beban (R-07). |
| Mengubah stok | arah mutasi dan efek ke `saldo_stok` disebut | lolos | QC lulus: mutasi masuk (+qty lulus), nilai rata-rata bergerak (D-10). QC gagal: tidak ada mutasi. Retur: tidak ada mutasi (R-06). |
| Menyentuh status dokumen | siapa boleh ubah, dan jejak apa | lolos | QC (per baris hasil QC), Purchasing (ajukan dan batalkan retur selama `DIAJUKAN`, D-48), Accounting (setujui atau tolak retur), Gudang (pemisahan fisik). Jejak riwayat (D-08, AC-08 dan AC-09). |
| Melintasi modul | service core yang dipakai disebut | lolos | `core/inventory` (mutasi dan saldo), `core/ledger` (jurnal), `core/pengadaan` (baris penerimaan dan retur), `core/dokumen` (nomor dan riwayat). |
| Data pribadi | field dan pembaca disebut | tidak berlaku | Tidak ada data pribadi di item ini. |

## Verdict

`Blocked`

Alasan: dependensi belum `done`. Daftar dependensi (backlog `depends on`): `PG-006` dan `FND-005`. Gate fondasi `FND-002` sampai `FND-006` juga belum `done`.

Siap menjadi `Ready` begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

| Jenis | Item | Pemilik |
|---|---|---|
| Dependensi | PG-006 belum `done` | urutan backlog |
| Dependensi | FND-005 belum `done` | gate fondasi |
| Dependensi | FND-002, FND-003, FND-004, FND-006 belum `done` | gate fondasi `FND-001`–`FND-006` |

Tidak ada pertanyaan terbuka. Semua keputusan ada di `00-discussion.md`. Usulan [USULAN-AGEN] menunggu penguncian koordinator.

## Agent suggestions awaiting approval

| Hal | Usulan | Alasan |
|---|---|---|
| Ukuran | M | QC, mutasi, jurnal, dan retur dalam satu alur penerimaan |
| Prioritas | belum ditetapkan | backlog tidak memuat prioritas; keputusan pengguna |
| Owner | belum ditetapkan | backlog tidak memuat pemilik track |
| Penentuan aturan | R-02, R-04, R-05 (status retur), R-06, R-07, Q-02, Q-03, Q-06, Q-09 | belum ada keputusan terkunci yang langsung menjawab |
| Baris matriks izin baru | "Ajukan retur pemasok" = Purchasing; "Setujui retur pemasok" = Accounting; "Catat pengeluaran retur fisik" = Gudang | matriks di luar folder item; koordinator yang mengubahnya |
| Akun jurnal QC lulus | Dr 120 / Cr 202 (D-44, D-41) | sudah ditetapkan; tidak perlu usulan baru |

## Readiness status

- Requirement package: lengkap. Pertanyaan: 10. Terjawab dengan keputusan terkunci atau sumber, dengan [USULAN-AGEN] 5, terbuka 0.
- Kontrak desain: `04-design-contract.md` berstatus `Proposed`; seluruh aturan `Unverified`.
- Bukti: `05-evidence.md` berstatus belum dijalankan.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Usulan [USULAN-AGEN] belum dikunci | desain bisa berubah saat dikunci | koordinator mengunci sebelum `Ready` |
| Mutasi masuk dan jurnal harus atomik | kegagalan parsial membuat saldo dan jurnal tidak sinkron | `04-design-contract.md` B-03, POST-01, dan AC-03 |
| Akun 120 dan 202 sudah ada di D-41 tetapi FND-006 belum `done` | jurnal tidak bisa dibuat sebelum FND-006 selesai | kesiapan FND-006 |

## Handoff boundary

- Parent epic / milestone: `EPIC-PG` / `M1`
- Lane / sequence / predecessor: active; sequence belum ditetapkan; predecessor `PG-006`
- Foundation status / evidence: `partial`. FND-001 `done`; FND-002 sampai FND-006 `specified`.
- Artifact role / canonical source: `canonical` (paket item); `EPIC-PG` dan `backlog.md` untuk gate dan dependensi.
- Next domain: `design-contracts` untuk kontrak yang sudah ada, lalu `quick-dev` setelah verdict `Ready`.
- Required input artifacts: `01-requirement.md`, `02-acceptance-criteria.md`, `04-design-contract.md`, `EPIC-PG`, `D-06`, `D-07`, `D-10`, `D-13`, `D-44`, `D-49`.
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
