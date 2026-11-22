# C-012 — Diskusi

## Konteks

`C-012` adalah **notifikasi in-app dan email** (`backlog.md`, track `CORE-C master`, level 1 di backlog, gelombang 2 menurut `D-34`, `depends on` `FND-004`). Di analisis, ini `C12` dengan prioritas **P2** ("bagus kalau ada waktu", §5 dan §5.1). `D-50` dan `D-52` mengunci cakupannya: aplikasi murni web, notifikasi hanya in-app dan email, WhatsApp di luar cakupan.

Backlog tidak mencantumkan item lain yang `depends on` `C-012`. Artinya, item yang memakainya belum ditetapkan.

## Raw request

Tidak ada permintaan pengguna langsung. Item diturunkan dari `backlog.md` (baris `C-012`) dan `epics/EPIC-CORE.md`.

## Context

- Analisis §5.1: "sumber menyebut 'kemungkinan'" (`EPIC-CORE` risiko dan lampiran §15).
- Analisis §8.2 #12 `[USULAN]`: in-app paling murah, email cukup untuk operasional.
- Analisis §7.2: tabel `notifikasi` berisi antrean dan status kirim (tidak ada di sumber).

## Actor / consumer

- Penerima: pengguna staf yang berhak menerima notifikasi (peran per kejadian: PT-02, `[USULAN-AGEN]`).
- Pengirim: modul atau core yang memicu kejadian (lewat core, `D-25`).
- Operator: tidak disebut di sumber.

## Problem

Staf tidak tahu ada dokumen atau keputusan yang menunggu tindakan mereka, kecuali dengan membuka modul satu per satu. Analisis mengaitkannya dengan dashboard "menunggu tindakan saya" (C8, `C-014`).

## Desired outcome

Pengguna yang berhak menerima notifikasi melihatnya di aplikasi dan, bila dipilih, lewat email. Setiap pengiriman punya status yang bisa dilihat.

## Known constraints

| Sumber | Constraint |
|---|---|
| `D-18`, `D-53` | Penerima adalah staf dengan akun. Karyawan tidak menerima email slip; slip dicetak (`D-18`, `D-53`). |
| `D-25`, `ARCH-08` | Kejadian dari modul masuk lewat service core, bukan lewat tabel modul lain. Kanal email tidak dipanggil langsung dari modul. |
| `D-50` | Notifikasi hanya in-app dan email. Preferensi pengguna ditunda. |
| `D-52` | WhatsApp di luar cakupan; aplikasi murni web. |
| `D-01` | Tidak ada item menyusul atau v2. WhatsApp tidak boleh diam-diam menjadi item lain. |
| Backlog (aturan UI) | Item modul yang butuh primitive UI baru menunggu `FND-007`. Berlaku untuk `C-012` bila dianggap item modul (PT-06). |
| Data pribadi | Alamat email adalah data pribadi. Field dan pihak yang boleh melihatnya: PT-05. |

## Open questions

Status per 2026-11-22 (setelah D-47 sampai D-53): 10 pertanyaan — 4 terjawab dari keputusan terkunci (PT-04, PT-08, PT-09, PT-10), 6 terjawab `[USULAN-AGEN]` (PT-01, PT-02, PT-03, PT-05, PT-06, PT-07), 0 terbuka.

- PT-01 — Kejadian pemicu: kejadian apa saja yang menghasilkan notifikasi? Owner: pengguna. **Status: Terjawab — [USULAN-AGEN].** Usulan: empat kejadian dari makalah dan satu kejadian tambahan. (a) dokumen menunggu persetujuan: pemberitahuan ke approver berikutnya. (b) hasil persetujuan atau penolakan PR: ke Purchasing (makalah produksi). (c) payroll diverifikasi: ke Direksi; disetujui: ke Finance; dibayar: ke HR untuk penerbitan slip (makalah penggajian). Alasan: `D-37` dan `D-50` memberi approval sebagai pemicu utama; daftar lain tidak ada di sumber.
- PT-02 — Penerima: siapa yang menerima setiap jenis notifikasi? Owner: pengguna. **Status: Terjawab — [USULAN-AGEN].** Usulan: (a) approver berikutnya menurut matriks-izin (`D-33`); (b) peran tujuan dari makalah (Purchasing); (c) Direksi, Finance, HR sesuai langkah payroll. Pemohon tidak menerima notifikasi hasil persetujuan kecuali peran tujuannya sama. Alasan: makalah menyebut peran tujuan; tidak ada sumber untuk pemohon.
- PT-03 — Kanal email: penyedia email dan alamat pengirim. Owner: pengguna dengan tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: satu adaptor email di core, kredensial dan alamat pengirim dari konfigurasi lingkungan. Pilihan vendor SMTP tidak memblokir item karena ada di balik adaptor; dicatat saat implementasi. Alasan: `D-25` melarang kanal per modul, dan `D-50` mengunci email sebagai kanal.
- PT-04 — WhatsApp di luar cakupan? Owner: pengguna. **Status: Terjawab — D-52.** Aplikasi murni web; notifikasi hanya in-app dan email.
- PT-05 — Data pribadi: field email mana yang disimpan, dan siapa yang boleh melihat isi antrean kirim? Owner: pengguna. **Status: Terjawab — [USULAN-AGEN].** Usulan: field email hanya pada akun pengguna (`FND-003`). Isi antrean kirim hanya terlihat oleh pengelola sistem, bukan pengguna biasa. Isi email memuat judul kejadian, nomor dokumen, dan tautan ke dokumen, tanpa angka keuangan. Alasan: notifikasi tidak boleh membuka data yang tidak boleh dilihat penerima; `D-18` dan `D-53` membatasi akun.
- PT-06 — Batas `FND-007`: apakah notifikasi in-app butuh primitive UI baru? Owner: tech lead. **Status: Terjawab — [USULAN-AGEN].** Usulan: `C-012` tidak menambah primitive baru. Daftar notifikasi dan badge memakai tabel, badge status, dan dialog dari `FND-007`. Karena itu `FND-007` menjadi dependensi koordinasi (usulan, bukan `depends_on` backlog). Alasan: DoR butir 8 mengaitkan `FND-007` dengan item yang menambah primitive UI.
- PT-07 — Kebijakan kirim ulang: berapa kali dan dengan jeda apa email gagal dicoba ulang, dan status akhir apa? Owner: pengguna. **Status: Terjawab — [USULAN-AGEN].** Usulan: tiga percobaan otomatis dengan jeda 5, 15, dan 60 menit. Setelah itu status `gagal` dengan alasan yang bisa dibaca. Tidak ada kirim ulang manual di versi awal dan transisi `gagal` → `menunggu` ditiadakan, karena matriks-izin tidak punya peran administrator. Alasan: sumber tidak menyebut angkanya; ini nilai operasional, bukan tarif.
- PT-08 — Preferensi pengguna: apakah pengguna boleh mematikan jenis notifikasi? Owner: pengguna. **Status: Terjawab — D-50.** Preferensi pengguna ditunda.
- PT-09 — Konflik prioritas: analisis P2, backlog level 1. Owner: pengguna dengan tech lead. **Status: Terjawab — D-34 dan D-50.** Urutan gelombang 2 menurut `D-34`. Prioritas P2 menurut analisis (`D-50`).
- PT-10 — Konflik urutan dengan `D-20` (C9–C12 "menyusul setelah track berjalan"). Owner: pengguna dengan tech lead. **Status: Terjawab — D-34.** C-012 masuk gelombang 2; `D-20` superseded.

## Decisions

| ID | Keputusan | Tanggal | Owner | Konsekuensi |
|---|---|---|---|---|
| `D-04` | `src/core/` dan `src/modules/` | 2026-11-17 | pengguna | Notifikasi di core |
| `D-18` | 12 akun staf | 2026-11-17 | pengguna | Penerima terbatas pada staf |
| `D-20` | Tech lead membangun core v0; C9–C12 menyusul | 2026-11-17 | pengguna | Superseded oleh D-34 (PT-10 terjawab) |

Keputusan lintas item yang berlaku (ditambahkan 2026-11-22):

| ID | Keputusan | Konsekuensi untuk C-012 |
|---|---|---|
| `D-01` | Tidak ada item menyusul atau v2 | WhatsApp (PT-04) tidak boleh diam-diam menjadi item menyusul |
| `D-18`, `D-53` | Karyawan tidak menerima email slip; slip dicetak | email ke karyawan dari makalah penggajian tidak masuk C-012 |
| `D-34` | C-012 gelombang 2 (menyusul) | PT-09, PT-10 |
| `D-50` | Notifikasi in-app dan email; preferensi ditunda; P2 | PT-08, PT-09 |
| `D-52` | WhatsApp di luar cakupan | PT-04 |

## Assumptions (agent-proposed)

Ini daftar `[USULAN-AGEN]` yang dibuat di item ini. Semua menunggu kunci koordinator.

- PT-01, PT-02: daftar kejadian dan penerima (empat kejadian makalah plus pemberitahuan approver).
- PT-03: satu adaptor email di core; vendor dicatat saat implementasi.
- PT-05: field email di akun; isi email tanpa angka keuangan; antrean hanya untuk pengelola sistem.
- PT-06: `FND-007` menjadi dependensi koordinasi karena komponen dipakai.
- PT-07: tiga percobaan otomatis (5, 15, 60 menit); tidak ada kirim ulang manual.
- `[USULAN]` In-app dan email adalah dua kanal; WhatsApp di luar cakupan (analisis §8.2 #12).
- `[USULAN]` Status kirim email minimal `menunggu`, `terkirim`, `gagal` (analisis §5.1 "antrean kirim + status").
- `[USULAN]` Kegagalan kirim email tidak membatalkan transaksi yang memicunya.

## Rejected alternatives (optional)

- Notifikasi langsung dari setiap modul lewat email. Ditolak: membuat setiap modul punya kanal sendiri (`D-25`).
- Kirim ulang manual oleh pengguna biasa. Ditolak: tidak ada peran administrator di matriks-izin v0 (`D-33`).

## Next step

Tidak ada pertanyaan terbuka. Item ini menunggu dependensi `FND-004` berstatus `done`, lalu siap menjadi `Ready` (lihat `03`). Usulan koordinasi: `FND-007` sebagai dependensi (PT-06) dan keputusan kunci untuk enam `[USULAN-AGEN]`.
