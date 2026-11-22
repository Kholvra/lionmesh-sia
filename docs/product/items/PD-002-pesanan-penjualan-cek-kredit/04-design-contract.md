# Design Contract: PD-002 — Pesanan penjualan dan cek batas kredit

- Source: `docs/product/items/PD-002-pesanan-penjualan-cek-kredit/01-requirement.md` (`PD-002`); `docs/product/decisions.md` (`D-08`, `D-14`, `D-16`, `D-17`, `D-33`, `D-38`, `D-42`, `D-46`, `D-47(a)`, `D-48`, `D-51(a)`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-17`)
- Status: `Proposed`
- Profile: product app, modul Pendapatan (dokumen, uang, status)
- Scope: pesanan, total, verifikasi, cek batas kredit, override, pengembalian, pembatalan
- Owner: tech lead

## Intent and non-goals

**Intent.** Pesanan tidak bisa lolos verifikasi tanpa cek batas kredit, pembuat tidak memverifikasi pesanannya sendiri, dan setiap perubahan status meninggalkan jejak yang bisa diaudit.

**Non-goals.** Mutasi dan alokasi stok (`PD-003`, `PD-004`), jurnal (`PD-008`), dan nilai faktur (`PD-005`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server action | baris, diskon, termin, alasan | parse dan validasi di server | nilai bertipe | tolak dengan pesan |
| `B-02` | Sesi → identitas aktor | cookie sesi | `actor_id` dan peran dari sesi; tidak dari form | peran tepercaya | tolak; tidak menulis |
| `B-03` | Server → basis data | query dari server | constraint dan RLS | baris lolos kebijakan | tolak di basis data |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Verifikasi pesanan | status `DRAFT` atau `REVISI`; minimal satu baris; qty > 0 semua baris | server action | tolak; status tidak berubah |
| `PRE-02` | Override batas kredit | aktor Manajemen; alasan tidak kosong; status `MENUNGGU_PERSETUJUAN_KREDIT` | server action | tolak; tidak ada perubahan |
| `PRE-03` | Pesanan dipilih untuk dokumen baru | pelanggan `aktif` (`PD-001`) | server action | tolak |
| `PRE-04` | Buat pesanan | nomor diperoleh dari `core/dokumen` | server action | tolak bila nomor gagal |
| `PRE-05` | Verifikasi pesanan | aktor bukan pembuat pesanan (`D-48`, `PQ-09`) | server action | tolak; status tidak berubah |
| `PRE-06` | Ubah isi pesanan | status `DRAFT` atau `REVISI`; aktor pembuat | server action | tolak dengan pesan "sudah diverifikasi" |
| `PRE-07` | Batalkan pesanan | alasan tidak kosong; status `DRAFT`, `MENUNGGU_PERSETUJUAN_KREDIT`, atau `VERIFIED` tanpa pengiriman; aktor pembuat atau Manajemen (menolak) | server action | tolak; status tidak berubah |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Pesanan `VERIFIED` memiliki total sesuai rumus (`01-requirement.md`) dengan T yang berlaku saat verifikasi | nomor pesanan dan baris | baris `riwayat_status` |
| `POST-02` | Pesanan melewati batas kredit berstatus `MENUNGGU_PERSETUJUAN_KREDIT`, setelah `VERIFIED` tercatat | baris dan total | dua baris riwayat |
| `POST-03` | Override menyimpan alasan, aktor, dan waktu; status kembali `VERIFIED` | nilai batas kredit | baris riwayat |
| `POST-04` | Pembatalan menyimpan alasan, aktor, dan waktu; alokasi aktif dilepas | baris pesanan (tidak dihapus) | baris riwayat; pelepasan alokasi (`PD-003`) |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Modul Pendapatan | Setiap perubahan status memiliki baris `riwayat_status` (`D-08`) | status berubah tanpa jejak |
| `INV-02` | Modul Pendapatan | Pesanan tidak dihapus; dibatalkan | baris pesanan hilang |
| `INV-03` | Modul Pendapatan | Pesanan `DIBATALKAN` tidak bisa kembali ke status lain | transisi dari `DIBATALKAN` |
| `INV-04` | Modul Pendapatan | Pembuat tidak memverifikasi pesanannya sendiri (`D-48`) | verifikasi oleh pembuat |
| `INV-05` | Modul Pendapatan | Pesanan `VERIFIED` tidak berubah isinya | baris berubah setelah `VERIFIED` |
| `INV-06` | Modul Pendapatan | Pesanan dengan pengiriman tidak dibatalkan | `DIBATALKAN` setelah `TERKIRIM_SEBAGIAN` |

State pesanan: `D-46` (`DRAFT`, `REVISI`, `VERIFIED`, `MENUNGGU_STOK`, `SIAP_KIRIM`, `TERKIRIM_SEBAGIAN`, `TERKIRIM`, `DIFAKTURKAN`, `SELESAI`, `DIBATALKAN`) ditambah `MENUNGGU_PERSETUJUAN_KREDIT` (`D-47(a)`). Transisi `VERIFIED → DIBATALKAN` adalah `[USULAN-AGEN]` (`PQ-06`).

## Failure and recovery semantics

| Kegagalan | Perilaku | Pemulihan |
|---|---|---|
| Nomor gagal dibuat | pesanan tidak tersimpan | ulangi |
| Dua orang memverifikasi bersamaan | hanya satu transisi berhasil (update bersyarat `WHERE status = ...`) | pesan "dokumen sudah diproses" |
| Cek kredit gagal di tengah verifikasi | seluruh verifikasi dibatalkan; status tetap `DRAFT`/`REVISI` | ulangi |
| Override gagal menyimpan | status tetap `MENUNGGU_PERSETUJUAN_KREDIT` | ulangi |

## Architecture boundaries

- Nomor dan riwayat lewat `core/dokumen` (`ARCH-05`).
- Exposure piutang dibaca lewat service core piutang (`PD-005`); tidak membaca tabel `faktur` langsung dari modul (`D-25`, `ARCH-08`).
- Tarif PPN dibaca dari `konfigurasi_pajak` berversi (`D-51(a)`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | verifikasi tanpa baris ditolak | uji manual | `05-evidence.md` AC-02 | `Unverified` |
| `PRE-02` | override bukan Manajemen ditolak; tanpa alasan ditolak | uji otomatis | `05-evidence.md` AC-06 | `Unverified` |
| `PRE-03` | pelanggan nonaktif ditolak | uji manual | `05-evidence.md` AC-17 | `Unverified` |
| `PRE-05` | verifikasi oleh pembuat ditolak | uji otomatis | `05-evidence.md` AC-10 | `Unverified` |
| `PRE-06` | ubah isi `VERIFIED` ditolak | uji manual | `05-evidence.md` AC-11 | `Unverified` |
| `PRE-07` | batal tanpa alasan ditolak; batal setelah pengiriman ditolak | uji manual | `05-evidence.md` AC-08, AC-12 | `Unverified` |
| `POST-01` | total = rumus dengan T | uji unit | `05-evidence.md` AC-03 | `Unverified` |
| `POST-02` | exposure melewati batas → status | uji manual | `05-evidence.md` AC-05, AC-13, AC-14 | `Unverified` |
| `POST-03` | override tersimpan dengan alasan | uji manual | `05-evidence.md` AC-06 | `Unverified` |
| `POST-04` | pembatalan melepas alokasi | uji lintas (`PD-003`) | `05-evidence.md` AC-12 | `Unverified` |
| `INV-01` | setiap transisi → satu baris riwayat | pemeriksaan basis data | `05-evidence.md` AC-07 | `Unverified` |
| `INV-03` | `DIBATALKAN` tidak bisa diverifikasi | uji manual | `05-evidence.md` AC-08 | `Unverified` |
| `INV-04` | verifikasi pembuat ditolak | uji otomatis | `05-evidence.md` AC-10 | `Unverified` |
| `INV-05` | isi `VERIFIED` tidak berubah | uji manual | `05-evidence.md` AC-11 | `Unverified` |
| `INV-06` | pembatalan setelah pengiriman ditolak | uji manual | `05-evidence.md` AC-12 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Daftar status (`PQ-01`) — `D-46`, `D-47(a)` | terjawab | seluruh `PRE`/`POST` |
| Tanpa approval nominal (`PQ-02`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `PRE-02` tambahan transisi |
| Diskon per baris (`PQ-03`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `POST-01` |
| Sumber harga (`PQ-04`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `POST-01` |
| Exposure (`PQ-05`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `POST-02` |
| Pesanan `VERIFIED` dibatalkan (`PQ-06`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `PRE-07`, `INV-05` |
| Verifikator bukan pembuat (`PQ-09`) — `[USULAN-AGEN]` | terjawab, menunggu kunci | `PRE-05`, `INV-04` |
| Tarif PPN T — `D-51(a)` | mekanisme terjawab; nilai diverifikasi saat implementasi | `POST-01` |
