# PR-006 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: HPP WO dan jurnal tampil dari UI; rumus mengikat dari `EPIC-PR` |
| 2 | Aktor dan izin jelas | lolos | Accounting mencatat dan memposting (`D-33`); Produksi mengisi kartu jam dan melihat HPP; tanpa persetujuan terpisah (`[USULAN-AGEN]` Q-10) |
| 3 | Status dan transisi eksplisit | lolos | Status HPP mengikuti status WO `SELESAI` (`D-46`); pembebanan tambahan dan penyesuaian final didefinisikan di `01-requirement.md`; jalur gagal (periode terkunci, tarif tidak ada, jurnal tidak balance) tertulis |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Tabel validasi di `01-requirement.md` memuat teks pesan |
| 5 | Acceptance criteria dapat dibuktikan | lolos | `AC-01` sampai `AC-14` bisa diuji dengan data uji, uji database, `postJournal()`, atau review kode |
| 6 | Semua `depends on` berstatus `done` | belum | `PR-004`, `PR-005`, dan `FND-006` berstatus `specified` (`backlog.md`), belum `done` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | Q-01 sampai Q-11 terjawab: `D-12`, `D-33`, `D-41`, `D-43`, `D-44`, `D-50`, `D-51`, atau `[USULAN-AGEN]` |
| 8 | Gate fondasi terpenuhi | belum | `FND-001` `done`; `FND-002` sampai `FND-006` `specified`. Item menambah UI, jadi `FND-007` juga relevan |
| 9 | Ukuran masuk akal | lolos | Ukuran L (usulan paket, `D-50`). Risiko ukuran dicatat di bawah dan tidak dipecah sesuai instruksi |

Bersyarat:

| Kondisi | Status |
|---|---|
| Menyentuh uang | ya. HPP dan jurnal pembebanan. Akun `tenaga_kerja_langsung`, `overhead_pabrik`, `barang_dalam_proses`, `persediaan_barang_jadi`, `hpp`, `kerugian_produksi_abnormal` (`D-41`); nomor kerugian saat `FND-006`. Sumber angka: `D-10`, `D-12`, `D-13`, `D-44` (4), `D-51` |
| Mengubah stok | tidak langsung. Membaca nilai bahan dari `saldo_stok`; penyesuaian final memindahkan nilai WIP ke persediaan barang jadi |
| Menyentuh status dokumen | ya. Status HPP mengikuti WO; siapa memposting: Accounting (`D-33`); jejak `D-08` dan kolom audit `D-32` |
| Melintasi modul | ya. Kartu jam kerja lewat service modul Produksi; karyawan lewat service core; jurnal lewat `core/ledger`. Tidak membaca tabel `GJ-*` (`D-25`, `D-44`) |
| Menyentuh data pribadi | ya, ringan. Kartu jam kerja memuat karyawan dan jam per tanggal. Yang boleh melihat: Produksi (isi dan lihat), Accounting dan Manajemen (hanya total per WO) (`[USULAN-AGEN]`) |

## Verdict

**`Blocked`**

Alasan tunggal: dependensi belum `done`: `PR-004`, `PR-005`, dan `FND-006` (ketiganya `specified`).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Catatan

- Baris 8 (gate fondasi) mengikuti rantai dependensi yang sama. Ia tidak menambah alasan lain.
- `C-010` (tutup buku) menerima sisa penyelesaian overhead (`D-44` (4)); ia tidak menjadi dependensi `PR-006`.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Ukuran L: empat suku rumus, kartu jam kerja, tarif, jurnal, dan penyesuaian final | Item tidak selesai dalam satu track; kualitas uji turun | Tidak dipecah sesuai instruksi; dicatat sebagai risiko. Keputusan pemecahan ada di koordinator setelah implementasi awal |
| Tarif per jam dan tarif overhead belum diketahui nilainya (`D-51`) | Angka HPP tidak bisa diuji sebelum tarif diisi | Mekanisme berversi; nilai diisi Accounting dan diverifikasi saat implementasi |
| Kartu jam kerja dan presensi karyawan (`D-53`, `GJ-002`) bisa dicatat dua kali | Jam kerja ganda; TKL salah | Dicatat ke koordinator sebagai pertentangan; default: kartu jam per WO terpisah |
| Sumber jam kerja memuat data personal | Kewajiban privasi | Field dan akses ditulis di `01-requirement.md` (kondisi data pribadi) |
| Driver overhead: jam mesin di catatan vs DLH di `D-12` | Tarif tidak konsisten | `D-12` menang; konfirmasi dicatat |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Semua aturan `Unverified`.

| Tipe kontrak | Dipakai | Alasan |
|---|---|---|
| Trust boundary | ya | Input tarif, kartu jam, dan posting |
| Preconditions | ya | Status WO, periode, tarif, peran |
| Postconditions | ya | HPP dan jurnal balance |
| Invariants | ya | Rumus; jurnal balance; HPP lama tidak berubah |
| State transition | ya | Status HPP mengikuti WO (`D-46`) |
| Loop/termination | tidak | Tidak ada algoritma berulang |
| Architecture boundary | ya, dirujuk | `ARCH-03`, `D-25`, `D-07` |

## Handoff boundary

- Parent epic / milestone: `EPIC-PR` / `M1`
- Lane / sequence / predecessor: `active` / `unset` (hybrid) / `PR-004`, `PR-005`, `FND-006`
- Foundation status / evidence: `partial`. `FND-001` `done`; `FND-002`–`FND-006` `specified`. Lihat `docs/product/backlog.md` bagian "Fondasi — serial"
- Artifact role / canonical source: `canonical` untuk paket ini
- Next domain: implementasi setelah status `Ready`
- Required input artifacts: `docs/product/items/PR-004-pemakaian-bahan-dan-wip/` (`specified`), `docs/product/items/PR-005-hasil-produksi-dan-qc/` (`specified`), `docs/product/items/FND-006-ledger-coa-jurnal-periode/` (`specified`), `docs/product/items/C-010-tutup-buku/` (`specified`, untuk penyelesaian sisa overhead), `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`. `GJ-*` bukan input (`D-44`)
- Implementation plan: `Not created`
- Out of scope for this skill: setup execution, technical task breakdown, contract compilation, test strategy, and code changes.

## Links

- `00-discussion.md`
- `01-requirement.md`
- `02-acceptance-criteria.md`
- `04-design-contract.md`
- `05-evidence.md`
- `docs/product/backlog.md`
- `docs/product/epics/EPIC-PR.md`
- `docs/product/decisions.md`
