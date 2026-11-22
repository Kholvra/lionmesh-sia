# PR-004 — Readiness Review

## Checklist Definition of Ready

| # | Kriteria | Status | Catatan |
|---|---|---|---|
| 1 | Outcome sebagai perilaku terlihat | lolos | `01-requirement.md` bagian Outcome: keluar, konfirmasi, sisa, dan selisih tampil dari UI |
| 2 | Aktor dan izin jelas | lolos | Gudang mencatat keluar; Produksi mengonfirmasi (`D-33`) |
| 3 | Status dan transisi eksplisit | lolos | Status WO `BERJALAN` dari `D-46` §5.3; pemakaian dari `REWORK` tanpa perubahan status; jalur gagal (stok kurang, tanggal mundur) ditolak tanpa mengubah status |
| 4 | Validasi punya pesan yang bisa dibaca | lolos | Tabel validasi di `01-requirement.md` memuat teks pesan |
| 5 | Acceptance criteria dapat dibuktikan | lolos | `AC-01` sampai `AC-14` diuji lewat UI, uji database, uji service, atau review kode |
| 6 | Semua `depends on` berstatus `done` | belum | `PR-003` dan `FND-005` berstatus `specified` (`backlog.md`), belum `done` |
| 7 | Tidak ada pertanyaan pemblokir terbuka | lolos | Q-01 sampai Q-09 terjawab: `D-33`, `D-41`, `D-43`, `D-44`, `D-50`, `D-52`, atau `[USULAN-AGEN]` |
| 8 | Gate fondasi terpenuhi | belum | `FND-001` `done`; `FND-002` sampai `FND-006` `specified`. Item menambah UI, jadi `FND-007` juga relevan |
| 9 | Ukuran masuk akal | lolos | Ukuran M (usulan paket, `D-50`): satu mutasi, satu konfirmasi, satu layar. Risiko mutasi dan jurnal dicatat di bawah |

Bersyarat:

| Kondisi | Status |
|---|---|
| Menyentuh uang | ya. Jurnal bahan keluar dan sisa, akun `persediaan_bahan` dan `barang_dalam_proses` (`D-41`); nilai dari harga rata-rata (`D-10`) |
| Mengubah stok | ya. Keluar menurunkan saldo; sisa menaikkan saldo; efek di transaksi yang sama (`D-06`) |
| Menyentuh status dokumen | ya. Status WO `BERJALAN`; siapa mengubah dan jejak: `D-08`, `D-33` |
| Melintasi modul | ya. Lewat `core/inventory` dan `core/ledger`; BOM lewat service `PR-001` |
| Menyentuh data pribadi | tidak |

## Verdict

**`Blocked`**

Alasan tunggal: dependensi belum `done`: `PR-003` dan `FND-005` (keduanya `specified`).

Siap menjadi Ready begitu dependensi done; tidak ada pemblokir lain.

## Catatan

- Baris 8 (gate fondasi) mengikuti rantai dependensi yang sama. Ia tidak menambah alasan lain.
- Jurnal bergantung pada `FND-006` (`D-43`, `D-41`). Ini tercakup oleh `FND-005` dan gate fondasi; `FND-006` ada di gate fondasi (baris 8).

## Risiko

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Nilai sisa dihitung pada harga keluar (`[USULAN-AGEN]`) berbeda dengan praktik nyata | WIP dan saldo tidak cocok dengan kenyataan | Uji dengan data uji; koordinator mengunci |
| Selisih memakai toleransi scrap berversi (`D-51`) | Penanda "investigasi" berubah bila toleransi berubah | Nilai toleransi diverifikasi saat implementasi |
| Valuasi FIFO di catatan perusahaan vs `D-10` | Nilai bahan keluar berbeda dengan kebijakan perusahaan | `D-10` menang; valuasi di balik antarmuka `FND-005` |

## Kontrak desain

`04-design-contract.md` berstatus `Proposed`. Semua aturan `Unverified`.

| Tipe kontrak | Dipakai | Alasan |
|---|---|---|
| Trust boundary | ya | Input konfirmasi, identitas, data stok |
| Preconditions | ya | Stok cukup, tanggal, status WO, peran |
| Postconditions | ya | Saldo dan mutasi dalam satu transaksi; jurnal balance |
| Invariants | ya | Stok tidak negatif; saldo sama dengan mutasi; nilai sama dengan qty × harga |
| State transition | ya, ringkas | WO menjadi `BERJALAN` (`D-46`) |
| Loop/termination | tidak | Tidak ada algoritma berulang |
| Architecture boundary | ya, dirujuk | `ARCH-04`, `D-25`, `D-07` |

## Handoff boundary

- Parent epic / milestone: `EPIC-PR` / `M1`
- Lane / sequence / predecessor: `active` / `unset` (hybrid) / `PR-003` dan `FND-005`
- Foundation status / evidence: `partial`. `FND-001` `done`; `FND-002`–`FND-006` `specified`. Lihat `docs/product/backlog.md` bagian "Fondasi — serial"
- Artifact role / canonical source: `canonical` untuk paket ini
- Next domain: implementasi setelah status `Ready`
- Required input artifacts: `docs/product/items/PR-003-kebutuhan-dan-permintaan-bahan/` (`specified`), `docs/product/items/FND-005-inventory-mutasi-saldo-valuasi/` (`specified`), `docs/product/items/FND-006-ledger-coa-jurnal-periode/` (`specified`), `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`
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
