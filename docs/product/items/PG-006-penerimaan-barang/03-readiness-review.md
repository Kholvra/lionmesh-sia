# PG-006 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: Gudang mencatat penerimaan, selisih terlihat, kelebihan ditolak. |
| 2 | Aktor dan izin jelas | lolos | Gudang mencatat dan membatalkan (D-33, R-08). Purchasing menutup exception (R-10). Baris matriks untuk penutupan exception belum ada; diusulkan di "Agent suggestions" dan tidak mengubah keputusan terkunci. |
| 3 | Status dan transisi eksplisit; jalur gagal juga | lolos | Status PO turunan dan dokumen dari D-46 (`DITERBITKAN`, `DITERIMA_SEBAGIAN`, `DITERIMA`), `DIBATALKAN` dari D-48. Jalur gagal: penolakan kelebihan, pembatalan setelah QC ditolak (`01-requirement.md` Status dan Validasi). |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Setiap kondisi punya isi informasi pesan yang tetap. Kalimat final adalah pekerjaan implementasi dan tidak mengubah perilaku. |
| 5 | Acceptance criteria dapat dibuktikan | lolos | 14 AC dengan langkah UI atau pemeriksaan tabel. Tidak ada AC yang menunggu pertanyaan terbuka. |
| 6 | Semua `depends on` berstatus `done` | belum | `PG-005` `specified`; `FND-005` `specified`. |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 10 pertanyaan: terjawab dengan D-xx atau [USULAN-AGEN] (lihat `00-discussion.md`). Tidak ada yang `Terbuka`. |
| 8 | Gate fondasi terpenuhi | belum | `FND-002` sampai `FND-006` belum `done`; hanya `FND-001` yang `done`. |
| 9 | Ukuran masuk akal untuk satu orang | lolos | Ukuran M (usulan). Satu dokumen, satu layar, satu track PG-C; QC dan retur ada di PG-007. |

Pemeriksaan bersyarat:

| Kondisi | Kriteria | Status | Catatan |
|---|---|---|---|
| Menyentuh uang | akun debit/kredit dan sumber angka disebut | lolos | Tidak ada jurnal dari penerimaan (D-44 (1); AC-02). Nilai masuk dari harga PO saat QC lulus, di PG-007. |
| Mengubah stok | arah mutasi dan efek ke `saldo_stok` disebut | lolos | Tidak ada mutasi. Efek nol ditulis eksplisit (POST-02). |
| Menyentuh status dokumen | siapa boleh ubah, dan jejak apa | lolos | Gudang mengubah dengan pembatalan sebelum QC (R-08). Purchasing menutup exception (R-10). Jejak riwayat (D-08, AC-08). |
| Melintasi modul | service core yang dipakai disebut | lolos | `core/pengadaan` (data penerimaan dan PO), `core/dokumen` (nomor dan riwayat), `core/master` (gudang, C-011). |
| Data pribadi | field dan pembaca disebut | tidak berlaku | Tidak ada data pribadi di item ini. |

## Verdict

`Blocked`

Alasan: dependensi belum `done`. Daftar dependensi (backlog `depends on`): `PG-005` dan `FND-005`. Gate fondasi `FND-002` sampai `FND-006` juga belum `done`.

Siap menjadi `Ready` begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

| Jenis | Item | Pemilik |
|---|---|---|
| Dependensi | PG-005 belum `done` | urutan backlog |
| Dependensi | FND-005 belum `done` | gate fondasi (D-36 melepas dependensi konseptual; backlog belum diubah) |
| Dependensi | FND-002, FND-003, FND-004, FND-006 belum `done` | gate fondasi `FND-001`–`FND-006` |

Tidak ada pertanyaan terbuka. Semua keputusan ada di `00-discussion.md`. Usulan [USULAN-AGEN] menunggu penguncian koordinator.

## Agent suggestions awaiting approval

| Hal | Usulan | Alasan |
|---|---|---|
| Ukuran | M | satu dokumen, satu layar, satu validasi qty; tidak termasuk QC |
| Prioritas | belum ditetapkan | backlog tidak memuat prioritas; keputusan pengguna |
| Owner | belum ditetapkan | backlog tidak memuat pemilik track |
| Penentuan aturan | R-02 sampai R-10 (lihat `01-requirement.md`) | Q-01, Q-02, Q-03, Q-07, Q-08 belum punya keputusan terkunci yang langsung menjawab |
| Baris matriks izin baru | "Tutup exception selisih penerimaan" = Purchasing | matriks di luar folder item; koordinator yang mengubahnya |

## Readiness status

- Requirement package: lengkap. Pertanyaan: 10. Terjawab dengan keputusan terkunci 5, dengan [USULAN-AGEN] 5, terbuka 0.
- Kontrak desain: `04-design-contract.md` berstatus `Proposed`; seluruh aturan `Unverified`.
- Bukti: `05-evidence.md` berstatus belum dijalankan.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Usulan [USULAN-AGEN] belum dikunci | desain bisa berubah saat dikunci | koordinator mengunci sebelum `Ready` |
| Backlog masih mencantumkan `FND-005` | urutan lebih panjang dari yang dibutuhkan | tech lead memutuskan perubahan backlog (D-36) |
| Uji AC-12 bagian kedua butuh PG-007 | verifikasi penuh baru lengkap setelah PG-007 | bagian kedua dijalankan saat PG-007 ada |

## Handoff boundary

- Parent epic / milestone: `EPIC-PG` / `M1`
- Lane / sequence / predecessor: active; sequence belum ditetapkan; predecessor `PG-005`
- Foundation status / evidence: `partial`. FND-001 `done`; FND-002 sampai FND-006 `specified`.
- Artifact role / canonical source: `canonical` (paket item); `EPIC-PG` dan `backlog.md` adalah sumber untuk gate dan dependensi.
- Next domain: `design-contracts` untuk kontrak yang sudah ada (`04-design-contract.md`), lalu `quick-dev` setelah verdict `Ready`.
- Required input artifacts: `01-requirement.md`, `02-acceptance-criteria.md`, `04-design-contract.md`, `EPIC-PG`, `D-05`, `D-08`, `D-15`, `D-46`, `D-48`, `D-49`.
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
