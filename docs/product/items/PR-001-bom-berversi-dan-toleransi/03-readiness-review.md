# PR-001 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: BOM dan versi bisa dibuat dan dibaca dari UI |
| 2 | Aktor dan izin jelas | lolos | Produksi menulis (`D-33`). Baca untuk peran lain dan tanpa persetujuan versi ditetapkan di `00-discussion.md` Q-07 |
| 3 | Status dan transisi eksplisit | lolos | Status versi `TERJADWAL`, `BERLAKU`, `DIGANTIKAN` dengan transisi berbasis tanggal; jalur gagal (simpan gagal, validasi) di `01-requirement.md` dan `04-design-contract.md` |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Tabel validasi di `01-requirement.md` memuat teks pesan untuk setiap kondisi |
| 5 | Acceptance criteria dapat dibuktikan | lolos | `AC-01` sampai `AC-13` memakai langkah UI, review DDL, `pnpm check:migrations`, `pnpm arch:check`, atau uji service |
| 6 | Semua `depends on` berstatus `done` | belum | `C-011` dan `FND-002` berstatus `specified` (`backlog.md`), belum `done` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | Semua Q-01 sampai Q-09 terjawab: `D-31`, `D-33`, `D-38`, `D-50`, `D-51`, atau `[USULAN-AGEN]` |
| 8 | Gate fondasi terpenuhi | belum | `FND-001` `done`; `FND-002` sampai `FND-006` `specified`. Item menambah UI, jadi `FND-007` juga relevan |
| 9 | Ukuran masuk akal | lolos | Ukuran M (usulan paket, `D-50`): satu tabel BOM, versi, toleransi, dan dua layar |

Bersyarat:

| Kondisi | Status |
|---|---|
| Menyentuh uang | tidak |
| Mengubah stok | tidak |
| Menyentuh status dokumen | tidak. Versi bukan dokumen; kolom audit `created_by`, `created_at` sesuai `D-32` |
| Melintasi modul | ya. Master produk lewat service `C-011`; `produk_komponen` lewat service core (`D-31`, `D-25`) |
| Menyentuh data pribadi | tidak |

## Verdict

**`Blocked`**

Alasan tunggal: dependensi belum `done`: `C-011` dan `FND-002` (keduanya `specified`).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Catatan

- Baris 8 (gate fondasi) mengikuti rantai dependensi yang sama. Ia tidak menambah alasan lain.
- Pertanyaan tidak ada yang terbuka. Usulan agen (`[USULAN-AGEN]`) menunggu pengesahan koordinator (`00-discussion.md`).

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Format toleransi belum diuji dengan data nyata | angka kebutuhan dan batas reject bisa tidak sesuai praktik | Nilai diverifikasi saat implementasi (`D-51`); uji dengan data uji tetap |
| Baris "lihat BOM" dan "ubah versi" belum ada di matriks izin v0 | peran lain tidak punya hak baca yang tertulis | Dicatat sebagai usulan ke koordinator; revisi matriks lewat `FND-003` atau keputusan baru (`D-33`) |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Semua aturan `Unverified`.

| Tipe kontrak | Dipakai | Alasan |
|---|---|---|
| Trust boundary | ya | Input form BOM dari browser |
| Preconditions | ya | Produk aktif di `C-011`; qty positif; komponen bahan |
| Postconditions | ya | Versi baru tidak mengubah versi lama |
| Invariants | ya | Versi lama tidak berubah; BOM tanpa kolom stok atau harga; satu versi per tanggal |
| State transition | ya | Status versi berbasis tanggal |
| Loop/termination | tidak | Tidak ada algoritma berulang |
| Architecture boundary | ya, dirujuk | Modul hanya memanggil service core (`ARCH-08`, `D-25`) |

## Handoff boundary

- Parent epic / milestone: `EPIC-PR` / `M1`
- Lane / sequence / predecessor: `active` / `unset` (hybrid) / `C-011` dan `FND-002`
- Foundation status / evidence: `partial`. `FND-001` `done`; `FND-002`–`FND-006` `specified`. Lihat `docs/product/backlog.md` bagian "Fondasi — serial"
- Artifact role / canonical source: `canonical` untuk paket ini; `decisions.md` lebih tinggi dari `backlog.md`
- Next domain: implementasi oleh track Produksi setelah status `Ready`
- Required input artifacts: `docs/product/items/C-011-master-data/` (`specified`), `docs/product/items/FND-002-skema-domain-inti/` (`specified`), `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`
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
