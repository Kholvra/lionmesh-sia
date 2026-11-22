# PR-002 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: WO bisa dibuat, dilihat statusnya, dan riwayatnya tampil |
| 2 | Aktor dan izin jelas | lolos | Produksi membuat (`D-33`); pemohon tidak menyetujui sendiri (`D-48`); ubah dan batal oleh Produksi (`[USULAN-AGEN]`) |
| 3 | Status dan transisi eksplisit | lolos | Daftar dan transisi dari `D-46` §5.3, ditambah batal sesuai `D-48` dengan batas tertulis; jalur gagal (`BAHAN_KURANG` → `DIBATALKAN`, transisi ilegal ditolak) |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Tabel validasi di `01-requirement.md` memuat teks pesan untuk setiap kondisi |
| 5 | Acceptance criteria dapat dibuktikan | lolos | `AC-01` sampai `AC-13` bisa diuji dengan UI, uji service, atau review kode |
| 6 | Semua `depends on` berstatus `done` | belum | `PR-001` dan `FND-004` berstatus `specified` (`backlog.md`), belum `done` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | Q-01 sampai Q-09 terjawab: `D-33`, `D-46`, `D-48`, `D-50`, atau `[USULAN-AGEN]` |
| 8 | Gate fondasi terpenuhi | belum | `FND-001` `done`; `FND-002` sampai `FND-006` `specified`. Item menambah UI, jadi `FND-007` juga relevan |
| 9 | Ukuran masuk akal | lolos | Ukuran M (usulan paket, `D-50`): satu dokumen dengan status, riwayat, dan tiga layar |

Bersyarat:

| Kondisi | Status |
|---|---|
| Menyentuh uang | tidak |
| Mengubah stok | tidak. Pembatalan hanya dari status sebelum mutasi stok (`01-requirement.md`) |
| Menyentuh status dokumen | ya. Siapa yang mengubah dan jejak: `D-08`, `D-32`, `01-requirement.md` bagian Status |
| Melintasi modul | ya. Nomor lewat `core/dokumen`; pesanan penjualan tidak dipakai (Q-02) |
| Menyentuh data pribadi | tidak |

## Verdict

**`Blocked`**

Alasan tunggal: dependensi belum `done`: `PR-001` dan `FND-004` (keduanya `specified`).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Catatan

- Baris 8 (gate fondasi) mengikuti rantai dependensi yang sama. Ia tidak menambah alasan lain.
- `FND-004` menyediakan format nomor (`D-50`) dan mesin status; item ini memakainya.

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Batas batal (`[USULAN-AGEN]`) tidak disahkan koordinator | WO bisa dibatalkan di status yang tidak diinginkan | Batas tertulis di `01-requirement.md`; koordinator mengunci sebelum `Ready` |
| Hak ubah dan batal tidak ada di matriks v0 | peran lain bisa mengira punya hak | Dicatat ke koordinator; revisi matriks lewat `FND-003` atau keputusan baru |
| Nama status di `PR-003`, `PR-004`, `PR-005` berbeda | dua nama untuk satu konsep | Nama dari `D-46` §5.3 dipakai di semua item |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Semua aturan `Unverified`.

| Tipe kontrak | Dipakai | Alasan |
|---|---|---|
| Trust boundary | ya | Input form WO |
| Preconditions | ya | Target qty, BOM berlaku, peran, batas batal |
| Postconditions | ya | Nomor unik dan riwayat |
| Invariants | ya | WO tidak dihapus; versi BOM tetap; status sesuai tabel |
| State transition | ya | Status WO dari `D-46` dan batal dari `D-48` |
| Loop/termination | tidak | Tidak ada algoritma berulang |
| Architecture boundary | ya, dirujuk | `ARCH-05` dan `D-25` |

## Handoff boundary

- Parent epic / milestone: `EPIC-PR` / `M1`
- Lane / sequence / predecessor: `active` / `unset` (hybrid) / `PR-001` dan `FND-004`
- Foundation status / evidence: `partial`. `FND-001` `done`; `FND-002`–`FND-006` `specified`. Lihat `docs/product/backlog.md` bagian "Fondasi — serial"
- Artifact role / canonical source: `canonical` untuk paket ini
- Next domain: implementasi oleh track PR-B setelah status `Ready`
- Required input artifacts: `docs/product/items/PR-001-bom-berversi-dan-toleransi/` (`specified`), `docs/product/items/FND-004-dokumen-nomor-status-approval/` (`specified`), `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`
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
