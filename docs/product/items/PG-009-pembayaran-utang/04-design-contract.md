# Design Contract: PG-009 — Pembayaran utang

- Source: `docs/product/items/PG-009-pembayaran-utang/01-requirement.md` (`PG-009`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-19`)
- Status: `Proposed` — belum diverifikasi; seluruh aturan `Unverified`
- Profile: product app (aplikasi web internal)
- Scope: pembayaran pemasok, alokasi otomatis ke invoice, verifikasi Accounting, hasil transfer, saldo utang, jurnal pembayaran, bukti transfer, pembalikan
- Owner: tech lead (desain); keputusan produk dipegang pengguna (D-xx) atau koordinator (`[USULAN-AGEN]`)
- Kewajiban: item menyentuh uang, status dokumen, dan batas modul, sehingga kontrak wajib

## Intent and non-goals

**Intent.** Setiap rupiah yang keluar tercatat di satu pembayaran berhasil, teralokasi tepat ke utang tertua, dan punya jurnal yang balance. Saldo utang selalu dapat dibuktikan, dan pembayaran tidak pernah diverifikasi oleh pencatatnya sendiri.

**Non-goals.** Pengakuan utang (`PG-008`), rekonsiliasi mutasi bank (`PG-010`), laporan utang sebagai layar (C-009), pembayaran gaji, pembayaran pelanggan, struktur folder dan tabel.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server action | Nominal, tanggal, rekening, lampiran, hasil transfer, alasan | Parse dan validasi skema di server; lampiran diperiksa jenis dan ukurannya (R-05) | Nilai tervalidasi bertipe | Tolak dengan pesan terbaca |
| `B-02` | Sesi → identitas aktor | Cookie sesi | Ambil dari sesi | `actor_id` dan peran tepercaya | Tolak bila tidak ada sesi; abaikan `actor_id` dari klien |
| `B-03` | Server → core pengadaan dan ledger | Pembayaran, alokasi, dan jurnal | Core memeriksa sisa utang, verifikasi, periode, akun, dan keseimbangan | Transaksi tervalidasi | Core membatalkan seluruh transaksi |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Pembayaran dicatat | Nominal bilangan bulat lebih besar dari nol; nominal tidak melebihi total sisa utang pemasok (R-01, R-02, R-07) | Core pengadaan | Tolak; pesan menyebut nominal atau sisa |
| `PRE-02` | Alokasi dicatat | Alokasi per invoice tidak melebihi sisa invoice itu; invoice berstatus `TERCATAT` atau `DIBAYAR_SEBAGIAN` (R-01) | Core pengadaan | Tolak; pesan menyebut invoice dan sisanya |
| `PRE-03` | Alokasi dicatat | Invoice sudah diakui (`TERCATAT`); tidak `COCOK`, `SELISIH`, atau `DIBATALKAN` | Core pengadaan | Tolak; pesan menyebut status invoice |
| `PRE-04` | Hasil transfer diposting | Tanggal pembayaran tidak berada di periode terkunci; boleh mundur ke periode terbuka (FND-006; R-08) | Core ledger | Tolak; pesan menyebut periode |
| `PRE-05` | Hasil transfer dicatat | Pembayaran sudah diverifikasi Accounting; verifikator berbeda dari pencatat (R-03, D-48) | Core pengadaan | Tolak; pesan menyebut verifikasi atau pemisahan tugas |
| `PRE-06` | Hasil transfer berhasil | Akun 102 dan 201 aktif (D-41); rekening bank dipilih dan aktif (R-01) | Core ledger | Tolak; tidak ada baris tersimpan |
| `PRE-07` | Hasil transfer berhasil | Bukti transfer dilampirkan dengan format PDF, JPG, atau PNG (R-05) | Core pengadaan | Tolak; pesan menyebut bukti wajib |
| `PRE-08` | Pembayaran dicatat | Pemohon PR tidak membayar invoice yang berasal dari PR miliknya (D-42; telusur invoice → PO → PR) | Core pengadaan | Tolak; pesan menyebut telusuran |
| `PRE-09` | Pembalikan dicatat | Pembayaran berstatus berhasil; alasan terisi (R-09, D-48) | Core pengadaan | Tolak; pesan menyebut status atau alasan |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Hasil berhasil: pembayaran, alokasi, pengurangan utang, status invoice, dan jurnal dibuat dalam satu transaksi (R-04, R-06) | Dokumen invoice tidak berubah selain sisa dan status | Pembayaran, alokasi, jurnal, riwayat |
| `POST-02` | Pembayaran parsial menyisakan saldo utang sebesar selisihnya dan status `DIBAYAR_SEBAGIAN` | Sisa invoice | Sisa utang |
| `POST-03` | Lampiran bukti transfer tersimpan dan terhubung ke pembayaran (R-05) | Lampiran lama | Lampiran |
| `POST-04` | Status invoice `LUNAS` hanya bila sisanya nol; `DIBAYAR_SEBAGIAN` bila sisa masih ada (R-10) | Status lain | Status dan riwayat |
| `POST-05` | Hasil gagal: status `GAGAL_TRANSFER`, tidak ada jurnal, utang tidak berubah (R-04) | Utang dan jurnal | Penanda dan riwayat |
| `POST-06` | Pembalikan berhasil: jurnal pembalik dibuat dalam transaksi yang sama; alokasi dibalik; status pembayaran `DIBATALKAN`; status invoice dihitung ulang dari sisa (R-09) | Pembayaran tidak dihapus | Jurnal pembalik, riwayat |
| `POST-07` | Verifikasi tersimpan dengan `diverifikasi_oleh` dan `diverifikasi_pada` (R-03) | Dokumen pembayaran | Kolom verifikasi, riwayat |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core ledger | Setiap jurnal pembayaran: total debit = total kredit (`ARCH-001` INV-01) | Jurnal tidak balance tersimpan |
| `INV-02` | Core pengadaan | Jumlah alokasi per pembayaran = nominal pembayaran | Alokasi tidak sama dengan nominal |
| `INV-03` | Core pengadaan | Sisa utang per invoice = total invoice − total pembayaran teralokasi berhasil; tidak pernah negatif (D-49) | Utang negatif atau pembayaran melebihi utang |
| `INV-04` | Core ledger | Saldo akun 201 per pemasok = total utang diakui − total pembayaran teralokasi berhasil, sama dengan read model laporan (EPIC-PG gate 4) | Laporan dan jurnal berbeda |
| `INV-05` | Core pengadaan | Pembayaran gagal atau parsial selalu terlihat sebagai status (§8.1) | Transfer gagal tampak sebagai lunas |
| `INV-06` | Core ledger | Jurnal pembayaran hanya lewat `postJournal()` (D-07, `ARCH-001` ARCH-03) | Modul menulis jurnal langsung |
| `INV-07` | Core pengadaan | Pembayaran tidak dihapus; koreksi hanya lewat pembalikan (D-48) | Pembayaran berhasil dihapus |
| `INV-08` | Core pengadaan | Verifikator berbeda dari pencatat pembayaran (D-48, R-03) | Pembayaran diverifikasi pencatatnya sendiri |

Status (D-46, D-48):

| State | Objek | Arti | Transisi legal |
|---|---|---|---|
| `TERCATAT` | invoice | ada sisa utang | ke `DIBAYAR_SEBAGIAN` atau `LUNAS` (hasil berhasil) |
| `DIBAYAR_SEBAGIAN` | invoice | sebagian sudah dibayar | ke `LUNAS` (hasil berhasil); kembali dihitung ulang bila pembalikan (POST-06) |
| `LUNAS` | invoice | sisa nol | kembali dihitung ulang bila pembalikan (POST-06) |
| `GAGAL_TRANSFER` | pembayaran | transfer belum sempurna | ke pembayaran baru yang diulang, dengan alasan |
| `DIBATALKAN` | pembayaran | dibalik dengan jurnal pembalik | tidak ada |

Catatan: pembalikan menurunkan status invoice ke hasil perhitungan sisa. Ini berbeda dari larangan "status tidak mundur" di D-48 dan perlu diputuskan koordinator (lihat `03-readiness-review.md`).

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Pembayaran berhasil, jurnal gagal | Seluruh transaksi dibatalkan | Perbaiki akun atau periode, ulangi hasil transfer |
| Alokasi berhasil sebagian | Seluruh alokasi dibatalkan | Ulangi dengan alokasi benar |
| Transfer gagal di luar sistem | Ditandai `GAGAL_TRANSFER`; utang tidak berkurang | Finance mencatat ulang dengan alasan |
| Lampiran gagal disimpan | Hasil berhasil tidak tersimpan | Unggah ulang lampiran lalu catat hasil |
| Dua hasil transfer bersamaan untuk pembayaran sama | Satu ditolak (lock per pembayaran) | Pengguna memuat ulang |

## Architecture boundaries

- Pembayaran, alokasi, dan utang di `core/pengadaan` (D-05, ARCH-06).
- Jurnal hanya lewat `core/ledger` (ARCH-03, D-07).
- Laporan utang lintas siklus lewat service core atau read model, bukan membaca tabel modul lain (D-25, ARCH-08).
- Layar di modul Pengeluaran memanggil service core (D-04).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Input tidak valid ditolak | Uji perilaku | `05-evidence.md` AC-05, AC-10 | `Unverified` |
| `B-02` | `actor_id` dari klien diabaikan | Uji perilaku | — | `Unverified` |
| `B-03` | Kegagalan jurnal membatalkan pembayaran | Uji transaksi | `05-evidence.md` AC-06 | `Unverified` |
| `PRE-01` | Nominal tidak valid dan kelebihan bayar ditolak | Uji perilaku | `05-evidence.md` AC-04, AC-05 | `Unverified` |
| `PRE-02` | Alokasi melebihi sisa ditolak | Uji perilaku | `05-evidence.md` AC-04 | `Unverified` |
| `PRE-03` | Pembayaran invoice belum diakui ditolak | Uji perilaku | `05-evidence.md` AC-12 | `Unverified` |
| `PRE-04` | Periode terkunci menolak posting; mundur ke periode terbuka diterima | Uji service | `05-evidence.md` AC-11, AC-18 | `Unverified` |
| `PRE-05` | Hasil sebelum verifikasi dan verifikator sama ditolak | Uji perilaku | `05-evidence.md` AC-15, AC-16 | `Unverified` |
| `PRE-06` | Akun tidak aktif menolak posting | Uji service | `05-evidence.md` AC-06 | `Unverified` |
| `PRE-07` | Hasil berhasil tanpa bukti ditolak | Uji perilaku | `05-evidence.md` AC-10 | `Unverified` |
| `PRE-08` | Pembayaran untuk invoice dari PR milik pencatat ditolak | Uji perilaku | `05-evidence.md` AC-19 | `Unverified` |
| `PRE-09` | Pembalikan tanpa alasan atau tanpa status berhasil ditolak | Uji perilaku | `05-evidence.md` AC-17 | `Unverified` |
| `POST-01` | Pembayaran, alokasi, jurnal, dan status berubah bersama | Uji transaksi | `05-evidence.md` AC-01, AC-06 | `Unverified` |
| `POST-02` | Sisa sama dengan selisih | Uji perilaku | `05-evidence.md` AC-02 | `Unverified` |
| `POST-03` | Lampiran tersimpan | Uji perilaku | `05-evidence.md` AC-10 | `Unverified` |
| `POST-04` | Status lunas hanya bila sisa nol | Uji perilaku | `05-evidence.md` AC-01, AC-09 | `Unverified` |
| `POST-05` | Pembayaran gagal tidak mengurangi utang dan tidak membuat jurnal | Uji perilaku | `05-evidence.md` AC-08 | `Unverified` |
| `POST-06` | Pembalikan membuat jurnal pembalik dan menghitung ulang status | Uji transaksi | `05-evidence.md` AC-17 | `Unverified` |
| `POST-07` | Verifikasi tersimpan | Uji perilaku | `05-evidence.md` AC-15 | `Unverified` |
| `INV-01` | Jurnal tidak balance ditolak | Uji `postJournal()` | `05-evidence.md` AC-06 | `Unverified` |
| `INV-02` | Alokasi = nominal | Uji service | `05-evidence.md` AC-03 | `Unverified` |
| `INV-03` | Sisa tidak pernah negatif | Uji service | `05-evidence.md` AC-04 | `Unverified` |
| `INV-04` | Laporan = jurnal = perhitungan manual | Perbandingan tiga angka | `05-evidence.md` AC-07 | `Unverified` |
| `INV-05` | Transfer gagal tampak sebagai status | Uji perilaku | `05-evidence.md` AC-08 | `Unverified` |
| `INV-06` | Tidak ada penulisan jurnal di luar core | Pencarian kode + review | — | `Unverified` |
| `INV-07` | Pembayaran berhasil tidak bisa dihapus | Uji perilaku | `05-evidence.md` AC-17 | `Unverified` |
| `INV-08` | Verifikator sama dengan pencatat ditolak | Uji perilaku | `05-evidence.md` AC-16 | `Unverified` |

Tidak ada aturan yang berstatus `PASS`.

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Status final (Q-01) | Dijawab D-46 dan [USULAN-AGEN] (`GAGAL_TRANSFER`) | Tabel status dan `POST-05` |
| Kelebihan bayar (Q-02) | Dijawab D-49: ditolak | `PRE-01` dan `INV-03` |
| Urutan alokasi (Q-03) | Dijawab D-49: tertua dulu | Hasil `POST-02` untuk alokasi banyak |
| Akun kas dan rekening (Q-04) | Dijawab D-41 dan D-35; pemetaan rekening [USULAN-AGEN] | `PRE-06` dan `POST-01` |
| Gagal dan parsial (Q-05) | Dijawab [USULAN-AGEN]: `GAGAL_TRANSFER`; parsial `DIBAYAR_SEBAGIAN` | `POST-05` dan `INV-05` |
| Bukti transfer (Q-06) | Dijawab [USULAN-AGEN]: wajib saat berhasil; format PDF, JPG, PNG | `POST-03` dan `B-01` |
| Verifikasi Accounting (Q-07) | Dijawab D-47 (e) dan [USULAN-AGEN]: kolom, bukan status | `PRE-05`, `POST-07`, `INV-08` |
| Lingkup laporan (Q-08) | Dijawab [USULAN-AGEN]: laporan di C-009; PG-009 read model | `INV-04` dan batas item |
| Approval berjenjang (Q-09) | Dijawab D-51 (c): tidak berjenjang | Status dan alur |
| Pembulatan (Q-10) | Dijawab [USULAN-AGEN]: tidak ada pembulatan pada pembayaran | Nilai akhir pembayaran |
| Tanggal dan periode (Q-11) | Dijawab D-44 (5) dan [USULAN-AGEN]: mundur ke periode terbuka | `PRE-04` |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| Pengakuan utang | Milik `PG-008` |
| Rekonsiliasi bank | Milik `PG-010` |
| Saldo kredit pemasok | Ditolak oleh D-49 |
| Status pembayaran `PARSIAL` | Ditolak oleh D-47; memakai `DIBAYAR_SEBAGIAN` |
| Approval berjenjang pembayaran | Ditolak oleh D-51 (c) |
| Loop/termination | Tidak ada algoritma berulang |
| Batas modul | Milik `ARCH-001` |
