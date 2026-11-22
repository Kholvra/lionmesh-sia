# Design Contract: C-012 — Notifikasi in-app dan email

- Source: `docs/product/items/C-012-notifikasi/01-requirement.md` (`C-012`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-07`)
- Status: `Proposed` — belum diverifikasi; semua aturan `Unverified`
- Profile: product app — notifikasi dan antrean kirim
- Scope: penyimpanan notifikasi, daftar in-app, antrean email dan statusnya
- Urutan: gelombang 2 (`D-34`)
- Owner: tech lead
- Keputusan yang dipakai: `D-01`, `D-18`, `D-25`, `D-34`, `D-50`, `D-52`, `D-53`

## Intent and non-goals

**Intent.** Notifikasi hanya sampai ke penerima yang berhak, dan setiap pengiriman punya status yang bisa diperiksa.

**Non-goals.** WhatsApp (`D-52`), dashboard (`C-014`), preferensi pengguna (`D-50`), pemilihan vendor SMTP (PT-03).

## Catatan kontrak ringkas

Item ini tidak memegang uang atau stok. Namun menyentuh **data pribadi** (alamat email) dan **status kirim**, jadi aturan inti ditulis di sini. PT-05 dan PT-07 sudah tertulis di kontrak (`[USULAN-AGEN]`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Modul/core → antrean notifikasi | kejadian pemicu | validasi jenis dan penerima | notifikasi bertipe | tolak; tidak ada baris |
| `B-02` | Sesi → daftar notifikasi | cookie sesi | ambil penerima dari sesi | `actor_id` | tolak bila bukan penerima |
| `B-03` | Antrean → penyedia email | alamat dan isi email | validasi alamat; tidak ada angka di luar hak penerima | payload terbatas | tandai `gagal` dengan alasan |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Notifikasi dibuat | jenis dan penerima terdaftar (PT-01, PT-02, `[USULAN-AGEN]`) | core | tolak |
| `PRE-02` | Email dikirim | alamat penerima tidak kosong | core | tandai `gagal` |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | notifikasi tersimpan untuk penerima yang berhak | transaksi pemicu | — |
| `POST-02` | setiap email punya status `menunggu`, `terkirim`, atau `gagal` | — | antrean |
| `POST-03` | isi email tidak memuat angka keuangan (PT-05, `[USULAN-AGEN]`) | — | — |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | core notifikasi | notifikasi hanya tampil untuk penerimanya | notifikasi bocor ke pengguna lain |
| `INV-02` | core notifikasi | kegagalan kirim tidak membatalkan transaksi pemicu `[USULAN]` | transaksi batal karena email gagal |
| `INV-03` | core notifikasi | tidak ada transisi `gagal` → `menunggu` di versi awal (PT-07) | kirim ulang manual atau transisi itu terjadi |
| `INV-04` | core notifikasi | tautan notifikasi tidak membuka dokumen bagi pengguna yang tidak berhak | tautan membuka dokumen tanpa hak |

| Dari | Ke | Pemicu |
|---|---|---|
| `menunggu` | `terkirim` | penyedia menerima |
| `menunggu` | `gagal` | tiga percobaan otomatis habis (PT-07, `[USULAN-AGEN]`) |
| `gagal` | — | tidak ada transisi keluar di versi awal (PT-07) |

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Penyedia email mati | status tetap `menunggu`; transaksi tidak batal `[USULAN]` | percobaan otomatis sampai tiga kali (PT-07), lalu `gagal` |
| Alamat kosong | `gagal` dengan alasan | perbaiki data penerima |

## Architecture boundaries

- Notifikasi di `core/` (`D-04`). Modul tidak mengirim email langsung (`D-25`).
- `ARCH-02` berlaku: core tidak mengimpor modul.

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-02` | bukan penerima tidak melihat notifikasi | uji perilaku | `05-evidence.md` AC-02 | `Unverified` |
| `B-03` | email hanya berisi data yang boleh | pemeriksaan isi payload | `05-evidence.md` AC-09 | `Unverified` |
| `POST-03` | isi email tanpa angka keuangan | pemeriksaan isi payload | `05-evidence.md` AC-09 | `Unverified` |
| `INV-03` | tidak ada kirim ulang manual atau `gagal` → `menunggu` | pencarian kode | `05-evidence.md` AC-08 | `Unverified` |
| `INV-04` | tautan tanpa hak ditolak | uji perilaku | `05-evidence.md` AC-10 | `Unverified` |
| `PRE-02` | alamat kosong → `gagal` | uji perilaku | `05-evidence.md` AC-05 | `Unverified` |
| `POST-02` | status selalu salah satu dari tiga nilai | uji fixture | `05-evidence.md` AC-03, AC-04 | `Unverified` |
| `INV-01` | notifikasi tidak bocor | uji perilaku | `05-evidence.md` AC-02 | `Unverified` |
| `INV-02` | transaksi tidak batal karena email gagal | uji perilaku | `05-evidence.md` AC-06 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Daftar kejadian dan penerima (PT-01, PT-02) | `Proposed` `[USULAN-AGEN]`; empat kejadian makalah plus pemberitahuan approver | notifikasi salah sasaran |
| Kebijakan kirim ulang (PT-07) | `Proposed` `[USULAN-AGEN]` | antrean menumpuk atau email hilang |
| Data pribadi dan isi email (PT-05) | `Proposed` `[USULAN-AGEN]` | kebocoran data |
| Penyedia email (PT-03) | `Proposed` `[USULAN-AGEN]` (adaptor tunggal di core) | ganti vendor menyentuh modul |
| Batas `FND-007` (PT-06) | `Proposed` `[USULAN-AGEN]` (koordinasi) | dependensi UI tidak tercatat |
| Preferensi pengguna (PT-08) | `Terjawab — D-50` (ditunda) | — |
| Email slip karyawan (makalah penggajian) vs `D-18` slip dicetak | `Terjawab — D-18`, `D-53` | kanal email untuk karyawan tidak dibangun |
