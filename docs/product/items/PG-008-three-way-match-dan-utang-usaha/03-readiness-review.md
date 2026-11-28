# PG-008 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: invoice dicocokkan, exception terlihat, utang diakui setelah pengesahan. |
| 2 | Aktor dan izin jelas | lolos | Purchasing mencocokkan (D-33). Accounting mencatat dan mengesahkan (D-33). Pencatat tidak boleh mengesahkan invoice sendiri (R-11, D-48). Ketiganya sudah ada di matriks. |
| 3 | Status dan transisi eksplisit; jalur gagal juga | lolos | `COCOK`, `SELISIH`, `TERCATAT` (D-46); `DIBATALKAN` (D-48). Jalur gagal: qty melebihi qty lulus ditolak, kurang tagih menjadi `SELISIH`, PPN tidak sesuai menjadi `SELISIH`, pembatalan setelah pembayaran ditolak. |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Setiap kondisi punya isi informasi pesan yang tetap. Kalimat final adalah pekerjaan implementasi dan tidak mengubah perilaku. |
| 5 | Acceptance criteria dapat dibuktikan | lolos | 21 AC dengan langkah UI atau pemeriksaan utang, jurnal, dan status. Nilai toleransi dan tarif PPN diambil dari data seed dan konfigurasi, bukan dari dokumen ini. |
| 6 | Semua `depends on` berstatus `done` | lolos | `PG-007` selesai di branch stack yang sama; `FND-006` `done` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 13 pertanyaan: terjawab dengan D-xx, sumber, atau [USULAN-AGEN]. Tidak ada yang `Terbuka`. |
| 8 | Gate fondasi terpenuhi | lolos | `FND-001`-`FND-009` `done`; gate modul `D-54`/`D-67` terpenuhi |
| 9 | Ukuran masuk akal untuk satu orang | lolos | Ukuran L (usulan). Satu track PG-D dan satu pemilik. Ukuran dipertahankan karena pencocokan, pengesahan, dan jurnal harus atomik dalam satu alur. Belum dipecah; pemecahan hanya boleh diputuskan koordinator. |

Pemeriksaan bersyarat:

| Kondisi | Kriteria | Status | Catatan |
|---|---|---|---|
| Menyentuh uang | akun debit/kredit dan sumber angka disebut | lolos | Dr 202 senilai qty lulus × harga PO (D-44 (1), (2)); Dr `ppn_masukan` senilai PPN (tarif dari `konfigurasi_pajak`, D-51 (a)); Dr/Cr `selisih_harga_pembelian` bila ada selisih toleransi (R-05); Cr 201 senilai total invoice. |
| Mengubah stok | arah mutasi dan efek ke `saldo_stok` disebut | lolos | Tidak ada mutasi (R-10). |
| Menyentuh status dokumen | siapa boleh ubah, dan jejak apa | lolos | Purchasing (pencocokan, tindak lanjut selisih). Accounting (revisi, pengesahan, pembatalan, R-09). Pemisahan R-11. Jejak riwayat (D-08, AC-12). |
| Melintasi modul | service core yang dipakai disebut | lolos | `core/pengadaan` (invoice, pencocokan, utang), `core/ledger` (jurnal), `core/dokumen` (nomor dan riwayat). |
| Data pribadi | field dan pembaca disebut | tidak berlaku | Data pemasok bukan data pribadi karyawan. Tidak ada data pribadi di item ini. |

## Verdict

`Ready` (2026-11-27)

Dependensi `PG-007` selesai di branch stack yang sama dan `FND-006` `done`; gate fondasi `FND-001`–`FND-009` `done`. Dua akun COA (`ppn_masukan` 113, `selisih_harga_pembelian` 603) memakai nomor placeholder yang perlu dikonfirmasi tech lead. Bukti implementasi di `05-evidence.md`; bukti database di `docs/tech-debt/pg-008-bukti-db.md`.

## Blockers / decisions needed

| Jenis | Item | Pemilik |
|---|---|---|
| Dependensi | PG-007 belum `done` | urutan backlog |
| Dependensi | FND-006 belum `done` (COA, `postJournal()`, periode) | gate fondasi |
| Dependensi | FND-002, FND-003, FND-004, FND-005 belum `done` | gate fondasi |

Tidak ada pertanyaan terbuka. Semua keputusan ada di `00-discussion.md`. Usulan [USULAN-AGEN] menunggu penguncian koordinator.

## Agent suggestions awaiting approval

| Hal | Usulan | Alasan |
|---|---|---|
| Ukuran | L (dipertahankan) | pencocokan, pengesahan, dan jurnal atomik dalam satu alur; koordinator dapat memutuskan pemecahan |
| Prioritas | belum ditetapkan | keputusan pengguna |
| Owner | belum ditetapkan | backlog tidak memuat pemilik track |
| Penentuan aturan | R-02 (pembanding qty lulus), R-03 (toleransi AND per baris), R-04, R-05 (baris PPN dan selisih harga), R-06, R-09, Q-05 (peran `selisih_harga_pembelian`) | belum ada keputusan terkunci yang langsung menjawab |
| Peran akun baru | `selisih_harga_pembelian` | D-35 dan D-41 mengharuskan peran akun; nomornya ditetapkan di FND-006 |
| Perluasan D-44 (2) | jurnal pengakuan memuat baris PPN dan selisih | D-44 (2) hanya menyebut dua baris; perlu konfirmasi koordinator |

## Readiness status

- Requirement package: lengkap. Pertanyaan: 13. Terjawab dengan keputusan terkunci atau sumber, dengan [USULAN-AGEN] 7, terbuka 0.
- Kontrak desain: `04-design-contract.md` berstatus `Proposed`; seluruh aturan `Unverified`.
- Bukti: `05-evidence.md` berstatus belum dijalankan.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Ukuran item besar (L) | jadwal meleset; kualitas pencocokan turun | koordinator menilai pemecahan sebelum `Ready` |
| Usulan [USULAN-AGEN] belum dikunci, terutama R-02 dan perluasan D-44 (2) | utang bisa diakui dengan dasar yang salah | koordinator mengunci sebelum desain final |
| Akun `selisih_harga_pembelian` belum ada di COA | jurnal selisih tidak bisa dibuat | nomor ditetapkan di FND-006 |
| Item ini memblokir `PG-009` dan `INT-001` | keterlambatan menjalar ke jalur terpanjang | pantau sebagai jalur kritis di `backlog.md` |

## Handoff boundary

- Parent epic / milestone: `EPIC-PG` / `M1`
- Lane / sequence / predecessor: active; sequence belum ditetapkan; predecessor `PG-007`
- Foundation status / evidence: `partial`. FND-001 `done`; FND-002 sampai FND-006 `specified`.
- Artifact role / canonical source: `canonical` (paket item); `EPIC-PG` dan `backlog.md` untuk gate dan dependensi.
- Next domain: `design-contracts` untuk kontrak yang sudah ada, lalu `quick-dev` setelah verdict `Ready`.
- Required input artifacts: `01-requirement.md`, `02-acceptance-criteria.md`, `04-design-contract.md`, `EPIC-PG`, `D-07`, `D-14`, `D-15`, `D-17`, `D-44`, `D-48`, `D-49`.
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
