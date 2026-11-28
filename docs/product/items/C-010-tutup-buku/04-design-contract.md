# Design Contract: C-010 — Tutup buku dan jurnal penutup

- Source: `docs/product/items/C-010-tutup-buku/01-requirement.md` (`C-010`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-13`)
- Status: `Verified` — aturan kontrak di tabel terverifikasi; caveat race dua sesi, laporan C-009 tahunan, dan loss/net-zero ada di `05-evidence.md`
- Profile: product app — status periode dan jurnal penutup
- Scope: penutupan periode, penguncian, jurnal penutup, penolakan posting ke periode terkunci, tutup tahun
- Owner: tech lead
- Keputusan yang dipakai: `D-32`, `D-35`, `D-41`, `D-43`, `D-44` (4) dan (5), `D-50`, `D-58`, `D-63`, `D-68`

## Intent and non-goals

**Intent.** Setelah periode ditutup, angkanya tidak berubah diam-diam, dan saldo sementara berpindah ke laba ditahan lewat jurnal yang tercatat.

**Non-goals.** Tabel periode dan COA (`FND-006`), penguncian payroll (`GJ-005`), penguncian dokumen sumber (PT-02, `[USULAN-AGEN]`), laporan (`C-009`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server | permintaan tutup periode dan tutup tahun | validasi periode/tahun dan peran | periode/tahun bertipe | tolak dengan pesan |
| `B-02` | Sesi → identitas aktor | cookie sesi | peran dari sesi dan tabel `profiles` | `actor_id` + peran | tolak bila peran tidak sesuai PT-01 |
| `B-03` | Server → `post_journal()` | status periode | baca status di transaksi yang sama | status terkini | tolak posting; tidak ada baris |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Periode bulanan ditutup | periode `buka`; bukan Desember; aktor Accounting (D-50, D-68) | server | tolak; status tidak berubah |
| `PRE-02` | Periode ditutup | neraca saldo balance dan tidak ada dokumen setengah posting (D-50, D-68) | server | tolak; pesan menyebut prasyarat yang gagal |
| `PRE-03` | Periode dibuka kembali | tidak dipakai: buka kembali tidak ada (D-44 (5)) | server | tolak; status tidak berubah |
| `PRE-04` | Jurnal penutup dibuat | akun peran laba ditahan (302) dan akun nominal (401, 501, 601, 602, 701) ada dan aktif di COA (D-35, D-41; 702 dicadangkan) | server | tolak seluruh penutupan |
| `PRE-05` | Periode ditutup | semua bulan < M yang ada berstatus `kunci`; bulan yang belum punya baris dibuat + dikunci; Januari menuntut `tahun_buku` tahun sebelumnya `ditutup` bila ada aktivitas (PT-04; D-58, D-68) | server | tolak; pesan menyebut bulan/tahun pemblokir paling awal |
| `PRE-06` | Tutup buku tahunan | Jan–Nov `kunci`; Desember `buka`/belum ada; tahun belum `ditutup`; prasyarat D-50; prosedur mengunci Desember (PT-12; D-58, D-68) | server | tolak; status tidak berubah |
| `PRE-07` | Tutup periode Desember | tidak dipakai: Desember hanya dikunci oleh tutup tahun (D-68) | server | tolak; arahkan ke tutup tahun |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | status periode `kunci` | periode lain | jejak di `periode_akuntansi_riwayat_status` (D-32, D-63, D-68) |
| `POST-02` | saldo akun pendapatan dan beban tahun buku nol: 401, 501, 601, 602, 701 (D-44 5) | dokumen sumber, payroll | jurnal penutup tercatat lewat `post_journal()` di RPC tutup tahun |
| `POST-05` | status tahun buku `ditutup`; 12/12 bulan `kunci` (PT-12; D-68) | periode bulanan | jejak di `tahun_buku_riwayat_status` |
| `POST-03` | total debit jurnal penutup = total kredit | — | — |
| `POST-04` | posting ke periode `kunci` ditolak tanpa baris tersimpan | — | — |
| `POST-06` | Desember `kunci` dan tahun `ditutup` dalam transaksi yang sama dengan jurnal penutup | — | `INV-06` tegak struktural |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | core ledger | jurnal ke periode `kunci` tidak pernah tersimpan; jurnal penutup diposting saat Desember `buka`, lalu Desember dikunci dalam transaksi yang sama (D-68) | jurnal masuk ke periode `kunci`; jurnal penutup ke Desember yang sudah `kunci` |
| `INV-02` | core ledger | penutupan atomik: semua jurnal penutup tersimpan, atau tidak satu pun | jurnal penutup sebagian |
| `INV-03` | core ledger | jurnal penutup hanya ditulis lewat `post_journal()`/`postJournal()`; RPC tutup tahun memanggil jalur yang sama | tulisan langsung ke `jurnal` |
| `INV-04` | core ledger | penutupan mengubah status periode/tahun dan jurnal penutup dalam satu transaksi | status `kunci`/`ditutup` tanpa jurnal penutup, atau sebaliknya |
| `INV-05` | core ledger | jurnal penutup nominal hanya pada tutup buku akhir tahun; koreksi periode tertutup lewat jurnal pembalik di periode berjalan (D-44 5) | jurnal penutup per bulan; jurnal baru di periode `kunci` |
| `INV-06` | core ledger | tahun buku `ditutup` tidak menerima jurnal baru; 12/12 bulan `kunci` membuat penolakan struktural (PT-12; D-68) | jurnal baru ke tahun yang sudah `ditutup` |
| `INV-07` | core ledger | Desember hanya dikunci oleh tutup tahun; tutup bulanan menolak Desember (D-68) | Desember `kunci` lewat jalur bulanan |
| `INV-08` | core ledger | bulan sebelumnya yang belum punya baris dibuat + dikunci; tidak ada bulan kosong yang bisa dibuka kembali (D-68) | bulan kosong dibiarkan terbuka lalu diisi setelah periode berikutnya `kunci` |
| `INV-09` | core ledger | setengah posting simetris: `diposting` harus sama dengan ada-tidaknya jurnal `sumber_id` dokumen di bulan itu (D-68) | dokumen `diposting = true` tanpa jurnal; jurnal dokumen tanpa `diposting` |

| State | Transisi legal | Transisi ilegal |
|---|---|---|
| `buka` | → `kunci` lewat tutup periode bulanan (kecuali Desember) atau tutup tahun | — |
| `kunci` | — tidak ada buka kembali (D-44 (5)) | semua transisi keluar |

Tahun buku (`[USULAN-AGEN]`, PT-12; D-68):

| State | Transisi legal | Transisi ilegal |
|---|---|---|
| `terbuka` | → `ditutup` lewat tutup buku tahunan, bila Jan–Nov `kunci` dan Desember `buka`/belum ada; prosedur mengunci Desember | jurnal baru setelah `ditutup` (`INV-06`) |
| `ditutup` | — | semua transisi keluar |

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Penutupan gagal di tengah | status tetap `buka`/`terbuka`; tidak ada jurnal penutup | ulangi setelah penyebab diperbaiki |
| Akun laba ditahan tidak ada | penutupan ditolak; pesan menyebut akun | tambahkan akun di COA (`FND-006`) |
| Posting ke periode `kunci` | ditolak; tidak ada baris | pindahkan tanggal ke periode terbuka; tidak ada buka kembali |
| Koreksi periode tertutup | jurnal pembalik di periode berjalan (D-44 5) | — |
| Desember sudah `kunci` saat tutup tahun | ditolak; jurnal penutup tidak bisa masuk | jangan tutup Desember lewat jalur bulanan; Desember hanya lewat tutup tahun |
| Bulan < M belum punya baris | dibuat + dikunci, bukan diabaikan (D-68) | — |
| Januari tanpa tutup tahun sebelumnya | ditolak; pesan menyebut tahun | selesaikan tutup tahun sebelumnya |
| Setengah posting dua arah | ditolak; pesan menyebut dokumen/arah | perbaiki dokumen atau jurnalnya |

## Architecture boundaries

- Penutupan dan jurnal penutup berada di `core/ledger` (`D-07`).
- Modul tidak boleh menutup periode atau menulis jurnal penutup (`ARCH-03`, `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`).
- Penegakan `PRE-02` di `post_journal()` (`ARCH-001`) dimiliki `FND-006`; RPC tutup tahun C-010 memanggil jalur itu dan tidak menulis `jurnal`/`detail_jurnal` langsung.
- Tabel `tahun_buku` dan riwayat periode/tahun dimiliki core ledger; modul tidak menulis status periode.

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | tutup periode `kunci`/Desember ditolak | uji perilaku | `05-evidence.md` AC-05, AC-11 | `Verified` |
| `PRE-02` | prasyarat gagal → ditolak | uji perilaku | `05-evidence.md` AC-12 | `Verified` |
| `PRE-03` | buka kembali ditolak | uji perilaku | `05-evidence.md` AC-07 | `Verified` |
| `PRE-05` | penutupan melompati periode ditolak; bulan kosong dibuat + dikunci | uji perilaku | `05-evidence.md` AC-11 | `Verified` |
| `PRE-06` | tutup tahunan dengan Jan–Nov terbuka ditolak; Desember terbuka diterima | uji perilaku | `05-evidence.md` AC-13 | `Verified` |
| `PRE-07` | tutup Desember lewat jalur bulanan ditolak | uji perilaku | `05-evidence.md` AC-11 | `Verified` |
| `POST-05` | status tahun buku `ditutup`; 12/12 bulan `kunci` | uji fixture | `05-evidence.md` AC-13 | `Verified` |
| `POST-06` | Desember dikunci dalam transaksi yang sama | uji fixture | `05-evidence.md` AC-13 | `Verified` |
| `INV-06` | posting ke tahun `ditutup` ditolak | uji perilaku | `05-evidence.md` AC-13 | `Verified` |
| `INV-07` | Desember lewat jalur bulanan ditolak | uji perilaku | `05-evidence.md` AC-11 | `Verified` |
| `INV-08` | bulan kosong dibuat + dikunci, tidak bisa dibuka kembali | uji fixture + hitung baris | `05-evidence.md` AC-11 | `Verified` |
| `INV-09` | setengah posting dua arah | uji fixture | `05-evidence.md` AC-12 | `Verified` |
| `PRE-04` | akun tidak ada → penutupan ditolak | uji perilaku | `05-evidence.md` AC-06 | `Verified` |
| `POST-01` | status `kunci` setelah tutup | uji fixture | `05-evidence.md` AC-01 | `Verified` |
| `POST-02` | saldo pendapatan dan beban nol | uji fixture | `05-evidence.md` AC-03 | `Verified` |
| `POST-03` | debit = kredit pada jurnal penutup | uji fixture | `05-evidence.md` AC-04 | `Verified` |
| `POST-04` | posting ke periode `kunci` tidak tersimpan | perintah hitung baris | `05-evidence.md` AC-02 | `Verified` |
| `INV-01` | tidak ada jurnal di periode `kunci`; penutup diposting saat Desember `buka` | uji fixture + hitung baris | `05-evidence.md` AC-02, AC-13 | `Verified` |
| `INV-02` | penutupan gagal → nol jurnal penutup | uji fixture | `05-evidence.md` AC-06 | `Verified` |
| `INV-03` | tidak ada tulisan langsung ke `jurnal` | pencarian kode + review | — | `Verified` |
| `INV-04` | status dan jurnal penutup konsisten | uji fixture | `05-evidence.md` AC-01, AC-03, AC-13 | `Verified` |
| `INV-05` | jurnal penutup hanya tahunan; koreksi lewat pembalik | uji fixture + hitung baris | `05-evidence.md` AC-03, AC-10 | `Verified` |

Catatan verifikasi: `INV-04`/`POST-06` dibuktikan secara sekuensial; race
close-vs-post dua sesi belum diuji otomatis. Laporan C-009 tahunan memuat
`TUTUP_BUKU` (pengecualian AC-08). Fixture tutup tahun rugi/net-zero belum
dijalankan terpisah. Detail di `05-evidence.md`.

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Scope kunci: jurnal saja atau juga dokumen (PT-02) | `Terjawab — D-58`; rincian D-68 | — |
| Buka kembali periode (PT-03) | `Terjawab — D-44 (5)` | — |
| Urutan penutupan periode (PT-04) | `Terjawab — D-58`; rincian D-68 | — |
| Jejak penutupan di `riwayat_status` (PT-05) | `Terjawab — D-32`, `D-63`; tabel khusus | — |
| Tutup periode bulanan vs tutup buku tahunan (PT-11) | `Terjawab — D-50`, `D-44 (5)` | — |
| Status tahun buku dan sisa 601/602 (PT-12) | `Terjawab — D-58`; rincian D-68 | — |
| Desember reserved, materialisasi bulan kosong, setengah posting (D-68) | `Terjawab — D-68` | — |
