# GJ-004 — Readiness Review

## Verdict

`Blocked` — dependensi belum `done`: `GJ-003` (`specified`, depends on `GJ-002`); `FND-002` (`ready`); gate fondasi `FND-001`–`FND-007` belum `done` (D-54) (hanya `FND-001` yang `done`); `FND-007` (gate item modul, D-54).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Definition of Ready — evidence

| # | Check | Evidence | Status |
|---|---|---|---|
| 1 | Outcome sebagai perilaku | 01 bagian Outcome | Lolos |
| 2 | Aktor dan izin jelas | 01 bagian Aktor dan "Siapa boleh melihat"; P-08 dan P-13 terjawab (`[USULAN-AGEN]`) | Lolos |
| 3 | Status dan transisi eksplisit, jalur gagal juga | 01 bagian Status: `DRAFT_TERHITUNG`, `REVISI`, hitung ulang; kegagalan tanpa draft parsial (AC-14) | Lolos |
| 4 | Validasi punya pesan | 01 bagian Validasi (periode, tarif, PTKP, histori, alasan, periode dikunci) | Lolos |
| 5 | AC bisa dibuktikan | 02 AC-01 sampai AC-17; nilai dikutip dari tabel berversi saat implementasi (placeholder di 02) | Lolos |
| 6 | `depends on` berstatus `done` | `backlog.md`: `GJ-003` = `specified`; `FND-002` = `ready` | Belum lolos |
| 7 | Tidak ada pertanyaan pemblokir terbuka | 00 tanpa pertanyaan terbuka; P-01 sampai P-13 terjawab (`D-19`, `D-51`, sebagian `[USULAN-AGEN]`) | Lolos |
| 8 | Gate fondasi terpenuhi | Hanya `FND-001` `done`; `FND-007` belum (P-12) | Belum lolos |
| 9 | Ukuran wajar untuk satu orang satu track | Usulan `L` dicatat sebagai risiko tertulis (lihat Risiko); tidak dipecah di paket ini sesuai instruksi | Lolos (dengan risiko tertulis) |

Kondisi bersyarat:

| Kondisi | Berlaku? | Evidence |
|---|---|---|
| Menyentuh uang | Ya | Komponen, pembulatan, dan selisih pembulatan (`D-51(b)`). Akun peran dijurnal di GJ-007 (`D-41`, `D-35`). Sumber angka: tabel tarif berversi (`D-19`) |
| Mengubah stok | Tidak | — |
| Menyentuh status dokumen | Ya | `DRAFT_TERHITUNG`, `REVISI`; jejak `riwayat_status` (`D-08`); kontrak `PRE-01`, `POST-03`, `INV-04` |
| Melintasi modul | Ya | Presensi dan karyawan lewat service core (`D-25`); jurnal tidak ditulis (`D-43`) |
| Menyentuh data pribadi | Ya | Gaji, PTKP, rekening, BPJS per karyawan. Pembaca di 01 (`[USULAN-AGEN]`) |

## Dependensi yang belum done

| ID | Dependensi | Status |
|---|---|---|
| `GJ-003` | Periode `TERVALIDASI` (`depends on`) | `specified` |
| `FND-002` | Skema domain dan migrasi bernomor (`depends on`) | `ready` |
| `FND-003`–`FND-006` | Gate fondasi (`backlog.md` aturan 1) | `specified` |
| `FND-007` | Gate item modul (D-54, DoR butir 8) | `specified` |

## Keputusan `[USULAN-AGEN]` (disahkan `D-58`)

Tidak ada pertanyaan terbuka. Yang disahkan `D-58`: P-01 (daftar komponen awal), P-03 (urutan BPJS terhadap dasar PPh 21 mengikuti mekanisme berversi), P-05 (komponen berparameter wajib versi), P-07 (draft ditimpa saat hitung ulang), P-08 (override oleh HR), P-09 (`berlaku_dari` ≤ tanggal akhir periode), P-12 (primitive UI), P-13 (pembaca draft). Setiap jawaban ada di 00-discussion.md.

## Risiko

| Risiko | Dampak | Mitigasi usulan |
|---|---|---|
| Ukuran `L`: item bisa melebihi satu track dalam satu periode pengerjaan (DoR butir 9) | Melanggar aturan ukuran | Dicatat sebagai risiko tertulis. Pemecahan (mis. lembur dan BPJS terpisah dari TER) adalah keputusan tech lead dan pengguna, bukan keputusan paket ini. Agen tidak memecah sendiri |
| Tabel tarif salah isi | Gaji salah | `D-51` mekanisme berversi; nilai dikutip saat implementasi; seed dengan validasi jumlah baris dan kategori (`EPIC-GJ`) |
| Hitung ulang tidak identik | Gerbang epic gagal | AC-02; `D-51` dan P-07 |
| Tarif berubah di tengah periode | Angka lama berubah | AC-05; P-09 |
| Prorata dan pembulatan salah | Selisih angka per karyawan | AC-11, AC-12; hitung manual dibandingkan |

## Agent suggestions awaiting approval

| Hal | Usulan | Kenapa |
|---|---|---|
| Priority | `P0` (analisis §5.5) | Jalur kritis payroll (`backlog.md`) |
| Size | `L`, dengan risiko tertulis di atas | Cakupan komponen dan reproduksi |
| Override | Oleh HR dengan alasan (`D-48`) | Keputusan P-08 |

## Readiness status

`Blocked` (alasan tunggal: dependensi belum `done`).

## Handoff boundary

- Parent epic / milestone: `EPIC-GJ` / M1
- Lane / sequence / predecessor: active, level 4 (derived); predecessor `GJ-003` dan `FND-002`
- Foundation status / evidence: `partial`
- Artifact role / canonical source: canonical
- Next domain: `design-contracts` (sudah ditulis di 04, status `Proposed`), lalu `implementation-plan` atau `quick-dev` setelah `Ready`
- Required input artifacts: `decisions.md` (D-19, D-33, D-41, D-43, D-46, D-48, D-51); `analisis-sia.md` §5.5, §6.9, §7.2, §8.2 #20, §9.1 G7; makalah §4.1.2, §4.1.5, UC-GJ-05; `EPIC-GJ`
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- Requirement: `01-requirement.md`
- AC: `02-acceptance-criteria.md`
- Contract: `04-design-contract.md`
- Bukti: `05-evidence.md`
