# Design Contract: PD-006 — Penerimaan pembayaran pelanggan

- Source: `docs/product/items/PD-006-penerimaan-pembayaran/01-requirement.md` (`PD-006`); `docs/product/decisions.md` (`D-07`, `D-08`, `D-25`, `D-33`, `D-35`, `D-41`, `D-43`, `D-44`, `D-46`, `D-48`, `D-49`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-16`)
- Status: `Proposed`
- Profile: product app, modul Pendapatan (uang, jurnal, status dokumen)
- Scope: penerimaan, verifikasi, alokasi FIFO faktur, sisa faktur, jurnal kas, pembatalan
- Owner: tech lead

## Intent and non-goals

**Intent.** Jumlah yang dialokasikan tidak pernah melebihi sisa faktur, total alokasi sama dengan nominal, dan setiap penerimaan terverifikasi berjurnal balance dengan piutang yang berkurang.

**Non-goals.** Rekonsiliasi bank (`PG-010`), pembayaran pemasok, retur, dan kelebihan bayar.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server action | nominal, metode, referensi, pelanggan | parse, dua desimal | nilai bertipe | tolak |
| `B-02` | Sesi → identitas aktor | cookie sesi | `actor_id` dan peran dari sesi | peran tepercaya | tolak |
| `B-03` | Server → core ledger | kejadian kas | `postJournal()` saja | jurnal balance | tolak; tidak ada baris |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Catat penerimaan | nominal > 0; nominal ≤ total sisa faktur terbuka pelanggan; metode Transfer atau Giro | server action | tolak; tidak ada baris |
| `PRE-02` | Catat penerimaan | periode akuntansi tidak terkunci | core ledger | tolak |
| `PRE-03` | Verifikasi | status `DICATAT`; aktor Accounting dan bukan pencatat (`D-48`) | server action | tolak |
| `PRE-04` | Verifikasi | alokasi per faktur ≤ sisa; semua faktur milik pelanggan penerimaan | server action | tolak; tidak ada jurnal |
| `PRE-05` | Batalkan | alasan tidak kosong; status `DICATAT` atau `TERVERIFIKASI` (dengan jurnal pembalik) | server action | tolak |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Σ alokasi = nominal; sisa faktur = total − Σ alokasi | nilai faktur asal | status faktur turunan |
| `POST-02` | Satu jurnal: Dr `kas_bank` nominal, Cr `piutang_usaha` nominal; debit = kredit | nomor penerimaan | baris jurnal |
| `POST-03` | Piutang pelanggan berkurang sebesar total alokasi | — | — |
| `POST-04` | Faktur `LUNAS` bila sisa 0; pesanan `SELESAI` bila seluruh faktur pesanan `LUNAS` | nomor dokumen | riwayat |
| `POST-05` | Pembatalan `TERVERIFIKASI` membentuk jurnal pembalik; alokasi dilepas; status faktur dihitung ulang | jurnal asal | riwayat |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Modul Pendapatan | Σ alokasi per faktur ≤ total faktur (dikurangi pembatalan) | faktur terbayar melebihi nilainya |
| `INV-02` | Core ledger | Debit = kredit; jurnal tidak diubah (`D-43`) | jurnal tidak balance |
| `INV-03` | Modul Pendapatan | Penerimaan tidak dihapus (`D-48`) | baris hilang |
| `INV-04` | Core dokumen | Setiap transisi punya riwayat (`ARCH-001` `INV-05`) | status berubah tanpa jejak |
| `INV-05` | Modul Pendapatan | Total alokasi penerimaan = nominal | penerimaan sebagian tak teralokasi |
| `INV-06` | Modul Pendapatan | Pencatat ≠ verifikator (`D-48`) | verifikasi oleh pencatat |

State penerimaan: `DICATAT → TERVERIFIKASI`; `DICATAT → DIBATALKAN`; `TERVERIFIKASI → DIBATALKAN` (jurnal pembalik). State faktur turunan: `DITERBITKAN → SEBAGIAN_LUNAS → LUNAS`, dihitung dari sisa.

## Failure and recovery semantics

| Kegagalan | Perilaku | Pemulihan |
|---|---|---|
| Jurnal gagal saat verifikasi | penerimaan tetap `DICATAT`; tidak ada alokasi | ulangi verifikasi |
| Alokasi gagal di tengah | seluruh transaksi dibatalkan | ulangi |
| Dua verifikasi bersamaan | hanya satu berhasil (update bersyarat `WHERE status = 'DICATAT'`) | pesan "Dokumen sudah diproses" |
| Pembatalan gagal di tengah | jurnal pembalik dan pelepasan alokasi dalam satu transaksi | ulangi |

## Architecture boundaries

- Jurnal hanya lewat `core/ledger` (`ARCH-03`).
- Nomor dan riwayat lewat `core/dokumen` (`ARCH-05`).
- Tidak membaca tabel modul lain (`D-25`, `ARCH-08`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | nominal melebihi tagihan atau metode tidak valid ditolak | uji manual | `05-evidence.md` AC-04, AC-15 | `Unverified` |
| `PRE-02` | periode terkunci ditolak | uji manual | `05-evidence.md` AC-09 | `Unverified` |
| `PRE-03` | verifikasi oleh pencatat ditolak | uji otomatis | `05-evidence.md` AC-11 | `Unverified` |
| `PRE-04` | alokasi lintas pelanggan ditolak | uji manual | `05-evidence.md` AC-05 | `Unverified` |
| `PRE-05` | batal tanpa alasan ditolak | uji manual | `05-evidence.md` AC-12, AC-13 | `Unverified` |
| `POST-01` | Σ alokasi = nominal | uji unit | `05-evidence.md` AC-01, AC-03 | `Unverified` |
| `POST-02` | jurnal balance dengan dua baris peran | uji `postJournal()` | `05-evidence.md` AC-06 | `Unverified` |
| `POST-03` | piutang berkurang | uji manual | `05-evidence.md` AC-07 | `Unverified` |
| `POST-04` | status faktur dan pesanan | uji manual | `05-evidence.md` AC-02, AC-14 | `Unverified` |
| `POST-05` | pembatalan terverifikasi membalik jurnal | pemeriksaan jurnal | `05-evidence.md` AC-12 | `Unverified` |
| `INV-01` | Σ alokasi ≤ total | uji concurrency | `05-evidence.md` AC-03 | `Unverified` |
| `INV-02` | debit = kredit | uji `postJournal()` | `05-evidence.md` AC-06 | `Unverified` |
| `INV-03` | penerimaan tidak dihapus | uji manual | `05-evidence.md` AC-13 | `Unverified` |
| `INV-05` | total alokasi = nominal | uji unit | `05-evidence.md` AC-03, AC-16 | `Unverified` |
| `INV-06` | pencatat tidak memverifikasi | uji otomatis | `05-evidence.md` AC-11 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Kelebihan bayar (`PQ-01`) — `D-49` | terjawab | `PRE-01` |
| Selisih dan total alokasi (`PQ-02`) — `D-49`, `[USULAN-AGEN]` | terjawab, menunggu kunci | `INV-05` |
| Metode dan bukti (`PQ-03`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `PRE-01` |
| Akun kas (`PQ-04`) — `D-41` (`kas_bank`) | terjawab | `POST-02` |
| Verifikasi terhadap jurnal (`PQ-05`) — `D-33`, `D-43`, `[USULAN-AGEN]` | terjawab, menunggu kunci | `POST-02` |
| Pembayaran ditolak bank (`PQ-06`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `POST-05` |
