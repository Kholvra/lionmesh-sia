# Design Contract: C-009 — Laporan keuangan

- Source: `docs/product/items/C-009-laporan-keuangan/01-requirement.md` (`C-009`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-11`)
- Status: `Verified` — 2026-11-24; perilaku dibuktikan pada `05-evidence.md`. Keputusan PT-02, PT-03, dan PT-08 tetap `[USULAN-AGEN]` sampai koordinator mengunci
- Profile: product app — laporan baca-saja di atas jurnal
- Scope: penyusunan buku besar, neraca saldo, laba rugi, neraca, daftar jurnal, arus kas, dan kartu persediaan
- Owner: tech lead
- Keputusan yang dipakai: `D-35`, `D-41`, `D-43`, `D-44` (4) dan (5), `D-50`, `D-52`

## Intent and non-goals

**Intent.** Angka laporan keuangan hanya berasal dari jurnal yang sudah diposting lewat `postJournal()`, dan dapat ditelusuri kembali ke baris jurnal.

**Non-goals.** Penulisan jurnal, tutup buku (`C-010`), COA dan periode (`FND-006`), laporan per siklus, format ekspor.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server | parameter periode, pilihan laporan | validasi periode terdaftar di `periode_akuntansi` | periode bertipe | tolak dengan pesan; jangan jalankan query |
| `B-02` | Sesi → identitas aktor | cookie sesi | ambil pengguna dari sesi di server; peran dari tabel `pengguna` | `actor_id` + peran | tolak bila tidak ada sesi atau peran tidak berhak |
| `B-03` | Database → laporan | baris `jurnal` dan `detail_jurnal` | baca saja; RLS berlaku | baris yang lolos kebijakan | tolak akses baris di luar kebijakan |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Laporan dibuka | aktor terautentikasi dan berperan sesuai (hak: PT-02, `[USULAN-AGEN]`) | server | tolak sebelum query |
| `PRE-02` | Periode dipilih | periode ada di `periode_akuntansi` (`FND-006`) | server | tolak; tidak ada angka |
| `PRE-03` | Periode dipilih | tepat satu bulan kalender (`D-50`) | server | tolak; pesan meminta satu bulan |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | laporan dibaca tanpa tulisan apa pun | jumlah baris jurnal, saldo, status periode | tidak ada |
| `POST-02` | saldo buku besar = saldo awal + total debit − total kredit per akun | jurnal sumber | tidak ada |
| `POST-03` | neraca saldo menampilkan total debit dan total kredit; bila berbeda, selisih tampil | — | tidak ada |
| `POST-04` | neraca periode bulanan memuat baris "laba tahun berjalan" di ekuitas (`[USULAN-AGEN]`, PT-03) | — | tidak ada |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | core ledger | laporan tidak menulis ke `jurnal`, `detail_jurnal`, atau `periode_akuntansi` | laporan mengubah baris apa pun |
| `INV-02` | core ledger | setiap angka laporan dapat dijumlahkan dari baris jurnal yang melandasinya | angka tanpa sumber baris |
| `INV-03` | core ledger | input yang sama menghasilkan angka yang sama | angka berubah tanpa perubahan data |
| `INV-04` | core ledger | laporan memanggil akun lewat peran akun (`D-35`); nomor akun dari konfigurasi `FND-006` (`D-41`) | nomor akun tertulis di kode laporan |
| `INV-05` | core ledger | dokumen batal tanpa jurnal tidak muncul; jurnal pembalik ikut terbaca (`[USULAN-AGEN]`, PT-08) | dokumen batal dihitung sebagai angka laporan |

Laporan tidak punya state machine. Status periode dibaca dari `FND-006`.

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Neraca saldo tidak seimbang | tampilkan selisih; jangan sembunyikan | perbaiki jurnal sumber lewat jalur posting yang benar |
| Query gagal di tengah | tidak menampilkan angka parsial | ulangi pembukaan laporan |
| Periode tidak ada | tolak sebelum query | pilih periode yang ada |

## Architecture boundaries

- Penyusunan laporan berada di `core/ledger` (`D-07`, `D-25`). Modul tidak menyusun laporan keuangan sendiri.
- `ARCH-08` dari `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md` berlaku: laporan lintas siklus lewat core.
- `ARCH-03`: tidak ada tulisan ke tabel jurnal dari laporan.
- Akun laporan dipanggil lewat peran akun (`D-35`). Nomor akun berasal dari konfigurasi `FND-006` (`D-41`), bukan dari kode modul.

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | aktor tanpa hak ditolak | uji perilaku (PT-02 `[USULAN-AGEN]`) | `05-evidence.md` AC-08 | `PASS` |
| `PRE-02` | periode tidak ada ditolak | uji perilaku | `05-evidence.md` AC-01 | `PASS*` |
| `PRE-03` | rentang lebih dari satu bulan ditolak | uji perilaku | `05-evidence.md` AC-10 | `PASS` |
| `POST-01` | jumlah baris sebelum = sesudah | perintah hitung baris | `05-evidence.md` AC-05 | `PASS` |
| `POST-02` | saldo buku besar = saldo awal + mutasi | uji fixture | `05-evidence.md` AC-01 | `PASS` |
| `POST-03` | total debit = total kredit atau selisih tampil | uji fixture | `05-evidence.md` AC-02 | `PASS` |
| `INV-01` | tidak ada tulisan dari laporan | pencarian kode + uji | `05-evidence.md` AC-05 | `PASS` |
| `POST-04` | laba tahun berjalan di ekuitas, neraca seimbang | uji fixture | `05-evidence.md` AC-04 | `PASS` |
| `INV-04` | akun lewat peran, tidak lewat nomor | pencarian kode | `05-evidence.md` AC-03, AC-09 | `PASS` |
| `INV-05` | dokumen batal tidak mengubah angka tanpa jurnal | uji fixture | `05-evidence.md` AC-11 | `PASS*` |
| `INV-02` | angka tertelusur ke baris jurnal | uji fixture | `05-evidence.md` AC-01 | `PASS` |
| `INV-03` | dua kali buka = angka identik | perintah bandingkan | `05-evidence.md` AC-06 | `PASS` |

`PASS*` berarti perilaku terbukti dengan satu batas yang dicatat:

- `PRE-02`: bulan yang belum punya baris `periode_akuntansi` tetap menampilkan
  nol, bukan ditolak. Requirement bagian validasi menetapkan edge case ini lebih
  dulu daripada precondition kontrak; validasi server menolak format, bulan di
  luar 1–12, dan rentang lebih dari satu bulan.
- `INV-05`: jurnal pembalik terbukti; dokumen batal tanpa jurnal tidak dapat
  diuji karena modul dokumen belum ada. Laporan hanya membaca `detail_jurnal`,
  sehingga dokumen tanpa jurnal tidak mungkin muncul.

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Periode bulanan (PT-01, `D-50`) | `Terjawab — D-50` | — |
| Matriks hak laporan (PT-02) | `Proposed` `[USULAN-AGEN]` | kebocoran angka keuangan ke peran yang tidak berhak |
| Definisi neraca sebelum tutup (PT-03) | `Proposed` `[USULAN-AGEN]` | neraca tidak seimbang secara benar |
| Dokumen batal di laporan (PT-08) | `Proposed` `[USULAN-AGEN]` | jurnal batal salah tampil atau hilang dari laporan |
| Lokasi penyusunan di `core/ledger` | `Proposed` | melanggar `ARCH-08` bila dipindah ke modul |
