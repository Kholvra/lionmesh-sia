# PG-010 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: impor CSV, pencocokan, daftar selisih, impor ulang tidak menggandakan. |
| 2 | Aktor dan izin jelas | lolos | Accounting (D-33, baris "Rekonsiliasi bank" = Accounting, default). Finance hanya sumber catatan kas, tanpa hak rekonsiliasi. Akses data rekening dibatasi Accounting (R-10). |
| 3 | Status dan transisi eksplisit; jalur gagal juga | lolos | `BELUM_COCOK`, `COCOK`, `SELISIH` ([USULAN-AGEN], nama dari §5.2). Jalur gagal: berkas rusak menolak seluruh impor, impor ulang ditolak, mutasi di luar periode ditolak, selisih tanpa alasan ditolak. |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Setiap kondisi punya isi informasi pesan yang tetap. Kalimat final adalah pekerjaan implementasi dan tidak mengubah perilaku. |
| 5 | Acceptance criteria dapat dibuktikan | lolos | 17 AC dengan langkah UI atau pemeriksaan daftar, saldo, dan jurnal. Format riil bank tidak dibutuhkan untuk AC karena berkas uji disusun sesuai profil pemetaan. |
| 6 | Semua `depends on` berstatus `done` | belum | `FND-006` `specified`. `DISC-002` bukan dependensi (`D-60`(e)). |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | 10 pertanyaan: terjawab dengan D-xx, backlog, atau [USULAN-AGEN]. Tidak ada yang `Terbuka`. |
| 8 | Gate fondasi terpenuhi | belum | `FND-002` sampai `FND-007` belum `done`; hanya `FND-001` yang `done` (D-54). |
| 9 | Ukuran masuk akal untuk satu orang | lolos | Ukuran M (usulan). Impor, validasi, pencocokan, dan daftar selisih dalam satu track PG-E. Tidak ada jurnal (R-06), sehingga lebih kecil dari item yang menulis jurnal. |

Pemeriksaan bersyarat:

| Kondisi | Kriteria | Status | Catatan |
|---|---|---|---|
| Menyentuh uang | akun debit/kredit dan sumber angka disebut | lolos | Tidak ada jurnal (R-06). Akun 102 hanya dibaca. Akun biaya bank tidak ada (D-41) dan tidak dibutuhkan. |
| Mengubah stok | arah mutasi dan efek ke `saldo_stok` disebut | lolos | Tidak berlaku: rekonsiliasi tidak mengubah stok. |
| Menyentuh status dokumen | siapa boleh ubah, dan jejak apa | lolos | Accounting mengubah status pencocokan (R-05). Jejak riwayat (D-08, AC-11). |
| Melintasi modul | service core yang dipakai disebut | lolos | `core/ledger` (baca baris jurnal kas akun 102), `core/pengadaan` (tidak dipakai langsung; pembayaran pemasok terlihat lewat jurnal), core master (rekening bank). Data pelanggan lewat service core (D-25). |
| Data pribadi | field dan pembaca disebut | lolos | Field: nomor rekening dan nama pemilik rekening pada mutasi (berpotensi data pribadi perorangan). Pembaca: Accounting saja (R-10). Tidak ditampilkan ke peran lain atau diekspor di luar layar. |

## Verdict

`Blocked`

Alasan tunggal: dependensi belum `done`: `FND-006` (`specified`), ditambah gate fondasi `FND-001`–`FND-007` untuk item modul (D-54; hanya `FND-001` yang `done`). `DISC-002` bukan dependensi (`D-60`(e)).

Siap menjadi `Ready` begitu dependensi done; tidak ada pemblokir lain.

## Blockers / decisions needed

| Jenis | Item | Pemilik |
|---|---|---|
| Dependensi | FND-006 belum `done` | gate fondasi |
| Dependensi | FND-002, FND-003, FND-004, FND-005 belum `done` | gate fondasi |
| Gate fondasi | FND-007 belum `done` (gate item modul) | D-54 |

Tidak ada pertanyaan terbuka. Semua keputusan ada di `00-discussion.md`. Usulan [USULAN-AGEN] menunggu penguncian koordinator.

## Agent suggestions awaiting approval

| Hal | Usulan | Alasan |
|---|---|---|
| Ukuran | M | impor, validasi, pencocokan, dan daftar selisih; menjadi S bila berkas tetap dan tanpa jurnal |
| Prioritas | belum ditetapkan | analisis menyebut P1; keputusan pengguna |
| Owner | belum ditetapkan | backlog tidak memuat pemilik track |
| Penentuan aturan | R-03 (hash berkas), R-04 (aturan cocok dan sumber jurnal), R-05 (status), R-06 (tanpa jurnal), R-08 (per rekening per bulan), R-09 (1:1) | belum ada keputusan terkunci yang langsung menjawab |
| Pertentangan untuk koordinator | `EPIC-PG` gate 3 (cocok dengan pembayaran) vs backlog (`PG-010` tanpa dependensi `PG-009`); dipilih baris jurnal kas | perlu konfirmasi sebelum `FND-006` ditulis |
| Lingkup `FND-006` | referensi rekening pada baris jurnal kas | dibutuhkan R-04; perlu dimasukkan ke spesifikasi FND-006 |

## Readiness status

- Requirement package: lengkap. Pertanyaan: 10. Terjawab dengan keputusan terkunci atau backlog, dengan [USULAN-AGEN] 6, terbuka 0.
- Kontrak desain: `04-design-contract.md` berstatus `Proposed`; seluruh aturan `Unverified`.
- Bukti: `05-evidence.md` berstatus belum dijalankan.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Format bank riil berbeda dari CSV uji | profil pemetaan harus diubah | Profil diisi pengguna tanpa kode (D-52); spike `DISC-002` non-pemblokir (`D-60`(e)) |
| Pencocokan dengan baris jurnal bergantung pada referensi rekening di `FND-006` | pencocokan per rekening tidak bisa dibangun | koordinator memasukkan dimensi rekening ke `FND-006` |
| Berkas bank berisi data pribadi | kewajiban perlindungan data | field dan pembaca sudah ditetapkan (R-10) |

## Handoff boundary

- Parent epic / milestone: `EPIC-PG` / `M1`
- Lane / sequence / predecessor: active; sequence belum ditetapkan; predecessor `FND-006` (`DISC-002` spike non-pemblokir, `D-60`(e))
- Foundation status / evidence: `partial`. FND-001 `done`; FND-002 sampai FND-007 belum `done`.
- Artifact role / canonical source: `canonical` (paket item); `EPIC-PG` dan `backlog.md` untuk gate dan dependensi.
- Next domain: `design-contracts` untuk kontrak yang sudah ada, lalu `quick-dev` setelah verdict `Ready`.
- Required input artifacts: `01-requirement.md`, `02-acceptance-criteria.md`, `04-design-contract.md`, `EPIC-PG`, `D-04`, `D-07`, `D-25`, `D-33`, `D-43`, `D-52`.
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
