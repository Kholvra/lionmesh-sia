# Design Contract: PD-005 — Faktur penjualan dan piutang

- Source: `docs/product/items/PD-005-faktur-piutang/01-requirement.md` (`PD-005`); `docs/product/decisions.md` (`D-07`, `D-08`, `D-14`, `D-17`, `D-24`, `D-25`, `D-33`, `D-35`, `D-41`, `D-43`, `D-44`, `D-46`, `D-48`, `D-49`, `D-51`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-15`)
- Status: `Proposed`
- Profile: product app, modul Pendapatan (uang, jurnal, status dokumen)
- Scope: faktur, DPP, PPN, piutang, jatuh tempo, aging, jurnal pemicu, pembatalan
- Owner: tech lead (COA dan `postJournal` milik `FND-006`)

## Intent and non-goals

**Intent.** Setiap faktur bernilai sama dengan barang yang sudah dikirim, tidak pernah dobel, dan setiap rupiah piutang punya jurnal yang balance.

**Non-goals.** Pembayaran (`PD-006`), retur (`PD-007`), dan integrasi e-Faktur (`D-24`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server action | nomor faktur pajak, tanggal faktur, alasan batal | parse dan validasi | nilai bertipe | tolak |
| `B-02` | Server → core ledger | kejadian jurnal | hanya lewat `postJournal()` | jurnal balance | tolak; tidak ada baris |
| `B-03` | Sumber tarif | `konfigurasi_pajak` | tarif yang berlaku pada tanggal faktur | tarif berversi | tolak bila tarif tidak ada |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Terbitkan faktur | pengiriman `DIKIRIM` dan belum punya faktur `DITERBITKAN`/`DRAFT` aktif | server action | tolak |
| `PRE-02` | Terbitkan faktur | periode akuntansi tidak terkunci (`ARCH-001` `PRE-02`) | core ledger | tolak; tidak ada baris |
| `PRE-03` | Terbitkan faktur | tarif T berlaku pada tanggal faktur tersedia (`D-51(a)`) | server action | tolak |
| `PRE-04` | Terbitkan faktur | termin terisi; nomor faktur pajak terisi (`AC-10`) | server action | tolak |
| `PRE-05` | Terbitkan faktur | aktor berperan Accounting (`D-33`) | server action | tolak |
| `PRE-06` | Batalkan faktur | status `DRAFT`, atau `DITERBITKAN` tanpa pembayaran; alasan tidak kosong | server action | tolak |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Faktur `DITERBITKAN` dengan total = DPP + PPN; jatuh tempo terisi | baris pengiriman | piutang bertambah |
| `POST-02` | Satu jurnal pemicu: Dr `piutang_usaha` total, Cr `penjualan` DPP, Cr `ppn_keluaran` PPN; debit = kredit | nomor faktur | baris jurnal (`sumber_tipe` = faktur) |
| `POST-03` | Nomor faktur unik; riwayat pertama tercatat | — | nomor terpakai |
| `POST-04` | Pembatalan `DITERBITKAN` membentuk jurnal pembalik; piutang kembali; pengiriman dilepas dari faktur | jurnal asal | jurnal pembalik, riwayat |
| `POST-05` | Pesanan `DIFAKTURKAN` bila seluruh pengirimannya memiliki faktur `DITERBITKAN` | nomor pesanan | riwayat pesanan |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Modul Pendapatan | Satu pengiriman punya paling banyak satu faktur aktif (`PQ-01`) | dua faktur aktif untuk satu pengiriman |
| `INV-02` | Core ledger | Total debit = total kredit; jurnal tidak diubah setelah tersimpan (`D-43`) | jurnal tidak balance; jurnal diedit |
| `INV-03` | Modul Pendapatan | Faktur tidak dihapus | baris faktur hilang |
| `INV-04` | Core dokumen | Setiap transisi punya riwayat (`ARCH-001` `INV-05`) | status berubah tanpa jejak |
| `INV-05` | Modul Pendapatan | Faktur `DITERBITKAN` dengan pembayaran tidak dibatalkan (`AC-11`) | pembatalan setelah pembayaran |
| `INV-06` | Modul Pendapatan | Qty faktur = qty kirim pengiriman | qty faktur dari pesanan |

State faktur: `DRAFT → DITERBITKAN → SEBAGIAN_LUNAS → LUNAS`; `DRAFT → DIBATALKAN`; `DITERBITKAN → DIBATALKAN` hanya tanpa pembayaran (`[USULAN-AGEN]` `PQ-08`).

## Failure and recovery semantics

| Kegagalan | Perilaku | Pemulihan |
|---|---|---|
| Jurnal gagal | faktur tidak diterbitkan; tidak ada piutang | ulangi |
| Tarif tidak ditemukan | tolak | isi tarif berlaku |
| Nomor faktur gagal | tolak | ulangi |
| Pembatalan gagal di tengah | jurnal pembalik dan status dibatalkan dalam satu transaksi | ulangi |

## Architecture boundaries

- Jurnal hanya lewat `core/ledger` (`ARCH-03`).
- Nomor dan riwayat lewat `core/dokumen` (`ARCH-05`).
- Piutang dibaca lewat service core (`D-25`, `ARCH-08`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | pengiriman non-`DIKIRIM` atau sudah difakturkan ditolak | uji manual | `05-evidence.md` AC-01, AC-02 | `Unverified` |
| `PRE-02` | periode terkunci ditolak tanpa baris | uji manual | `05-evidence.md` AC-09 | `Unverified` |
| `PRE-03` | tarif tidak ada ditolak | uji manual | `05-evidence.md` AC-03 | `Unverified` |
| `PRE-04` | nomor pajak kosong ditolak | uji manual | `05-evidence.md` AC-10 | `Unverified` |
| `PRE-05` | aktor bukan Accounting ditolak | uji otomatis | `05-evidence.md` AC-13 | `Unverified` |
| `PRE-06` | batal setelah pembayaran ditolak | uji manual | `05-evidence.md` AC-11 | `Unverified` |
| `POST-01` | total = DPP + PPN | uji unit | `05-evidence.md` AC-03 | `Unverified` |
| `POST-02` | jurnal balance dengan tiga baris peran | uji `postJournal()` | `05-evidence.md` AC-05 | `Unverified` |
| `POST-03` | nomor unik | uji manual | `05-evidence.md` AC-02 | `Unverified` |
| `POST-04` | pembalik dan pelepasan pengiriman | uji manual | `05-evidence.md` AC-12 | `Unverified` |
| `POST-05` | pesanan `DIFAKTURKAN` | uji manual | `05-evidence.md` AC-14 | `Unverified` |
| `INV-01` | satu faktur aktif per pengiriman | uji basis data | `05-evidence.md` AC-02 | `Unverified` |
| `INV-02` | debit = kredit; jurnal tidak diedit | uji `postJournal()` | `05-evidence.md` AC-05 | `Unverified` |
| `INV-03` | faktur tidak dihapus | uji manual | `05-evidence.md` AC-07 | `Unverified` |
| `INV-05` | batal setelah bayar ditolak | uji manual | `05-evidence.md` AC-11 | `Unverified` |
| `INV-06` | qty faktur = qty kirim | uji manual | `05-evidence.md` AC-15 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Kardinalitas faktur (`PQ-01`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `INV-01`, `POST-05` |
| Tarif PPN T (`PQ-02`) — `D-51(a)` | mekanisme terjawab; nilai diverifikasi saat implementasi | `POST-01`, `POST-02` |
| Nomor faktur pajak (`PQ-03`) — `D-51(a)`, `[USULAN-AGEN]` | terjawab, menunggu kunci | `PRE-04` |
| Akun piutang, penjualan, PPN keluaran (`PQ-04`) — `D-35`, `D-41` | terjawab; nomor di `FND-006` | `POST-02` |
| Bucket umur (`PQ-05`) — `D-51(f)`, tafsir `[USULAN-AGEN]` | terjawab, menunggu kunci | `AC-08` |
| Waktu jurnal (`PQ-06`) — `D-44` (3) | terjawab | periode `POST-02` |
| Jatuh tempo (`PQ-07`) — `D-49` | terjawab | `AC-04` |
| Batal faktur (`PQ-08`) — `D-35`, `[USULAN-AGEN]` | terjawab, menunggu kunci | `PRE-06`, `POST-04` |
