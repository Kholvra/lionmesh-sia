# Design Contract: PG-008 — Three-way match dan utang usaha

- Source: `docs/product/items/PG-008-three-way-match-dan-utang-usaha/01-requirement.md` (`PG-008`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-21`)
- Status: `Proposed` — belum diverifikasi; seluruh aturan `Unverified`
- Profile: product app (aplikasi web internal)
- Scope: invoice pemasok, pencocokan tiga dokumen, exception, pengesahan, pengakuan utang, jurnal pengakuan, PPN masukan, pembatalan
- Owner: tech lead (desain); keputusan produk dipegang pengguna (D-xx) atau koordinator (`[USULAN-AGEN]`)
- Kewajiban: item menyentuh uang, status dokumen, dan batas modul, sehingga kontrak wajib

## Intent and non-goals

**Intent.** Utang hanya diakui untuk barang yang diterima, lulus QC, dan ditagih dengan jumlah yang sesuai, serta sudah disahkan Accounting. Setiap pengakuan punya jurnal yang balance, dan setiap selisih terlihat.

**Non-goals.** Pembayaran (`PG-009`), rekonsiliasi bank (`PG-010`), laporan keuangan (core), penerimaan dan QC (`PG-006`, `PG-007`), struktur folder dan tabel.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server action | Data invoice dari klien: nomor, tanggal, termin, referensi penerimaan, baris, harga, PPN, nomor faktur, alasan | Parse dan validasi skema di server | Nilai tervalidasi bertipe | Tolak dengan pesan terbaca |
| `B-02` | Sesi → identitas aktor | Cookie sesi | Ambil dari sesi | `actor_id` dan peran tepercaya | Tolak bila tidak ada sesi; abaikan `actor_id` dari klien |
| `B-03` | Server → core pengadaan dan ledger | Pengakuan utang dan jurnal | Core memeriksa match, periode, akun, dan keseimbangan | Transaksi tervalidasi | Core membatalkan seluruh transaksi |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Invoice dibuat | Termin terisi (D-14) | Core pengadaan | Tolak; pesan menyebut termin |
| `PRE-02` | Invoice dibuat | Pemasok aktif; nomor invoice unik untuk pemasok (R-07) | Core pengadaan | Tolak; pesan menyebut nomor dan pemasok |
| `PRE-03` | Invoice dibuat | Semua baris penerimaan referensi sudah QC final; qty invoice per baris tidak melebihi qty lulus (R-02); penerimaan belum punya invoice aktif (D-49) | Core pengadaan | Tolak; pesan menyebut baris atau invoice yang ada |
| `PRE-04` | Pencocokan dijalankan | PO dan penerimaan lulus QC ada dan terhubung; PPN hitung dari tarif berversi tanggal invoice tersedia (R-03, D-51 (a)) | Core pengadaan | Tolak bila data kurang; pesan menyebut dokumen yang kurang |
| `PRE-05` | Pengesahan diposting | Status `COCOK`; periode tanggal invoice tidak terkunci (FND-006); akun 201, 202, `ppn_masukan`, dan `selisih_harga_pembelian` aktif (R-05) | Core ledger | Tolak; tidak ada baris tersimpan; pesan menyebut periode atau akun |
| `PRE-06` | Pengesahan | Aktor pengesah berbeda dari pencatat invoice (R-11, D-48) | Core pengadaan | Tolak; pesan menyebut pemisahan tugas |
| `PRE-07` | Pembatalan | Alasan terisi; status `COCOK` atau `SELISIH`; atau `TERCATAT` tanpa pembayaran teralokasi (R-09) | Core pengadaan | Tolak; pesan menyebut alasan, status, atau pembayaran yang ada |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Pengesahan: utang diakui sebesar total invoice, status `TERCATAT`, dan jurnal pengakuan dibuat dalam satu transaksi (R-05) | Dokumen PO dan penerimaan tidak berubah | Utang, jurnal, riwayat |
| `POST-02` | Invoice `SELISIH`: tidak ada utang dan tidak ada jurnal (R-06) | Utang dan jurnal | Exception dan riwayat |
| `POST-03` | Invoice tidak mengubah `saldo_stok` (R-10) | Saldo stok | Tidak ada |
| `POST-04` | Setiap perubahan status invoice dan exception punya riwayat | Riwayat lama | Baris riwayat |
| `POST-05` | Pembatalan: status `DIBATALKAN`; bila `TERCATAT`, jurnal pembalik dibuat dalam transaksi yang sama (R-09) | Pembayaran (tidak ada) | Status, riwayat, dan jurnal pembalik bila ada |
| `POST-06` | Jatuh tempo tersimpan = tanggal invoice + termin (R-08, D-49) | Tanggal dan termin | Jatuh tempo |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core ledger | Setiap jurnal pengakuan: total debit = total kredit (`ARCH-001` INV-01) | Jurnal tidak balance tersimpan |
| `INV-02` | Core pengadaan | Qty invoice yang cocok per penerimaan tidak melebihi qty lulus QC | Utang untuk barang yang tidak lulus |
| `INV-03` | Core pengadaan | Tidak ada dua invoice dengan nomor sama untuk pemasok sama (R-07) | Utang dobel |
| `INV-04` | Core pengadaan | Qty selisih tidak pernah menjadi `COCOK` (D-15) | Pembayaran barang yang tidak diterima |
| `INV-05` | Core ledger | Utang diakui hanya bila invoice `COCOK` dan disahkan (EPIC-PG) | Utang diakui saat PO terbit atau saat invoice saja |
| `INV-06` | Core ledger | Jurnal pengakuan hanya lewat `postJournal()` (D-07, `ARCH-001` ARCH-03) | Modul menulis jurnal langsung |
| `INV-07` | Core pengadaan | Satu invoice aktif per penerimaan (D-49) | Dua invoice aktif untuk penerimaan sama |
| `INV-08` | Core pengadaan | Pengesah berbeda dari pencatat invoice (D-48, R-11) | Invoice disahkan oleh pencatatnya sendiri |

Status (D-46, D-48):

| State | Arti | Transisi legal |
|---|---|---|
| `COCOK` | tiga dokumen cocok; belum disahkan | ke `TERCATAT` (pengesahan); ke `SELISIH` bila dikoreksi dan dicocokkan ulang; ke `DIBATALKAN` (PRE-07) |
| `SELISIH` | ada selisih; exception terlihat | ke `COCOK` setelah dikoreksi dan dicocokkan ulang; ke `DIBATALKAN` (PRE-07) |
| `TERCATAT` | utang dicatat dan jurnal dibuat | ke `DIBAYAR_SEBAGIAN` atau `LUNAS` (`PG-009`); ke `DIBATALKAN` hanya tanpa pembayaran teralokasi (PRE-07) |
| `DIBATALKAN` | invoice dibatalkan dengan alasan | tidak ada |

Catatan: tidak ada status pra-cocok. Pencocokan dijalankan saat invoice disimpan (R-04).

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Utang berhasil, jurnal gagal | Seluruh transaksi dibatalkan | Perbaiki akun atau periode, ulangi pengesahan |
| Jurnal berhasil, utang gagal | Seluruh transaksi dibatalkan | Sama seperti di atas |
| Invoice ganda diajukan bersamaan | Satu ditolak | Pengguna melihat invoice yang ada |
| Dua pengesahan bersamaan untuk invoice sama | Satu ditolak; yang lain melihat status `TERCATAT` | Pengguna memuat ulang |
| Invoice dibatalkan setelah utang diakui | Jurnal pembalik sesuai R-09; tidak ada hapus diam-diam | Pengesahan ulang tidak diperlukan; invoice baru bila perlu |

## Architecture boundaries

- Invoice, utang, dan pencocokan hidup di `core/pengadaan` (D-05, ARCH-06).
- Jurnal hanya lewat `core/ledger` (ARCH-03, D-07).
- Nomor dokumen lewat `core/dokumen` (ARCH-05).
- Pajak masukan tidak hard-code; tarif dari konfigurasi berversi (D-17, D-51 (a)).
- Layar di modul Pengeluaran hanya memanggil service core (D-04, D-25).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Input tidak valid ditolak | Uji perilaku | `05-evidence.md` AC-04 | `Unverified` |
| `B-02` | `actor_id` dari klien diabaikan | Uji perilaku | — | `Unverified` |
| `B-03` | Kegagalan jurnal membatalkan utang | Uji transaksi | `05-evidence.md` AC-02 | `Unverified` |
| `PRE-01` | Termin kosong ditolak | Uji perilaku | `05-evidence.md` AC-04 | `Unverified` |
| `PRE-02` | Invoice ganda ditolak | Uji perilaku | `05-evidence.md` AC-08 | `Unverified` |
| `PRE-03` | Qty melebihi qty lulus ditolak; penerimaan belum QC final ditolak; invoice kedua ditolak | Uji perilaku | `05-evidence.md` AC-03, AC-20, AC-21 | `Unverified` |
| `PRE-04` | Dokumen kurang atau PPN tidak tersedia ditolak | Uji service | `05-evidence.md` AC-10 | `Unverified` |
| `PRE-05` | Periode terkunci atau akun tidak aktif menolak pengesahan | Uji service | `05-evidence.md` AC-11 | `Unverified` |
| `PRE-06` | Pengesahan oleh pencatat ditolak | Uji perilaku | `05-evidence.md` AC-16 | `Unverified` |
| `PRE-07` | Pembatalan tanpa alasan atau setelah pembayaran ditolak | Uji perilaku | `05-evidence.md` AC-18 | `Unverified` |
| `POST-01` | Utang dan jurnal berubah bersama | Uji transaksi | `05-evidence.md` AC-01, AC-02, AC-14 | `Unverified` |
| `POST-02` | Exception tidak mengubah utang atau jurnal | Uji perbandingan | `05-evidence.md` AC-05, AC-07 | `Unverified` |
| `POST-03` | Saldo stok tidak berubah | Uji perbandingan | `05-evidence.md` AC-09 | `Unverified` |
| `POST-04` | Riwayat tercatat untuk setiap transisi | Uji perilaku | `05-evidence.md` AC-12, AC-17 | `Unverified` |
| `POST-05` | Pembatalan tanpa efek jurnal sebelum `TERCATAT`; jurnal pembalik sesudahnya | Uji perbandingan | `05-evidence.md` AC-18 | `Unverified` |
| `POST-06` | Jatuh tempo sesuai tanggal dan termin | Uji perilaku | `05-evidence.md` AC-19 | `Unverified` |
| `INV-01` | Jurnal tidak balance ditolak | Uji `postJournal()` | `05-evidence.md` AC-02, AC-14 | `Unverified` |
| `INV-02` | Qty cocok tidak melebihi qty lulus | Uji service | `05-evidence.md` AC-03 | `Unverified` |
| `INV-03` | Nomor invoice ganda tidak tersimpan | Uji concurrency | `05-evidence.md` AC-08 | `Unverified` |
| `INV-04` | Selisih qty tidak pernah cocok | Uji perilaku | `05-evidence.md` AC-05 | `Unverified` |
| `INV-05` | Tidak ada utang tanpa pengesahan atas `COCOK` | Uji perilaku + review | `05-evidence.md` AC-01, AC-07 | `Unverified` |
| `INV-06` | Tidak ada penulisan jurnal di luar core | Pencarian kode + review | — | `Unverified` |
| `INV-07` | Dua invoice aktif untuk penerimaan sama ditolak | Uji concurrency | `05-evidence.md` AC-21 | `Unverified` |
| `INV-08` | Pengesahan oleh pencatat ditolak | Uji perilaku | `05-evidence.md` AC-16 | `Unverified` |

Tidak ada aturan yang berstatus `PASS`.

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Toleransi (Q-01) | Dijawab [USULAN-AGEN]: AND per baris; total dengan toleransi sama | `PRE-04` dan AC-06 |
| Kurang tagih dan pembanding gate 2 (Q-02) | Kurang tagih = `SELISIH` (D-15); pembanding qty lulus [USULAN-AGEN] | `PRE-03` dan `INV-02` |
| Pembanding harga (Q-03) | Dijawab [USULAN-AGEN]: harga PO dan qty lulus | AC-06 |
| Alur exception (Q-04) | Dijawab [USULAN-AGEN]: `SELISIH` tersimpan; koreksi atau pembatalan | `POST-02` dan status |
| Selisih harga (Q-05) | Dijawab [USULAN-AGEN]: peran `selisih_harga_pembelian`; nomor di FND-006 | `POST-01` dan jurnal |
| Akun utang (Q-06) | Dijawab D-44 (2), D-41; baris PPN dan selisih [USULAN-AGEN] | `PRE-05` dan `POST-01` |
| PPN masukan (Q-07) | Dijawab D-51 (a): tarif berversi, nilai diverifikasi saat implementasi; nomor faktur manual (D-24) | Nilai utang dan jurnal pajak |
| Mata uang (Q-08) | Dijawab D-38 (IDR) | Kolom dan validasi |
| Jatuh tempo (Q-09) | Dijawab D-49: tanggal invoice + termin | `POST-06` |
| Invoice ganda dan pembatalan (Q-10) | Dijawab [USULAN-AGEN]: kunci unik; pembatalan R-09 | `INV-03`, `PRE-07`, `POST-05` |
| Relasi penerimaan dan invoice (Q-11) | Dijawab D-49 (satu invoice); syarat QC final [USULAN-AGEN] | `PRE-03` |
| Cakupan tiga dokumen (Q-12) | Dijawab (PO, penerimaan, invoice; LAPORAN) | `PRE-04` |
| Pengesahan oleh Accounting (Q-13) | Dijawab D-33 dan diagram PG10; pemisahan `PRE-06` [USULAN-AGEN] | `PRE-06` dan `INV-08` |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| Pembayaran dan alokasi | Milik `PG-009` |
| Rekonsiliasi bank | Milik `PG-010` |
| Status pra-cocok | Ditolak oleh D-47 (tidak ada status di luar daftar) |
| Pembulatan PPN dengan jurnal selisih | PPN harus sama dengan hitung; bila tidak, `SELISIH` (R-03) |
| Loop/termination | Tidak ada algoritma berulang |
| Batas modul | Milik `ARCH-001` |
