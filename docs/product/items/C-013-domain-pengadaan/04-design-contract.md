# Design Contract: C-013 — Domain pengadaan

- Source: `docs/product/items/C-013-domain-pengadaan/01-requirement.md` (`C-013`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-10`)
- Status: `Proposed` — belum diverifikasi; semua aturan `Unverified`
- Profile: product app — dokumen pembelian, stok, dan batas modul
- Scope: PR, PO, penerimaan; status dokumen; pemanggilan stok dan approval
- Owner: tech lead
- Keputusan yang dipakai: `D-05`, `D-06`, `D-08`, `D-31`, `D-33`, `D-35`, `D-36`, `D-37`, `D-41`, `D-42`, `D-44` (1), `D-46`, `D-47`, `D-48`, `D-49`, `D-50`

## Intent and non-goals

**Intent.** Satu domain pembelian untuk dua siklus. Aturan status dan stok ditegakkan di satu tempat, dan Produksi tidak bisa membuat jalur pembelian sendiri.

**Non-goals.** Layar dan alur approval (Pengeluaran), layar dan alur retur QC (`PG-007`; tabel dan status QC ada di item ini, `D-31`), utang dan pembayaran (`PG-008`, `PG-009`; tabel dibuat di sana, `D-31`), three-way match, approval nominal (`FND-004`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server action Pengeluaran | data PR, PO, penerimaan | validasi skema di server | nilai tervalidasi bertipe | tolak dengan pesan; tidak diteruskan ke core |
| `B-02` | Sesi → identitas aktor | cookie sesi | `actor_id` dari sesi; tidak dari klien | `actor_id` + peran | tolak bila peran tidak berhak (PT-08) |
| `B-03` | Modul Produksi → core pengadaan | parameter `ajukanPR()` | validasi di service core | input tervalidasi | tolak; tidak ada baris |
| `B-04` | Core pengadaan → core inventory | qty dan produk saat penerimaan | pemanggilan service | mutasi tervalidasi | tolak penerimaan bila mutasi gagal |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | PR diajukan | pemohon berperan Gudang atau Produksi (matriks-izin, D-33); jenis dokumen terdaftar | core pengadaan | tolak |
| `PRE-02` | PO dibuat | PR berstatus `DISETUJUI`; pembuat berperan Purchasing (D-33) | core pengadaan | tolak; pesan menyebut status PR |
| `PRE-03` | Penerimaan dicatat | PO berstatus aktif; periode sumber tidak terkunci (`C-010`) | core pengadaan | tolak |
| `PRE-04` | Dokumen dibatalkan | status masih dalam batas PT-13 (`[USULAN-AGEN]`): PR sebelum PO terbit, PO sebelum penerimaan; alasan wajib (`D-48`) | core pengadaan | tolak |
| `PRE-05` | PR disetujui | aktor bukan pemohon PR (`D-42`, `D-48`) | core pengadaan | tolak; pesan menyatakan pemohon tidak boleh menyetujui |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | PR tersimpan dengan nomor unik (`FND-004`) dan riwayat pertama | dokumen lain | baris PR, riwayat |
| `POST-02` | PO hanya ada untuk PR `DISETUJUI` | status PR | baris PO, riwayat |
| `POST-03` | penerimaan tersimpan; selisih qty tercatat sebagai exception | qty PO | baris penerimaan, exception, riwayat |
| `POST-04` | stok masuk dicatat lewat service inventory dalam transaksi yang sama, saat QC lulus (D-36) | `saldo_stok` | mutasi, saldo |
| `POST-05` | QC lulus menghasilkan jurnal Dr `persediaan_bahan` / Cr `gr_ir` senilai qty lolos × harga PO (`D-44` (1), `D-35`) | jurnal sumber | baris jurnal lewat `postJournal()` |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | core pengadaan | PO tidak pernah dibuat dari PR yang tidak `DISETUJUI` | PO dari PR ditolak |
| `INV-02` | core pengadaan | setiap perubahan status menambah tepat satu baris `riwayat_status` (`D-08`) | status berubah tanpa jejak |
| `INV-03` | core pengadaan | dokumen tidak dihapus; dibatalkan lewat status | `DELETE` pada dokumen |
| `INV-04` | core pengadaan | selisih qty tidak pernah lolos toleransi (`D-15`) | selisih qty dianggap cocok |
| `INV-05` | core pengadaan | tulisan ke tabel pengadaan hanya dari `core/pengadaan` (`ARCH-06`) | modul menulis tabel PR, PO, atau penerimaan |
| `INV-06` | core pengadaan | total qty penerimaan untuk satu PO tidak melebihi qty PO (`D-49`) | penerimaan melewati qty PO |
| `INV-07` | core pengadaan | pembatalan dan approval tidak menghapus dokumen; dokumen `DIBATALKAN` tetap ada (`D-48`, `D-50`) | `DELETE` pada dokumen |

State transition (dari D-46 dan D-47; nama terjawab, PT-03; satu rantai status di diagram §5.2):

| Dokumen | Dari | Ke | Legal |
|---|---|---|---|
| PR | `DIAJUKAN` | `MENUNGGU_PERSETUJUAN` | ya (diperiksa Purchasing) |
| PR | `MENUNGGU_PERSETUJUAN` | `DISETUJUI` | ya (disetujui Manajemen, bukan pemohon, `PRE-05`) |
| PR | `MENUNGGU_PERSETUJUAN` | `DITOLAK` | ya; alasan wajib (`D-48`) |
| PR | `DITOLAK` | `DISETUJUI` atau PO | tidak (`D-46`, `INV-01`, AC-11) |
| PR | `DIAJUKAN` | `REVISI` | ya (dikembalikan) |
| PR | `REVISI` | `DIAJUKAN` | ya (diajukan ulang; approval gugur, `D-48`) |
| PR | `DISETUJUI` | `PEMASOK_DITETAPKAN` | ya (pilih pemasok) |
| PO | `PEMASOK_DITETAPKAN` (PR) → `DITERBITKAN` | PO terbit | ya |
| PO | `DITERBITKAN` | `DITERIMA_SEBAGIAN` → `DITERIMA` | ya; total ≤ qty PO (`INV-06`, AC-12) |
| Penerimaan QC | `DITERIMA` | `QC_LULUS` atau `QC_GAGAL` | ya; `QC_LULUS` memicu stok masuk dan jurnal (D-36, `POST-05`) |
| PR | `DIAJUKAN`, `MENUNGGU_PERSETUJUAN`, `REVISI`, `DISETUJUI`, `PEMASOK_DITETAPKAN` | `DIBATALKAN` | ya, pemohon, alasan wajib, sebelum PO terbit (PT-13, `[USULAN-AGEN]`) |
| PO | `DITERBITKAN` | `DIBATALKAN` | ya, sebelum penerimaan pertama (PT-13) |
| PO | sudah ada penerimaan | `DIBATALKAN` | tidak (AC-15) |

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Mutasi stok gagal saat penerimaan | penerimaan dibatalkan seluruhnya | perbaiki sebab, catat ulang |
| Status PO tidak bisa diperbarui karena dokumen sudah diubah pengguna lain | tolak dengan pesan "dokumen sudah diproses" (optimistic lock, analisis §10.5 `[USULAN]`) | muat ulang dokumen |
| Penerimaan dicatat ke periode terkunci | tolak (`PRE-03`) | pindahkan tanggal ke periode terbuka |

## Architecture boundaries

- Tabel dan aturan pengadaan berada di `core/pengadaan` (`D-05`, `ARCH-06`).
- Produksi memanggil `pengadaan.ajukanPR()` dan tidak menulis tabel pengadaan (`ARCH-08`, `D-25`).
- Penerimaan memanggil `core/inventory` untuk mutasi (`ARCH-04`, `D-06`).
- Penomoran dan riwayat lewat `core/dokumen` (`ARCH-05`, `D-08`, `FND-004`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-02` | `actor_id` dari klien diabaikan | uji perilaku | `05-evidence.md` AC-02 | `Unverified` |
| `B-03` | Produksi tidak menulis tabel PR langsung | pencarian kode | `05-evidence.md` AC-09 | `Unverified` |
| `B-04` | mutasi gagal → penerimaan tidak tersimpan | uji fixture | `05-evidence.md` AC-06 | `Unverified` |
| `PRE-01` | peran tidak berhak tidak bisa mengajukan | uji perilaku (hak: `D-33`, `D-42`) | `05-evidence.md` AC-01 | `Unverified` |
| `PRE-05` | pemohon tidak bisa menyetujui PR miliknya | uji perilaku | `05-evidence.md` AC-14 | `Unverified` |
| `PRE-02` | PO dari PR ditolak tidak tersimpan | uji perilaku | `05-evidence.md` AC-02, AC-03 | `Unverified` |
| `PRE-03` | penerimaan ke periode terkunci ditolak | uji perilaku | `05-evidence.md` AC-10 | `Unverified` |
| `PRE-04` | pembatalan di luar batas PT-13 ditolak | uji perilaku | `05-evidence.md` AC-08, AC-15 | `Unverified` |
| `POST-01` | PR punya nomor unik dan riwayat | uji fixture | `05-evidence.md` AC-01, AC-07 | `Unverified` |
| `POST-02` | PO hanya dari PR `DISETUJUI` | uji fixture | `05-evidence.md` AC-03 | `Unverified` |
| `POST-03` | selisih qty tercatat sebagai exception | uji fixture | `05-evidence.md` AC-04 | `Unverified` |
| `POST-04` | stok masuk sesuai PT-02 (setelah QC lulus) | uji fixture | `05-evidence.md` AC-06 | `Unverified` |
| `POST-05` | jurnal QC lulus dengan peran `persediaan_bahan` dan `gr_ir` | uji fixture | `05-evidence.md` AC-13 | `Unverified` |
| `INV-01` | PO dari PR ditolak tidak ada | uji fixture | `05-evidence.md` AC-02 | `Unverified` |
| `INV-02` | tepat satu riwayat per transisi | perintah hitung baris | `05-evidence.md` AC-07 | `Unverified` |
| `INV-03` | tidak ada `DELETE` pada dokumen | pencarian kode | `05-evidence.md` AC-08 | `Unverified` |
| `INV-04` | selisih qty tidak lolos toleransi | uji fixture | `05-evidence.md` AC-04 | `Unverified` |
| `INV-05` | tulisan hanya dari core | pencarian kode | `05-evidence.md` AC-09 | `Unverified` |
| `INV-06` | penerimaan melebihi qty PO ditolak | uji fixture | `05-evidence.md` AC-05, AC-12 | `Unverified` |
| `INV-07` | dokumen batal tetap ada, tanpa `DELETE` | pencarian kode + hitung baris | `05-evidence.md` AC-08 | `Unverified` |
| `INV-01` (transisi `DITOLAK`) | PR `DITOLAK` tidak punya transisi keluar | uji fixture | `05-evidence.md` AC-11 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Waktu stok masuk (PT-02) | `Terjawab — D-36` (QC lulus) | saldo stok dan jurnal persediaan tidak sinkron jika salah |
| Daftar status (PT-03) | `Terjawab — D-46`, `D-47` (nama dari diagram §5.2) | transisi tidak lengkap atau salah |
| Cakupan tabel (PT-01) | `Terjawab — D-31` (QC masuk; utang dan pembayaran tidak) | utang dan pembayaran dibangun di dua tempat jika salah |
| Satu tabel dengan `wo_id` (PT-05) | `Proposed` `[USULAN-AGEN]` (nullable, FK menyusul di `PR-002`) | dua tabel PR, atau referensi produksi yang rusak |
| Transisi `DITOLAK` → `DISETUJUI` (PT-14) | `Terjawab — D-46` (cabang akhir; AC-11) | — |
| Pembatalan PR dan PO (PT-13) | `Proposed` `[USULAN-AGEN]`; bertentangan dengan `D-47` (d) | dokumen batal tanpa jejak, atau PO batal setelah barang datang |
| Pembuktian DoD butir 1 (PT-09) | `Proposed` `[USULAN-AGEN]` (uji service) | tidak ada bukti akhir sebelum layar `PG-002` |
| Tidak dipecah (PT-11) | `Proposed` `[USULAN-AGEN]` | item terlalu besar untuk satu track |
| Approval berjenjang (PT-10) | `Terjawab — D-37` (mesin di FND-004) | — |
