# Design Contract: PG-006 — Penerimaan barang

- Source: `docs/product/items/PG-006-penerimaan-barang/01-requirement.md` (`PG-006`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-14`)
- Status: `Proposed` — belum diverifikasi; seluruh aturan `Unverified`
- Profile: product app (aplikasi web internal)
- Scope: pencatatan dokumen penerimaan terhadap PO, penerimaan bertahap, selisih, kelebihan, pembatalan sebelum QC; tidak mencakup QC, stok masuk, atau jurnal
- Owner: tech lead (desain); keputusan produk dipegang pengguna (D-xx) atau koordinator (`[USULAN-AGEN]`)
- Kewajiban: item ini menyentuh status dokumen dan batas modul, sehingga kontrak wajib (`docs/product/policies/definition-of-ready.md`)

## Intent and non-goals

**Intent.** Penerimaan adalah bukti fisik bahwa barang datang. Kontrak ini memastikan penerimaan tidak menambah stok atau utang, kelebihan kirim tidak masuk, dan selisih qty tidak pernah hilang diam-diam.

**Non-goals.** QC (`PG-007`), stok masuk (`PG-007`), jurnal (`PG-007`, `PG-008`), invoice (`PG-008`), pembuatan PO (`PG-005`), struktur folder dan tabel.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server action | Qty per baris, referensi PO, gudang tujuan, jenis penerimaan, alasan pembatalan dari klien | Parse dan validasi skema di server sebelum memanggil core | Nilai tervalidasi bertipe | Tolak dengan pesan terbaca; jangan teruskan ke core |
| `B-02` | Sesi → identitas aktor | Cookie sesi | Ambil pengguna dari sesi di server | `actor_id` dan peran tepercaya | Tolak bila tidak ada sesi; jangan terima `actor_id` dari klien (`ARCH-001` BOUNDARY-02) |
| `B-03` | Server → service core pengadaan | Permintaan simpan penerimaan, pembatalan, penutupan exception | Core memeriksa status PO, akumulasi qty, dan peran | Dokumen tervalidasi | Core menolak dan tidak menyimpan apa pun |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Penerimaan dibuat | PO referensi berstatus `DITERBITKAN` atau `DITERIMA_SEBAGIAN` (D-46; R-01) | Core pengadaan | Tolak; pesan menyebut status PO |
| `PRE-02` | Penerimaan dibuat | Setiap baris: qty lebih besar dari nol; baris merujuk baris PO yang valid | Core pengadaan | Tolak; pesan menyebut baris |
| `PRE-03` | Penerimaan dibuat | Gudang tujuan ada dan aktif (master di `C-011`); aktor berperan Gudang (D-33) | Core pengadaan | Tolak sebelum menyentuh data |
| `PRE-04` | Penerimaan dibuat | Akumulasi qty diterima per baris, termasuk penerimaan ini, tidak melebihi qty PO (D-49; R-03) | Core pengadaan | Tolak; catat exception kelebihan; pesan menyebut baris, qty PO, dan sisa |
| `PRE-05` | Pembatalan dicatat | Aktor adalah pencatat penerimaan (R-08); alasan terisi; belum ada hasil QC pada baris mana pun | Core pengadaan | Tolak; pesan menyebut alasan atau hasil QC yang sudah ada |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Dokumen penerimaan baru memiliki nomor unik dari core dokumen (R-07), status `DITERIMA`, dan satu baris riwayat | Dokumen PO tidak berubah selain status turunannya | Nomor terpakai; baris riwayat |
| `POST-02` | Tidak ada perubahan saldo stok dan tidak ada jurnal akibat penerimaan ini | `saldo_stok`, `mutasi_stok`, dan jurnal | Tidak ada (D-06, D-07, D-36, aturan EPIC-PG) |
| `POST-03` | Pada penerimaan `penuh`, selisih qty terhadap PO dicatat sebagai exception dan tidak mengubah qty PO | qty PO | Exception terbuka (R-02, R-10) |
| `POST-04` | Status PO turunan mengikuti sisa qty: `DITERIMA_SEBAGIAN` selama ada sisa dan penerimaan bertahap; `DITERIMA` setelah `penuh` tercatat atau semua baris penuh | Qty PO | Status PO dan riwayat (R-04) |
| `POST-05` | Pembatalan sebelum QC mengubah status menjadi `DIBATALKAN`, mengembalikan sisa qty PO, dan tidak menyentuh stok atau jurnal | Qty PO asal; saldo; jurnal | Status dan riwayat (D-48) |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core pengadaan | Qty diterima per baris tidak nol dan tidak negatif | Baris tersimpan dengan qty nol atau negatif |
| `INV-02` | Core dokumen | Nomor penerimaan unik per jenis per periode (`ARCH-001` INV-04) | Dua dokumen memakai nomor sama |
| `INV-03` | Core dokumen | Setiap perubahan status punya baris riwayat dengan aktor dan waktu (D-08, `ARCH-001` INV-05) | Status berubah tanpa jejak |
| `INV-04` | Core pengadaan | Penerimaan yang sudah tercatat tidak diubah isinya (R-09) | Edit isi diam-diam |
| `INV-05` | Core pengadaan | Akumulasi qty diterima per baris tidak melebihi qty PO (D-49) | Penerimaan tersimpan yang membuat total melebihi qty PO |

Status (D-46, D-48):

| State | Objek | Arti | Transisi legal |
|---|---|---|---|
| `DITERBITKAN` | PO | PO sudah terbit | ke `DITERIMA_SEBAGIAN` atau `DITERIMA` (turunan penerimaan) |
| `DITERIMA_SEBAGIAN` | PO turunan | sebagian qty sudah dicatat; sisa belum datang | ke `DITERIMA` saat sisa datang atau `penuh` tercatat |
| `DITERIMA` | PO turunan dan dokumen penerimaan | barang dicatat, belum diperiksa QC | ke `QC_LULUS` atau `QC_GAGAL` per baris (PG-007); ke `DIBATALKAN` hanya bila belum ada hasil QC (R-08) |
| `DIBATALKAN` | dokumen penerimaan | dibatalkan sebelum QC; sisa kembali | — |

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Dua pencatatan bersamaan untuk PO sama | Salah satu ditolak dengan pesan "dokumen sudah diproses" | Pengguna memuat ulang dan melihat dokumen yang sudah ada (optimistic lock pada PO, usulan `analisis-sia.md` §10.5) |
| Penyimpanan gagal di tengah | Tidak ada dokumen setengah jadi; semua baris, riwayat, dan status PO turunan disimpan dalam satu transaksi | Pengguna mengulang simpan |
| Input tidak valid | Tidak ada dokumen tersimpan | Pengguna memperbaiki input lalu simpan ulang |
| Pembatalan bersamaan dengan QC pada baris sama | Salah satu ditolak; pesan menyebut hasil yang sudah ada | Pengguna memuat ulang |

## Architecture boundaries

- Tabel dan aturan penerimaan berada di `core/pengadaan` (D-05, `ARCH-001` ARCH-06).
- Layar penerimaan berada di modul Pengeluaran dan hanya memanggil service core (D-04, D-25).
- Nomor dan riwayat dibuat lewat `core/dokumen` (`ARCH-001` ARCH-05).
- Item ini tidak menulis ke `saldo_stok`, `mutasi_stok`, atau tabel jurnal (`ARCH-001` ARCH-03, ARCH-04).
- Dependensi konseptual ke `FND-005` dilepas (D-36). Tidak ada pemanggilan service inventory di item ini.

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Input baris kosong atau nol ditolak dengan pesan | Uji perilaku | `05-evidence.md` AC-04 | `Unverified` |
| `B-02` | `actor_id` dari klien diabaikan | Uji perilaku | — | `Unverified` |
| `B-03` | Core menolak penerimaan PO tidak sah | Uji service | `05-evidence.md` AC-03 | `Unverified` |
| `PRE-01` | PO berstatus tidak sah ditolak | Uji perilaku | `05-evidence.md` AC-03 | `Unverified` |
| `PRE-02` | Qty nol atau negatif ditolak | Uji perilaku | `05-evidence.md` AC-04 | `Unverified` |
| `PRE-03` | Gudang tidak aktif ditolak | Uji perilaku | `05-evidence.md` AC-13 | `Unverified` |
| `PRE-04` | Akumulasi melebihi qty PO ditolak dan tercatat sebagai exception | Uji perilaku | `05-evidence.md` AC-11 | `Unverified` |
| `PRE-05` | Pembatalan tanpa alasan atau setelah QC ditolak | Uji perilaku | `05-evidence.md` AC-12 | `Unverified` |
| `POST-01` | Nomor unik dan riwayat pertama ada | Uji perilaku + pemeriksaan data | `05-evidence.md` AC-01 | `Unverified` |
| `POST-02` | Saldo stok, mutasi, dan jumlah jurnal tidak berubah | Uji perbandingan sebelum dan sesudah | `05-evidence.md` AC-02 | `Unverified` |
| `POST-03` | Selisih tercatat dan qty PO tidak berubah | Uji perilaku | `05-evidence.md` AC-05, AC-14 | `Unverified` |
| `POST-04` | Status PO turunan sesuai sisa | Uji perilaku | `05-evidence.md` AC-10 | `Unverified` |
| `POST-05` | Pembatalan mengembalikan sisa tanpa efek stok atau jurnal | Uji perbandingan | `05-evidence.md` AC-12 | `Unverified` |
| `INV-01` | Baris qty nol tidak bisa tersimpan | Uji service | `05-evidence.md` AC-04 | `Unverified` |
| `INV-02` | Dua nomor sama tidak terjadi | Uji concurrency | `05-evidence.md` AC-06 | `Unverified` |
| `INV-03` | Setiap transisi punya riwayat | Uji perilaku | `05-evidence.md` AC-08 | `Unverified` |
| `INV-04` | Tidak ada jalur edit isi | Review + uji perilaku | `05-evidence.md` AC-07 | `Unverified` |
| `INV-05` | Total diterima tidak melebihi qty PO pada penerimaan tersimpan | Uji service + uji concurrency | `05-evidence.md` AC-11 | `Unverified` |

Tidak ada aturan yang berstatus `PASS`.

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Penerimaan bertahap (Q-01) | Dijawab [USULAN-AGEN]: boleh; jenis `sebagian` atau `penuh` | `PRE-04`, `POST-04` |
| Alur selisih (Q-02) | Dijawab [USULAN-AGEN]: exception di baris; Purchasing menutup; qty PO tidak berubah | `POST-03` dan AC-14 |
| Daftar status (Q-03) | Dijawab D-46 dan D-48; status PO turunan [USULAN-AGEN] | Seluruh tabel status |
| Kelebihan kirim (Q-04) | Dijawab D-49: ditolak sebagai exception | `PRE-04`, `INV-05` |
| Gudang per penerimaan (Q-07) | Dijawab [USULAN-AGEN] dan D-52 | `PRE-03` |
| Pembatalan (Q-08) | Dijawab [USULAN-AGEN] di atas D-48 | `POST-05`, `PRE-05` |
| Hak akses Gudang (Q-10) | Dijawab D-33 | `PRE-03` |
| Format nomor (Q-09) | Dijawab D-50 | `POST-01` |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| Jurnal penerimaan | Tidak ada menurut EPIC-PG, D-44 (1), dan `analisis-sia.md` §6.7; ada di PG-007 |
| Mutasi stok masuk | Hanya setelah QC lulus (EPIC-PG, D-36); ada di PG-007 |
| Harga satuan pada penerimaan | Nilai masuk memakai harga PO (D-44 (1)) |
| Loop/termination | Tidak ada algoritma berulang |
| Batas modul | Milik `ARCH-001` |
