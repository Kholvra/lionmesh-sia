---
id: PG-008
slug: three-way-match-dan-utang-usaha
title: Three-way match dan utang usaha
epic: EPIC-PG
milestone: M1
lane: active
sequence: unset
type: feature
req_status: specified
delivery_status: in_progress
priority: unset
size: unset
depends_on:
  - FND-006
  - PG-007
blocks:
  - PG-009
owner_role: unset
package: docs/product/items/PG-008-three-way-match-dan-utang-usaha
---

# PG-008 — Three-way match dan utang usaha

## Masalah

Invoice pemasok bisa datang untuk barang yang belum diterima, barang yang gagal QC, atau dengan harga dan jumlah yang tidak sesuai. Tanpa pencocokan tiga dokumen, utang bisa diakui dan dibayar untuk barang yang tidak seharusnya dibayar.

## Outcome

Accounting mencatat invoice pemasok. Sistem mencocokkan invoice dengan PO dan penerimaan yang lulus QC pada saat invoice disimpan. Jika cocok, Purchasing dapat menindaklanjuti, Accounting mengesahkan, dan utang diakui dengan jurnal pengakuan. Jika tidak cocok, kasus menjadi exception yang terlihat, dan tidak ada utang maupun jurnal yang dibuat.

## Aktor

| Aktor | Peran pada item ini | Sumber |
|---|---|---|
| Purchasing | menjalankan pencocokan dan menindaklanjuti selisih dengan pemasok | `policies/matriks-izin.md` (D-33): Cocokkan dokumen = Purchasing |
| Accounting | mencatat invoice dan utang; mengesahkan pencocokan | D-33: Catat invoice & utang dan Sahkan pencocokan = Accounting; pengesahan wajib (`00-discussion.md` Q-13) |
| Sistem | menghitung kecocokan, menolak invoice tidak valid | ARCH-001 BOUNDARY-01, BOUNDARY-02 |

## Ringkasan (derived)

- Track: PG-D utang. Level 7 (derived dari backlog).
- Menyentuh uang dan memblokir `PG-009` serta `INT-001`.
- Ukuran besar (lihat `03-readiness-review.md`).

## Cakupan

### Termasuk

- Pencatatan invoice pemasok dengan nomor, tanggal, termin, referensi penerimaan, dan baris (R-01).
- Validasi termin wajib per invoice (D-14).
- Pencocokan qty dan harga atau total terhadap PO dan penerimaan lulus QC (R-02, R-03).
- Pengesahan dan pengakuan utang dengan jurnal (R-05).
- Exception saat tidak cocok, dan koreksi atau pembatalan invoice (R-04, R-06, R-09).
- Pajak masukan (PPN) pada invoice, dengan tarif dari konfigurasi berversi (R-03, R-05).
- Jatuh tempo utang (R-08).

### Tidak termasuk

- Pembayaran dan alokasi pembayaran (PG-009).
- Rekonsiliasi bank (PG-010).
- Laporan pembelian dan laporan keuangan (milik core, D-25; lihat `PG-009` Q-08).
- Penerimaan dan QC (PG-006, PG-007).
- Nota debit atau kredit dari pemasok (tidak ada di sumber).

## Constraints & invariants

- Utang diakui saat tiga dokumen cocok, tidak saat PO terbit (EPIC-PG).
- Invoice yang qty-nya melebihi qty lulus QC ditolak (EPIC-PG gate 2, R-02).
- Termin pemasok wajib per invoice, tanpa default (D-14).
- Selisih qty selalu exception dan tidak pernah lolos toleransi (D-15).
- Toleransi per pemasok, default 0, hanya untuk harga dan total (D-15, R-03).
- Jurnal hanya lewat `postJournal()` (D-07).
- Jurnal pengakuan memakai peran akun (D-35) dan balance (R-05).
- Invoice tidak mengubah stok (R-10).
- Pencatat invoice tidak boleh mengesahkan invoice yang sama (D-48, R-11).

## Behavior / rules

### Aturan (keputusan terkunci atau [USULAN-AGEN], lihat `00-discussion.md`)

- `R-01` Accounting mencatat invoice dengan: pemasok aktif; nomor invoice unik per pemasok (R-07); tanggal invoice; termin wajib (D-14); satu referensi penerimaan (D-49); baris dengan qty dan harga satuan DPP net (D-17); PPN dihitung dari tarif berversi (D-51 (a)); nomor faktur pajak masukan diinput manual (D-24).
- `R-02` Pembanding: qty invoice per baris dibandingkan dengan qty lulus QC pada baris penerimaan. Invoice hanya dicatat bila semua baris penerimaan itu sudah QC final ([USULAN-AGEN], Q-11). Qty invoice melebihi qty lulus ditolak (EPIC-PG gate 2). Qty invoice kurang dari qty lulus adalah kurang tagih dan menjadi `SELISIH` (D-15).
- `R-03` Pencocokan dijalankan saat invoice disimpan. Harga satuan DPP dibandingkan dengan harga PO, dan total DPP dengan toleransi yang sama. Selisih dianggap dalam toleransi bila persen dan nominal dipenuhi bersama, per baris, dengan default 0 (Q-01, [USULAN-AGEN]). PPN invoice harus sama dengan PPN hitung (hitung dibulatkan ke rupiah terdekat per dokumen, pola D-51 (b)); bila berbeda, hasilnya `SELISIH` ([USULAN-AGEN]).
- `R-04` Hasil pencocokan langsung menjadi `COCOK` atau `SELISIH` saat invoice disimpan; tidak ada status pra-cocok (D-46; D-47). `SELISIH` menjadi `COCOK` setelah dikoreksi lalu dicocokkan ulang.
- `R-05` Pengesahan oleh Accounting (bukan pencatat invoice, R-11) atas invoice `COCOK` menyimpan utang dan jurnal dalam satu transaksi, dengan status `TERCATAT` (D-46):
  - Dr 202 Utang belum difakturkan senilai qty lulus × harga PO (D-44 (2), D-44 (1));
  - Dr peran `ppn_masukan` senilai PPN;
  - Dr atau Cr peran `selisih_harga_pembelian` senilai selisih DPP terhadap PO, bila ada selisih dalam toleransi ([USULAN-AGEN]);
  - Cr 201 Utang usaha senilai total invoice (DPP + PPN).
  Total debit sama dengan total kredit (D-41, D-43).
- `R-06` Invoice `SELISIH` tidak membuat utang dan tidak membuat jurnal. Purchasing menindaklanjuti selisih dengan pemasok. Accounting dapat merevisi invoice (pencocokan ulang; pengesahan gugur, D-48) atau membatalkan invoice dengan alasan (R-09). Pemasok dapat menerbitkan invoice baru.
- `R-07` Nomor invoice unik per pemasok. Invoice dengan kunci yang sama ditolak ([USULAN-AGEN] dari §7.5).
- `R-08` Jatuh tempo = tanggal invoice + termin (D-49).
- `R-09` Pembatalan: sebelum `TERCATAT`, invoice `COCOK` atau `SELISIH` dibatalkan Accounting dengan alasan wajib menjadi `DIBATALKAN` (D-48). Setelah `TERCATAT`, pembatalan hanya bila belum ada pembayaran teralokasi. Pembatalan lewat jurnal pembalik (D-35) dan status `DIBATALKAN` ([USULAN-AGEN]).
- `R-10` Invoice tidak mengubah `saldo_stok`. Selisih harga tidak masuk persediaan (D-44 (1)) dan ditangani R-05.
- `R-11` Pencatat invoice tidak boleh mengesahkan invoice yang sama (D-48). Purchasing menjalankan pencocokan; Accounting mengesahkan.

### Alur utama

1. Accounting mencatat invoice: pemasok, nomor, tanggal, termin, referensi penerimaan, dan baris (R-01).
2. Sistem memeriksa invoice (lihat Validasi) dan menjalankan pencocokan (R-02, R-03).
3. Bila `COCOK`, Accounting membuka invoice dan mengesahkan. Sistem menyimpan utang dan jurnal (R-05).
4. Bila `SELISIH`, sistem menampilkan selisih. Purchasing menindaklanjuti. Accounting mengoreksi atau membatalkan (R-06, R-09).

### Status

| Status | Arti | Transisi |
|---|---|---|
| `COCOK` (D-46) | tiga dokumen cocok; belum disahkan | ke `TERCATAT` saat disahkan; ke `DIBATALKAN` (R-09) |
| `SELISIH` (D-46) | ada selisih; exception terlihat | ke `COCOK` setelah dikoreksi dan dicocokkan ulang; ke `DIBATALKAN` (R-09) |
| `TERCATAT` (D-46) | utang dicatat dan jurnal dibuat | ke `DIBAYAR_SEBAGIAN` atau `LUNAS` (PG-009); ke `DIBATALKAN` hanya sesuai R-09 |
| `DIBATALKAN` ([USULAN-AGEN]) | invoice dibatalkan dengan alasan | — |

### Validasi dan pesan

| Kondisi gagal | Perilaku yang diharapkan |
|---|---|
| Termin kosong | Invoice ditolak; pesan menyebut termin wajib diisi |
| Nomor invoice sudah ada untuk pemasok yang sama | Invoice ditolak; pesan menyebut nomor dan pemasok |
| Qty invoice melebihi qty lulus QC | Invoice ditolak; pesan menyebut baris dan qty lulus |
| Invoice untuk penerimaan yang belum semua barisnya QC final | Invoice ditolak; pesan menyebut baris yang belum QC |
| Penerimaan sudah punya invoice aktif (selain `DIBATALKAN`) | Invoice ditolak; pesan menyebut invoice yang ada (D-49) |
| Qty invoice kurang dari qty lulus | Invoice disimpan dengan status `SELISIH`; pesan menyebut selisih qty (D-15) |
| Harga atau total di luar toleransi pemasok | `SELISIH`; pesan menyebut selisih dan toleransi |
| Harga atau total dalam toleransi pemasok | `COCOK`; selisih dicatat sebagai informasi |
| PPN invoice tidak sama dengan PPN hitung | `SELISIH`; pesan menyebut nilai PPN yang dihitung |
| Pemasok tidak aktif | Invoice ditolak; pesan menyebut status pemasok |
| Pengesahan oleh pencatat invoice yang sama | Ditolak; pesan menyebut pemisahan tugas |
| Pembatalan tanpa alasan | Ditolak; pesan menyebut alasan wajib diisi |
| Pembatalan invoice `TERCATAT` yang sudah punya pembayaran teralokasi | Ditolak; pesan menyebut pembayaran yang ada |

Teks pesan final mengikuti implementasi; yang diikat adalah isi informasi pesan.

## Success

- Tidak ada utang yang diakui tanpa tiga dokumen cocok dan pengesahan Accounting.
- Setiap pengakuan utang punya jurnal yang balance.
- Setiap selisih qty dan harga muncul sebagai exception atau informasi, tidak pernah hilang.

## Edge cases (optional)

- Penerimaan `sebagian` (PG-006) dengan invoice dicatat saat sisa belum datang: invoice hanya untuk qty yang sudah dicatat dan lulus QC (R-02).
- Invoice dengan PPN dan tarif yang berubah antar tanggal: tarif diambil dari konfigurasi pada tanggal invoice (AC-10).
- Invoice dibatalkan setelah utang diakui (R-09).
- Selisih harga yang melewati toleransi tetapi dalam nilai kecil: tetap `SELISIH` (R-03).

## Decision references (optional)

- `EPIC-PG` aturan mengikat dan gate 2.
- `D-07`, `D-10`, `D-14`, `D-15`, `D-17`, `D-24`, `D-25`, `D-33`, `D-35`, `D-38`, `D-41`, `D-43`, `D-44`, `D-46`, `D-47`, `D-48`, `D-49`, `D-51`.
- Pertanyaan dan jawabannya: lihat `00-discussion.md`.

## Catatan serah terima

Requirement ini mengikat perilaku dan bukti. Akun utang dan GR/IR sudah ditetapkan (D-41, D-44). Tarif PPN dan angka toleransi belum ada di sumber dan tidak boleh diisi dari asumsi (D-51 (a)). Desain kontrak ada di `04-design-contract.md` (status `Proposed`).
