<!--
Peran: REFERENCE — bukan sumber normatif.
Sumber asli: pemahaman-app-e2e.md (di luar repo)
Disalin: 2026-11-17

Yang mengikat adalah docs/product/backlog.md, docs/product/decisions.md,
dan items/*/02-acceptance-criteria.md. Dokumen ini menjelaskan mengapa,
bukan apa yang harus dibangun. Kalau bertentangan, backlog menang.
-->

# SIA Lionmesh — Pemahaman Aplikasi End to End

> **Dokumen ini apa:** penjelasan lengkap aplikasi yang akan dibangun, dari konsep sampai perilaku per fitur. Ditulis untuk tech lead yang akan membagi kerja ke empat kelompok.
>
> **Dokumen ini bukan:** backlog, bukan spesifikasi teknis final, bukan jadwal.
>
> **Penanda yang dipakai:**
>
> | Penanda | Arti |
> |---|---|
> | `[SUMBER]` | Ada di empat DOCX dan bisa dilacak ke sana |
> | `[ANALISIS]` | Turunanku dari sumber — kesimpulan, bukan kutipan |
> | `[KURANG]` | Tidak ada di sumber, atau sumber bertentangan dengan dirinya sendiri |
> | `[USULAN]` | Solusi yang kuajukan untuk menutup `[KURANG]` |
> | `[KEPUTUSAN]` | Bukan wewenangku — harus diputuskan manusia |
>
> **Batas sumber:** `AllDocs/` empat DOCX. Semua klaim `[SUMBER]` berasal dari sana. `[ANALISIS]` dan `[USULAN]` adalah tambahanku dan **tidak boleh** dianggap keputusan perusahaan.

---

## 0. Ringkasan satu menit

`[ANALISIS]` Aplikasi ini bukan ERP. Ini **mesin aliran dokumen** untuk pabrik wire mesh dengan tiga pekerjaan:

1. **Mencatat apa yang terjadi** — pesanan, pembelian, produksi, gaji.
2. **Memaksa urutan dan izin** — siapa boleh membuat, memeriksa, menyetujui.
3. **Menerjemahkan ke angka** — stok, utang, piutang, jurnal.

Semua 48 use case di sumber adalah variasi dari tiga pekerjaan itu. Tidak ada satu pun yang keluar dari pola.

Yang membuatnya menantang bukan fiturnya, tapi **titik temu**: stok disentuh tiga modul, jurnal disentuh empat, dan biaya tenaga kerja menyeberang dari penggajian ke produksi. Di situlah proyek seperti ini biasanya pecah.

`[ANALISIS]` Kalau kamu hanya mengerjakan satu hal dengan benar, kerjakan **lapisan bersama** — stok, jurnal, dan status dokumen. Sisanya bisa menyusul.

---

## 1. Masalah yang diselesaikan

`[SUMBER]` PT Lionmesh Prima Tbk adalah manufaktur wire mesh. Empat makalah menganalisis empat siklusnya secara terpisah dan sama-sama menyimpulkan bahwa pencatatan masih manual/tersebar, sehingga:

- Status dokumen tidak terlacak (PR sudah sampai mana? PO sudah diterima belum?)
- Angka stok, utang, dan piutang dihitung ulang secara manual
- Persetujuan tidak punya jejak
- Laporan baru bisa dibuat setelah rekap ulang

`[ANALISIS]` Jadi nilai jual aplikasi ini bukan "digitalisasi formulir". Nilainya adalah **satu sumber kebenaran**: satu dokumen yang statusnya bisa dilihat siapa saja, dan satu angka yang tidak perlu direkap ulang.

`[ANALISIS]` Konsekuensi penting: kalau aplikasi hanya memindahkan formulir ke layar tapi angkanya masih dihitung manual di Excel, aplikasi ini **gagal pada tujuannya**. Karena itu jurnal dan mutasi stok harus otomatis, bukan opsional.

---

## 2. Model mental

### 2.1 Tiga lapis

`[ANALISIS]` Setiap fitur di aplikasi ini jatuh ke salah satu dari tiga lapis. Kalau kamu tidak bisa menempatkan sebuah fitur, requirement-nya belum matang.

| Lapis | Isi | Contoh | Kalau salah |
|---|---|---|---|
| **Dokumen** | barang bukti bahwa sesuatu terjadi | PR, PO, SO, faktur, WO, payroll | tidak ada jejak, tidak bisa diaudit |
| **Kontrol** | siapa boleh apa, kapan boleh lanjut | review, approval, gate QC, matching | dokumen bisa melompati prosedur |
| **Angka** | efek yang harus konsisten | mutasi stok, piutang, utang, jurnal | laporan tidak balance |

### 2.2 Lima objek yang selalu berulang

`[ANALISIS]` Dari 48 UC, hanya ada lima jenis objek:

1. **Master** — pelanggan, pemasok, produk, karyawan, akun
2. **Dokumen** — sesuatu yang punya nomor, tanggal, status
3. **Baris dokumen** — item di dalam dokumen (produk + qty + harga)
4. **Mutasi** — pergerakan stok yang tidak bisa diubah
5. **Jurnal** — pasangan debit-kredit

Kalau kamu membangun lima hal ini dengan benar, 48 UC tinggal merangkainya.

### 2.3 Satu siklus hidup dokumen

`[ANALISIS]` Semua dokumen mengikuti bentuk yang sama. Ini **bukan** empat state machine berbeda — ini satu pola yang dipakai ulang dengan nama status berbeda.

```
                  ┌──────────► DITOLAK (final)
                  │
DRAFT ──► DIAJUKAN ──► DIPERIKSA ──► DISETUJUI ──► DIPROSES ──► SELESAI
   ▲           │                          │
   └── REVISI ◄┘                          └──► DIBATALKAN (final)
```

`[USULAN]` Terapkan pola ini di `core/dokumen`, bukan di tiap modul. Bedanya antar modul hanya **daftar status yang sah** dan **siapa boleh memindahkan**.

### 2.4 Tiga service + satu domain bersama

`[ANALISIS]` Ini kesimpulan arsitektur terpenting di dokumen ini.

| Bagian | Jenis | Dipakai oleh | Kalau tiap modul punya sendiri |
|---|---|---|---|
| `inventory` | service | Pendapatan, Pengeluaran, Produksi | tiga saldo berbeda untuk barang yang sama |
| `ledger` | service | keempat modul | laporan keuangan tidak balance |
| `dokumen` | service | keempat modul | tidak ada layar "menunggu tindakan saya" |
| `pengadaan` | domain | Pengeluaran (layar) + Produksi (PR bahan) | dua jalur PO, dua tabel utang |

`[ANALISIS]` Bedanya: **service** tidak punya layar sendiri, hanya fungsi yang dipanggil. **Domain** punya tabel dan aturan sendiri, dipakai lebih dari satu modul, tapi layarnya milik satu modul. Pengadaan kategori kedua — kodenya di `core/pengadaan`, layarnya di `modules/pengeluaran`.

`[ANALISIS]` Pola yang sama muncul di tiga tempat: **satu penulis, banyak pembaca.** Modul tidak pernah menulis langsung ke tabel stok atau jurnal — mereka memanggil service.

---

## 3. Aktor dan hak akses

### 3.1 Daftar aktor

`[SUMBER]` Lima belas aktor muncul di empat makalah.

| Aktor | Siklus | Catatan sumber |
|---|---|---|
| Pelanggan | Pendapatan | pihak luar, **tidak punya akun** |
| Supplier | Pengeluaran | pihak luar, **tidak punya akun** |
| Penjualan / Sales | Pendapatan | |
| Pengiriman | Pendapatan | sering tumpang tindih dengan Gudang |
| Gudang | PD, PG, PR | aktor paling sibuk |
| Purchasing | PG, PR | |
| QC | PG, PR | |
| Produksi | PR | |
| Accounting | PD, PG, PR, GJ | |
| Finance | PD, PG, GJ | **≠ Accounting** |
| Manajemen | semua | |
| Direksi | GJ | **≠ Manajemen** |
| HR | GJ | |
| Supervisor Lapangan | GJ | |
| Karyawan | GJ | aktor internal, tapi belum tentu punya akun |

`[KURANG]` Sumber tidak pernah menetapkan daftar akun final.

`[KEPUTUSAN]` **12 akun staf** (15 aktor − 2 pihak luar − 1 karyawan). Karyawan diperlakukan sebagai **data**, bukan pengguna: presensi diinput HR/Supervisor, slip dicetak lalu diserahkan. Tidak ada portal karyawan.

### 3.2 Konflik peran di sumber

Ini bukan detail kecil — ini menentukan siapa boleh menekan tombol apa.

| # | Konflik | Sumber A | Sumber B | `[USULAN]` |
|---|---|---|---|---|
| 1 | Pemeriksaan payroll | Accounting (`GJ06` di tabel UC) | Finance memeriksa draft + cek dana (uraian) | Accounting periksa **angka**, Finance cek **dana** |
| 2 | Distribusi slip gaji | HR (`GJ09`) | Finance (diagram alur) | HR — karena HR yang punya data dan kontrak |
| 3 | Pemilik three-way match | Purchasing (tabel UC) | Accounting/Finance (proses umum) | Purchasing **menyiapkan**, Accounting **mengesahkan** |
| 4 | Siapa mencatat pemakaian bahan | Gudang | Produksi | Gudang catat **keluar**, Produksi catat **terpakai** |
| 5 | Pemeriksaan ketersediaan bahan | Gudang (tabel) | Produksi + Gudang (narasi) | Gudang |
| 6 | Penerbitan faktur | Accounting (tabel) | Pelanggan juga disebut (narasi) | Accounting — pelanggan tidak punya akun |
| 7 | Pembayaran pelanggan | Finance | Accounting (uraian pencocokan) | Finance **eksekusi**, Accounting **verifikasi** |

`[ANALISIS]` Pola di balik semua konflik ini sama: **yang mengeksekusi dan yang memverifikasi bukan orang yang sama.** Sumber sering mencampurnya karena menulis per-siklus, bukan per-peran. Prinsip pemisahan tugas ini yang harus dipegang, bukan nama aktornya.

### 3.3 Matriks hak aksi `[USULAN]`

`[KURANG]` Sumber tidak punya matriks izin. Ini usulanku — **wajib disahkan** sebelum dijadikan aturan.

**Pendapatan**

| Aksi | Boleh |
|---|---|
| Buat / ubah pelanggan | Penjualan |
| Buat pesanan | Penjualan |
| Verifikasi pesanan | Penjualan |
| Cek & alokasi stok | Gudang |
| Buat pengiriman | Gudang, Pengiriman |
| Terbitkan faktur | Accounting |
| Lihat piutang | Accounting, Manajemen |
| Catat pembayaran | Finance |
| Verifikasi pembayaran | Accounting |
| Lihat laporan penjualan | Penjualan, Accounting, Manajemen |

**Pengeluaran**

| Aksi | Boleh |
|---|---|
| Buat / ubah pemasok | Purchasing |
| Ajukan PR | Gudang, Produksi |
| Periksa PR | Purchasing |
| Setujui PR | Manajemen |
| Pilih pemasok | Purchasing |
| Terbitkan PO | Purchasing |
| Catat penerimaan | Gudang |
| Catat QC | QC |
| Cocokkan dokumen | Purchasing |
| Sahkan pencocokan | Accounting |
| Catat invoice & utang | Accounting |
| Bayar pemasok | Finance |
| Lihat laporan pembelian | Purchasing, Accounting, Manajemen |

**Produksi**

| Aksi | Boleh |
|---|---|
| Kelola data produk | Produksi |
| Buat perintah produksi | Produksi |
| Ajukan permintaan bahan | Produksi |
| Cek ketersediaan bahan | Gudang |
| Verifikasi permintaan bahan | Purchasing |
| Setujui pembelian bahan | Manajemen |
| Terima bahan | Gudang |
| Catat pemakaian | Gudang + Produksi |
| Catat hasil produksi | Produksi |
| Periksa QC hasil | QC |
| Terima barang jadi | Gudang |
| Catat biaya produksi | Accounting |
| Lihat laporan produksi | Produksi, Gudang, Manajemen, Accounting |

**Penggajian**

| Aksi | Boleh |
|---|---|
| Kelola data karyawan | HR |
| Catat presensi / lembur | Karyawan (atau HR atas nama) |
| Rekap presensi | HR |
| Validasi presensi | Supervisor Lapangan |
| Hitung draft payroll | HR |
| Periksa payroll | Accounting |
| Setujui payroll | Direksi |
| Cek dana & bayar | Finance |
| Terbitkan slip | HR |
| Jurnal payroll | Accounting |
| Lihat laporan payroll | HR, Accounting, Direksi |

`[ANALISIS]` Perhatikan tiga hal yang sengaja **tidak** diberikan:

- **Direksi tidak membuat dokumen apa pun.** Hanya menyetujui.
- **Manajemen tidak menyentuh transaksi.** Hanya approval.
- **Accounting tidak mengeksekusi pembayaran.** Hanya mencatat dan memverifikasi.

Ini yang membuat pemisahan tugas punya arti.

---

## 4. Peta modul

`[USULAN]` Satu aplikasi, lima bagian kode. Bukan lima aplikasi.

```
┌──────────────────────────── core ────────────────────────────┐
│ auth · izin · dokumen (nomor+status+riwayat) · inventory      │
│ ledger · pengadaan (PR/PO/penerimaan) · ui kit · audit        │
└──────────────────────────────────────────────────────────────┘
        ▲            ▲             ▲              ▲
   ┌────┴───┐   ┌────┴────┐   ┌────┴────┐   ┌─────┴─────┐
   │Pendapat│   │Pengeluar│   │Produksi │   │ Penggajian│
   │  an    │   │   an    │   │         │   │           │
   └────────┘   └─────────┘   └─────────┘   └───────────┘
```

**Aturan batas `[USULAN]`:**

1. Modul boleh mengimpor `core/*`.
2. Modul **tidak boleh** mengimpor modul lain.
3. Semua tulisan ke stok dan jurnal lewat `core`, tidak ada pengecualian.
4. Satu tabel hanya punya satu pemilik modul. Kalau dua modul butuh, tabelnya naik ke `core`.

`[ANALISIS]` Aturan 4 adalah yang paling sering dilanggar pemula. Kalau dua kelompok sama-sama butuh tabel `permintaan_pembelian`, jawabannya bukan "siapa cepat dia dapat", tapi **tabel itu naik ke core**.

### 4.1 Kenapa pengadaan masuk core `[ANALISIS]`

Ini keputusan yang paling tidak intuitif, jadi perlu dijelaskan.

`[SUMBER]` Siklus Pengeluaran punya jalur PR → PO → terima. Siklus Produksi **juga** punya jalur permintaan bahan → verifikasi → PO → terima.

Kalau dibiarkan, dua kelompok akan membangun modul pengadaan yang sama. `[USULAN]` Jawabannya:

- `permintaan_pembelian` **satu tabel**, dengan kolom `wo_id` opsional
- Kalau `wo_id` terisi → PR berasal dari Produksi
- Kalau kosong → PR berasal dari Gudang
- PO, penerimaan, QC bahan tetap satu jalur

`[ANALISIS]` Konsekuensinya: **kelompok Produksi tidak membangun PO sendiri.** Mereka hanya memanggil `pengadaan.ajukanPR()`. Ini memotong sekitar 5 use case duplikat dari kelompok Produksi dan membuat PR07 secara alami menjadi bagian Pengeluaran.

---

## 5. Inventaris fitur

`[ANALISIS]` Total 48 use case sumber. Tapi use case ≠ layar. Setelah digabung berdasarkan **outcome yang bisa dilihat**, dan setelah seluruh fitur yang disebut sumber masuk cakupan, hasilnya **46 fitur**: 12 core + 34 fitur modul.

`[CATATAN]` Angka naik dari 39 karena (a) fitur yang tadinya "tidak dikerjakan" sekarang masuk, dan (b) laporan keuangan serta tutup buku ditambahkan — keduanya tidak pernah disebut di sumber, tapi tanpa itu aplikasinya bukan SIA.

Prioritas:

- **P0** — tanpa ini alur inti tidak bisa jalan
- **P1** — melengkapi satu siklus penuh
- **P2** — bagus kalau ada waktu
- **X** — tidak dipakai; semua fitur masuk cakupan

### 5.1 Core (dikerjakan tech lead)

| # | Fitur | Isi | P |
|---|---|---|---|
| C1 | Autentikasi | login, logout, sesi, role di sesi | P0 |
| C2 | Izin | cek role per aksi, menu dari role | P0 |
| C3 | Dokumen | nomor otomatis, state machine, riwayat status, **approval bertingkat nominal** (`aturan_approval`) | P0 |
| C4 | Inventory | mutasi stok masuk/keluar, qty turunan, nilai via `saldo_stok`, **transfer antar gudang**, stock opname | P0 |
| C5 | Ledger | COA, jurnal, validasi debit=kredit | P0 |
| C6 | Audit | siapa membuat/mengubah, kapan | P1 |
| C7 | UI kit | tabel, form, badge status, dialog konfirmasi | P0 |
| C8 | Dashboard | ringkasan + antrean "menunggu tindakan saya" | P1 |
| C9 | **Laporan keuangan** | buku besar, neraca saldo, laba rugi, neraca | P0 |
| C10 | **Tutup buku** | periode akuntansi, jurnal penutup, kunci periode | P1 |
| C11 | **Master data** | COA, satuan + konversi, kategori produk, gudang, mata uang + kurs | P0 |
| C12 | **Notifikasi** | in-app + email, antrean kirim + status | P2 |

### 5.2 Pendapatan — 10 UC → 9 fitur

| # | Fitur | UC | Isi | P |
|---|---|---|---|---|
| PD-1 | Pelanggan | PD01 | CRUD, nonaktifkan, cari, **batas kredit** | P0 |
| PD-2 | Pesanan | PD02 + PD03 | buat, **diskon**, **pajak**, hitung total, **validasi batas kredit**, verifikasi | P0 |
| PD-3 | Cek stok | PD04 | tersedia vs diminta, alokasi | P0 |
| PD-4 | Pengiriman | PD05 | surat jalan, stok keluar, bukti terima | P0 |
| PD-5 | Faktur & piutang | PD06 + PD07 | faktur dari pengiriman, AR, aging, **faktur pajak** | P0 |
| PD-6 | Pembayaran | PD08 | cocokkan, lunas/parsial, **alokasi ke beberapa faktur** | P0 |
| PD-7 | **Retur penjualan** | — | retur, kredit memo, persetujuan, stok masuk kembali setelah QC | P1 |
| PD-8 | Jurnal penjualan | PD09 | otomatis dari PD-4/5/6/7 | P0 |
| PD-9 | Laporan | PD10 | penjualan, piutang, kas | P1 |

### 5.3 Pengeluaran — 12 UC → 10 fitur

| # | Fitur | UC | Isi | P |
|---|---|---|---|---|
| PG-1 | Pemasok | PG01 | CRUD, term, toleransi match, nonaktifkan | P0 |
| PG-2 | Permintaan pembelian | PG02 | dari Gudang atau Produksi | P0 |
| PG-3 | Review & approval PR | PG03 + PG04 | dua tahap, **ambang nominal bertingkat**, jejak keputusan | P0 |
| PG-4 | Pilih pemasok | PG05 | kandidat, riwayat harga | P1 |
| PG-5 | Purchase order | PG06 | terbit, kirim, konfirmasi supplier | P0 |
| PG-6 | Penerimaan | PG07 | cocokkan qty, selisih | P0 |
| PG-7 | QC bahan | PG08 | lulus/gagal, pisahkan barang | P0 |
| PG-8 | Matching & utang | PG09 + PG10 | three-way match, AP, jatuh tempo, **pajak masukan** | P0 |
| PG-9 | Pembayaran & laporan | PG11 + PG12 | bayar parsial, **alokasi multi-faktur**, laporan | P0 |
| PG-10 | **Rekonsiliasi bank** | — | impor mutasi bank, cocokkan, selisih | P1 |

`[ANALISIS]` PG-2, PG-5, PG-6, PG-7 **dibangun di `core/pengadaan`** (§4.1, §2.4), tapi layarnya milik kelompok Pengeluaran. Jadi yang dikerjakan kelompok: layar + alur, bukan tabel baru.

### 5.4 Produksi — 14 UC → 7 fitur

| # | Fitur | UC | Isi | P |
|---|---|---|---|---|
| PR-1 | Data produksi | PR01 | produk, komponen/bahan per unit | P0 |
| PR-2 | Perintah produksi | PR02 | WO, target qty, tanggal | P0 |
| PR-3 | Kebutuhan & permintaan bahan | PR03 + PR04 + PR05 + PR06 | hitung kebutuhan, cek stok, ajukan | P0 |
| PR-4 | Pemakaian bahan | PR09 | keluar gudang, aktual, sisa, scrap | P0 |
| PR-5 | Hasil & QC | PR10 + PR11 + PR12 | WIP, hasil, rework/reject, barang jadi | P0 |
| PR-6 | Biaya produksi | PR13 | bahan + TKL + overhead → HPP | P1 |
| PR-7 | Laporan | PR14 | produksi, WIP, persediaan | P1 |

`[ANALISIS]` PR07 dan PR08 (PO & penerimaan bahan) **pindah ke PG-5 dan PG-6**. Itu sebabnya 14 UC menyusut jadi 7 fitur.

### 5.5 Penggajian — 12 UC → 8 fitur

| # | Fitur | UC | Isi | P |
|---|---|---|---|---|
| GJ-1 | Data karyawan | GJ01 | NIK, jabatan, upah, rekening, PTKP | P0 |
| GJ-2 | Presensi & lembur | GJ02 | input harian, pengajuan SPL | P0 |
| GJ-3 | Rekap & validasi | GJ03 + GJ04 | rekap periode, gate supervisor | P0 |
| GJ-4 | Hitung payroll | GJ05 | draft, komponen, total | P0 |
| GJ-5 | Periksa & setujui | GJ06 + GJ07 | dua tahap, kunci draft | P0 |
| GJ-6 | Bayar & slip | GJ08 + GJ09 | transfer, status gagal, slip | P0 |
| GJ-7 | Jurnal & laporan | GJ10 + GJ11 | alokasi beban, laporan TKL | P1 |
| GJ-8 | **Impor presensi** | — | impor dari mesin absensi atau file, pemetaan NIK | P2 |

### 5.6 Cakupan penuh

`[KEPUTUSAN]` Tidak ada fitur yang dipotong. Semua dikerjakan. Daftar di bawah bukan "ditunda", tapi **butuh aturan tambahan** sebelum bisa dibangun.

| Fitur | Dibangun di | Status | Yang dibutuhkan dulu |
|---|---|---|---|
| Retur penjualan & kredit memo | PD-7 | masuk | alur persetujuan retur |
| Diskon bertingkat & harga khusus | PD-2 | masuk | jenis diskon: per item / per dokumen / per pelanggan |
| Pajak PPN | PD-2, PD-5, PG-8 | masuk | tarif, dasar pengenaan, perlakuan faktur pajak |
| Batas kredit pelanggan | PD-1, PD-2 | masuk | ambang & tindakan saat terlampaui |
| Multi-gudang | C4, C11 | masuk | daftar gudang & aturan transfer |
| Approval bertingkat nominal | C3 | masuk | ambang per level |
| Rekonsiliasi bank | PG-10 | masuk | format rekening koran |
| Multi-mata uang | C11 | masuk | kurs & sumber kurs |
| Notifikasi email / WhatsApp | C12 | masuk | kanal & penerima |
| Integrasi mesin absensi | GJ-8 | **butuh konfirmasi** | merek/tipe mesin dan akses ekspornya |
| Integrasi bank | PG-10 | **butuh konfirmasi** | API bank atau file transfer |
| Portal pelanggan / supplier | — | **tetap tidak** | keputusan pengguna: pihak luar tidak punya akun |

`[CATATAN]` Semua baris "masuk" sudah punya fitur pemilik. Kalau sebuah baris tidak punya kolom **Dibangun di**, itu tanda fiturnya belum ada di §5.1–§5.5.

---

## 6. Alur end to end

`[ANALISIS]` Bagian ini menelusuri **satu pesanan** dari masuk sampai lunas, lalu **satu periode gaji**. Semua angka contoh adalah karangan untuk ilustrasi, bukan data perusahaan.

### 6.1 Skenario

Pelanggan memesan **500 lembar wire mesh**. Stok barang jadi hanya **200**. Bahan baku kurang. Satu karyawan produksi lembur.

### 6.2 Hari 1 — pesanan masuk

| # | Langkah | Modul | Dokumen / status | Efek angka | Aktor |
|---|---|---|---|---|---|
| 1 | Pelanggan kirim PO via email | — | — | — | Pelanggan |
| 2 | Sales input pesanan | Pendapatan | `SO/2026/11/0001` → `DRAFT` | — | Penjualan |
| 3 | Sales verifikasi | Pendapatan | → `VERIFIED` | — | Penjualan |
| 4 | Gudang cek stok: ada 200, butuh 500 | Pendapatan | → `MENUNGGU_STOK` | alokasi 200 | Gudang |
| 5 | Sistem kabari Produksi | Pendapatan → Produksi | — | — | — |

`[ANALISIS]` Perhatikan langkah 4: **alokasi 200 langsung dikunci** untuk pesanan ini. Tanpa alokasi, dua pesanan bisa menjanjikan barang yang sama.

`[KURANG]` Sumber hanya menyebut "cek ketersediaan", tidak pernah menyebut **alokasi**. `[USULAN]` Tambahkan tabel `alokasi_stok` (pesanan_id, produk_id, qty) yang mengurangi "tersedia" tanpa mengurangi saldo fisik. Tanpa ini, fitur PD-3 tidak bisa diimplementasikan dengan benar.

### 6.3 Hari 1 — perintah produksi

| # | Langkah | Modul | Dokumen / status | Efek angka | Aktor |
|---|---|---|---|---|---|
| 6 | Produksi buat WO 300 lembar | Produksi | `WO/2026/11/0007` → `DIRENCANAKAN` | — | Produksi |
| 7 | Sistem hitung kebutuhan bahan | Produksi | — | — | — |
| 8 | Gudang cek bahan: kurang | Produksi | → `BAHAN_KURANG` | — | Gudang |
| 9 | Produksi ajukan permintaan bahan | Produksi | `PB/2026/11/0003` | — | Produksi |
| 10 | Purchasing verifikasi | Produksi | → `TERVERIFIKASI` | — | Purchasing |
| 11 | Manajemen setujui | Produksi | → `DISETUJUI` | — | Manajemen |
| 12 | Sistem buat PR di modul pengadaan | Pengeluaran | `PR/2026/11/0042` (`wo_id` terisi) | — | otomatis |

`[KURANG]` **Langkah 7 mustahil tanpa daftar bahan per produk.** Sumber tidak pernah menyebut bill of materials, tapi PR03 jelas membutuhkannya.

`[USULAN]` Tambah tabel `produk_komponen` (produk_id, bahan_id, qty_per_unit). Ini satu-satunya cara "kebutuhan bahan" bisa dihitung. Kalau tidak ada, user harus mengetik kebutuhan manual setiap WO — dan itu menghapus seluruh nilai fitur PR-1.

### 6.4 Hari 2–4 — pengadaan

| # | Langkah | Modul | Dokumen / status | Efek angka | Aktor |
|---|---|---|---|---|---|
| 13 | Purchasing review PR | Pengeluaran | → `MENUNGGU_PERSETUJUAN` | — | Purchasing |
| 14 | Manajemen setujui | Pengeluaran | → `DISETUJUI` | — | Manajemen |
| 15 | Pilih pemasok | Pengeluaran | → `PEMASOK_DITETAPKAN` | — | Purchasing |
| 16 | Terbitkan PO | Pengeluaran | `PO/2026/11/0091` → `DITERBITKAN` | komitmen, bukan utang | Purchasing |
| 17 | Barang datang, terima | Pengeluaran | `TRM/2026/11/0078` → `DITERIMA` | belum ada mutasi | Gudang |
| 18 | QC lulus | Pengeluaran | → `QC_LULUS` | **stok bahan ↑** | QC |

`[ANALISIS]` Langkah 16 dan 18 adalah dua titik yang paling sering salah di aplikasi buatan sendiri:

- **PO tidak menaikkan stok dan tidak menaikkan utang.** PO hanya janji. Kalau PO langsung membuat jurnal, laporan keuangan akan membengkak sebelum barang ada.
- **Stok baru masuk setelah QC lulus**, bukan saat diterima. Kalau langsung masuk, barang cacat ikut terhitung tersedia.

`[KURANG]` Sumber tidak konsisten: di satu tempat stok masuk saat penerimaan, di tempat lain setelah QC. `[USULAN]` Pakai **setelah QC lulus** — lebih aman secara kontrol dan sesuai prinsip "hanya yang layak pakai yang dihitung".

### 6.5 Hari 4 — produksi

| # | Langkah | Modul | Dokumen / status | Efek angka | Aktor |
|---|---|---|---|---|---|
| 19 | Bahan dikeluarkan ke lantai | Produksi | `PKM/2026/11/0012` | **stok bahan ↓, WIP ↑** | Gudang |
| 20 | Produksi input pemakaian aktual | Produksi | → `BERJALAN` | selisih dicatat | Produksi |
| 21 | Produksi input hasil: 295 jadi, 5 cacat | Produksi | → `HASIL_DICATAT` | WIP disesuaikan | Produksi |
| 22 | QC periksa | Produksi | → `QC_PASSED` / `REWORK` | — | QC |
| 23 | Barang jadi masuk gudang | Produksi | `BJ/2026/11/0031` → `SELESAI` | **stok jadi ↑, WIP ↓** | Gudang |

`[ANALISIS]` Langkah 21–22 memperlihatkan kelemahan sumber: ia menyebut "lulus/tidak lulus" tapi tidak pernah menjelaskan **apa yang terjadi pada 5 unit cacat**. Kalau rework, apakah biayanya masuk HPP? Kalau reject, apakah dibuang atau dijual sisa?

`[KEPUTUSAN]` Hasil QC memakai tiga status — `lulus`, `rework`, `reject`. Biaya rework **masuk HPP** WO. Reject **≤ `toleransi_reject` diserap** ke unit baik; reject **di atas toleransi** dibebankan sebagai kerugian produksi. Ini perlakuan normal vs abnormal spoilage, sesuai Q4.

`[KEPUTUSAN]` Kalau perusahaan punya kebijakan lain, ini yang harus diganti.

### 6.6 Hari 5 — kirim dan tagih

| # | Langkah | Modul | Dokumen / status | Efek angka | Aktor |
|---|---|---|---|---|---|
| 24 | Gudang siapkan 500 lembar | Pendapatan | `SJ/2026/11/0064` | **stok jadi ↓** | Gudang |
| 25 | Pelanggan tanda tangan bukti | Pendapatan | → `TERKIRIM` | — | Pelanggan |
| 26 | Accounting terbitkan faktur | Pendapatan | `INV/2026/11/0055` | **piutang ↑** | Accounting |
| 27 | Sistem jurnal otomatis | Core ledger | — | lihat 6.7 | — |

`[ANALISIS]` Faktur dibuat **dari pengiriman**, bukan dari pesanan. Ini bukan detail administratif — ini yang membuat nilai tagihan selalu sama dengan barang yang benar-benar keluar. Kalau faktur dibuat dari pesanan, pesanan 500 yang baru dikirim 300 akan tertagih 500.

### 6.7 Jurnal yang lahir otomatis

`[ANALISIS]` Sumber tidak pernah menetapkan jurnalnya. Ini usulanku, dan **wajib disahkan** karena menentukan bentuk laporan keuangan.

| Kejadian | Debit | Kredit | Catatan |
|---|---|---|---|
| Barang jadi masuk gudang | Persediaan barang jadi | Persediaan WIP | nilai = HPP sementara |
| Pengiriman + faktur | Piutang usaha | Penjualan | |
| Pengiriman (HPP) | Harga pokok penjualan | Persediaan barang jadi | |
| Pembayaran pelanggan | Kas | Piutang usaha | |
| Penerimaan bahan lolos QC | Persediaan bahan | Barang diterima belum ditagih (GR/IR) | utang belum diakui karena invoice belum ada |
| Invoice supplier diterima | Barang diterima belum ditagih (GR/IR) | Utang usaha | memindahkan kewajiban ke akun utang resmi |
| Pembayaran pemasok | Utang usaha | Kas | |
| Payroll dibayar | Beban gaji | Kas | |
| Alokasi payroll produksi | WIP | Beban gaji | memindahkan TKL ke HPP |
| Potongan BPJS & PPh 21 | Beban gaji | Utang BPJS / Utang pajak | |

`[KURANG]` Sumber tidak menyebut **akun "barang diterima belum ditagih"** (GR/IR). Tanpa akun ini, ada celah: barang sudah diterima dan dipakai, tapi invoice belum datang — utang tidak tercatat, laporan understated.

`[USULAN]` Akun perantara GR/IR sudah dipakai di tabel di atas. Ini praktik standar dan hanya butuh satu akun tambahan di COA.

### 6.8 Hari 30 — pelunasan

| # | Langkah | Modul | Dokumen / status | Efek angka | Aktor |
|---|---|---|---|---|---|
| 28 | Pelanggan transfer | — | — | — | Pelanggan |
| 29 | Finance input pembayaran | Pendapatan | `BYR/2026/12/0011` | **kas ↑, piutang ↓** | Finance |
| 30 | Sistem cocokkan nominal vs sisa | Pendapatan | → `LUNAS` / `DIBAYAR_SEBAGIAN` | — | — |
| 31 | Accounting verifikasi | Pendapatan | jurnal kas | — | Accounting |

`[KURANG]` Sumber tidak punya aturan **kelebihan bayar**, **selisih pembulatan**, atau **pembayaran gabungan beberapa faktur**.

`[USULAN]` Satu pembayaran bisa dialokasikan ke beberapa faktur lewat tabel `alokasi_pembayaran`; kelebihan bayar menjadi saldo kredit pelanggan.

### 6.9 Akhir bulan — payroll

| # | Langkah | Modul | Dokumen / status | Efek angka | Aktor |
|---|---|---|---|---|---|
| 32 | Karyawan isi presensi & lembur | Penggajian | `PRS`, `SPL` | — | Karyawan |
| 33 | HR rekap periode | Penggajian | → `REKAP` | — | HR |
| 34 | Supervisor validasi | Penggajian | → `TERVALIDASI` | — | Supervisor |
| 35 | HR hitung draft | Penggajian | → `DRAFT_TERHITUNG` | beban diakui (belum kas) | HR |
| 36 | Accounting periksa | Penggajian | → `DIPERIKSA` | — | Accounting |
| 37 | Direksi setujui | Penggajian | → `DISETUJUI` (dikunci) | — | Direksi |
| 38 | Finance transfer | Penggajian | → `DIBAYAR` | **kas ↓** | Finance |
| 39 | HR terbitkan slip | Penggajian | `SLIP` | — | HR |
| 40 | Accounting jurnal & alokasi | Penggajian | → `DIPOSTING` | **WIP ↑** untuk TKL pabrik | Accounting |

`[ANALISIS]` Langkah 40 adalah satu-satunya jembatan antara penggajian dan produksi. Kalau jembatan ini putus, HPP akan selalu kurang karena tenaga kerja langsung tidak pernah masuk.

### 6.10 Efek berantai yang harus konsisten

`[ANALISIS]` Ini daftar hal yang **wajib berubah bersamaan**. Kalau salah satu lupa, data jadi tidak konsisten dan sulit diperbaiki.

| Aksi | Wajib ikut berubah |
|---|---|
| Kirim barang | mutasi stok keluar + status SO + alokasi dilepas |
| Terbit faktur | piutang + jurnal + status pengiriman |
| Bayar pelanggan | piutang + jurnal + status faktur |
| QC bahan lulus | mutasi stok masuk + status penerimaan + antrean PO |
| Pakai bahan | mutasi keluar + WIP + status WO |
| Terima barang jadi | mutasi masuk + WIP turun + status WO |
| Bayar gaji | pembayaran + jurnal + status periode |
| Setiap perubahan status | baris baru di `riwayat_status` |

`[USULAN]` Semua pasangan di atas dijalankan dalam **satu transaksi database**. Kalau tidak, akan ada momen di mana stok sudah turun tapi status belum berubah — dan itu sumber bug yang paling sulit dilacak.

---

## 7. Model data

### 7.1 Empat prinsip

`[ANALISIS]` Ini bukan preferensi gaya. Ini yang menentukan apakah angka bisa dipercaya.

**1. Jumlah stok diturunkan, nilai stok disimpan sebagai state.**
Jumlah = `SUM(mutasi.qty)`. Tapi **nilai** tidak bisa dijumlah begitu saja kalau memakai rata-rata bergerak — butuh `saldo_stok` (qty, nilai, harga_rata) yang di-update dalam transaksi yang sama dengan mutasinya. Jangan pernah menaruh kolom `stok` di tabel `produk`: cepat atau lambat akan berbeda dengan riwayat, dan tidak ada cara membuktikan mana yang benar.

**2. Jurnal tidak pernah ditulis modul.**
Hanya `ledger.postJournal()`. Kalau tiap modul menyusun jurnalnya sendiri, formatnya akan berbeda dan laporan tidak bisa digabung.

**3. Dokumen tidak pernah dihapus.**
Salah input → batalkan (`DIBATALKAN`), bukan `DELETE`. Dokumen batal tetap terlihat di laporan dengan nilai nol.

**4. Setiap perubahan status meninggalkan jejak.**
Satu tabel `riwayat_status` untuk semua dokumen. Tanpa ini, pertanyaan "siapa yang menyetujui ini?" tidak bisa dijawab.

### 7.2 Tabel inti (milik core)

| Tabel | Isi | Catatan |
|---|---|---|
| `pengguna` | akun, email, role | terhubung ke Supabase Auth |
| `karyawan` | NIK, jabatan, departemen, tipe (Produksi/Non-Produksi), PTKP, rekening | dipakai juga oleh payroll |
| `gaji_pokok_histori` | riwayat gaji pokok per karyawan | perubahan gaji tidak menimpa masa lalu |
| `komponen_gaji` | master tunjangan & potongan | tidak ada di sumber sebagai tabel terpisah |
| `tarif_lembur` | multiplier lembur per golongan | berversi |
| `tarif_bpjs` | persentase karyawan/perusahaan + batas upah | berversi |
| `tarif_ter` | lookup PPh 21: kategori PTKP × bruto → tarif | PMK 168/2023 |
| `departemen`, `jabatan` | master organisasi | |
| `pelanggan` | master pelanggan | |
| `pemasok` | master pemasok + term | |
| `produk` | bahan / WIP / barang jadi | satu tabel, dibedakan `tipe` |
| `produk_komponen` | bahan per unit produk + `toleransi_scrap`, **`toleransi_reject`**, `versi`, `berlaku_dari` | **BOM** — Q2: satu level, berversi |
| `gudang` | lokasi stok, mendukung multi-gudang | aturan transfer antar gudang belum ada |
| `mutasi_stok` | pergerakan stok, append-only | sumber kebenaran stok |
| `alokasi_stok` | stok yang dikunci untuk pesanan | tidak ada di sumber |
| `akun` | chart of accounts | |
| `jurnal`, `detail_jurnal` | header + baris debit/kredit | |
| `riwayat_status` | jejak semua transisi | polimorfik |
| `dokumen_counter` | nomor urut per jenis/periode | tidak ada di sumber |
| `lampiran` | file pendukung (bukti transfer, surat jalan) | tidak ada di sumber |
| `aturan_approval` | ambang nominal per level persetujuan | tidak ada di sumber |
| `notifikasi` | antrean notifikasi + status kirim | tidak ada di sumber |
| `mata_uang`, `kurs` | mata uang & kurs per tanggal | tidak ada di sumber |
| `satuan`, `konversi_satuan` | satuan & konversi antar satuan | tidak ada di sumber |
| `periode_akuntansi` | periode + status kunci | tidak ada di sumber |
| `tarif_overhead` | periode, dasar alokasi, tarif, kapasitas normal, pool anggaran | Q3 |
| `overhead_aktual` | pool aktual per periode per akun | Q3 |
| `konfigurasi_pajak` | tarif, tanggal berlaku, akun | tidak ada di sumber |
| `saldo_stok` | qty, nilai, harga rata per produk per gudang | sumber kebenaran **nilai** |
| ~~`lapisan_stok`~~ | tidak dipakai — Q1 memilih rata-rata bergerak | — |
| `transfer_stok`, `detail_transfer` | perpindahan antar gudang | multi-gudang |
| `pemeriksaan_stok`, `detail_pemeriksaan_stok` | stock opname | penyesuaian saldo |
| `permintaan_pembelian`, `detail_pr` | PR dari Gudang & Produksi | **domain core, layar di Pengeluaran** |
| `po`, `detail_po` | purchase order | **domain core, layar di Pengeluaran** |
| `penerimaan`, `detail_penerimaan`, `pemeriksaan_qc` | terima barang + QC bahan | **domain core, layar di Pengeluaran** |
| `invoice_supplier`, `utang`, `pembayaran_supplier` | AP + pembayaran | **domain core, layar di Pengeluaran** |

### 7.3 Tabel per modul

**Pendapatan:** `pesanan`, `detail_pesanan`, `pengiriman`, `detail_pengiriman`, `faktur`, `detail_faktur`, `piutang`, `pembayaran_pelanggan`, `alokasi_pembayaran`, `retur_penjualan`, `detail_retur`, `faktur_pajak`, `aturan_diskon`

**Pengeluaran:** `rekening_bank`, `mutasi_bank`, `rekonsiliasi_bank`

**Produksi:** `perintah_produksi`, `permintaan_bahan`, `detail_permintaan_bahan`, `pemakaian_bahan`, `hasil_produksi`, `qc_produksi`, `penerimaan_barang_jadi`

**Penggajian:** `periode_payroll`, `presensi`, `lembur`, `payroll_detail`, `slip_gaji`, `pembayaran_gaji`, `impor_presensi`

`[ANALISIS]` Tabel pengadaan pindah ke §7.2 karena domain-nya di core. Yang tersisa di modul Pengeluaran hanya tiga tabel rekonsiliasi bank.

`[ANALISIS]` Bandingkan dengan sumber: ERD pendapatan punya 14 tabel termasuk `laporan` dan `pemeriksaan_stok`. Aku **membuang `laporan`** (laporan dihitung saat dibuka, tidak disimpan) dan **mempertahankan `pemeriksaan_stok` sebagai log** (bukan sumber saldo).

`[KURANG]` Sumber punya tabel `laporan` dengan isi "periode, penyusun, pemantau". `[USULAN]` Buang — itu bukan data, itu catatan akses. Kalau nanti butuh audit siapa membuka laporan apa, tambahkan tabel `log_akses` terpisah, jangan dicampur ke model transaksi.

### 7.4 Tabel tambahan karena cakupan penuh `[USULAN]`

Tabel inti sudah masuk §7.2, tabel modul sudah masuk §7.3. Yang tersisa di sini: kolom tambahan yang **tidak** butuh tabel baru.

| Tabel | Kolom baru | Untuk |
|---|---|---|
| `detail_pesanan`, `detail_po`, `detail_faktur`, `invoice_supplier` | `diskon_persen`, `diskon_nilai`, `dpp`, `ppn`, `total` | diskon & pajak |
| `pesanan`, `faktur`, `po`, `invoice_supplier`, `pembayaran_*` | `mata_uang`, `kurs`, `nilai_idr` | multi-mata uang |
| `mutasi_stok` | `harga_satuan`, `nilai`, `gudang_id` | valuasi & multi-gudang |
| `pelanggan` | `batas_kredit`, `term_hari` | batas kredit & termin |
| `pemasok` | `term_hari`, `toleransi_persen`, `toleransi_nominal` | termin & matching |

`[CATATAN]` Pajak **tidak** disimpan di header dokumen. Simpan di detail, supaya satu dokumen bisa punya tarif berbeda per baris.

### 7.5 Aturan integritas `[USULAN]`

| Aturan | Implementasi |
|---|---|
| Nomor dokumen unik | `UNIQUE(tipe, nomor)` |
| Satu dokumen satu status | `status` NOT NULL + CHECK |
| Jurnal harus balance | trigger atau validasi di service |
| Stok tidak boleh negatif | validasi sebelum insert mutasi keluar |
| Baris dokumen tidak boleh kosong | validasi minimal 1 item |
| Faktur tidak boleh dobel | `UNIQUE(pengiriman_id)` |
| Invoice supplier tidak boleh dobel | `UNIQUE(nomor_invoice, pemasok_id)` |
| Qty harus positif | CHECK `qty > 0` |
| Tanggal tidak di masa depan untuk realisasi | validasi service |
| Jurnal harus punya sumber | `sumber_tipe` + `sumber_id` NOT NULL |
| Periode terkunci tidak menerima jurnal | cek `periode_akuntansi.status` sebelum post |
| Pembayaran tidak melebihi utang/piutang | validasi di service + `alokasi_pembayaran` |

---

## 8. Aturan bisnis

### 8.1 Yang sudah jelas dari sumber `[SUMBER]`

- NIK karyawan unik
- Lembur harus punya instruksi atasan
- Payroll tidak boleh jalan sebelum presensi divalidasi supervisor
- Direksi mengunci draft saat menyetujui
- Finance menyimpan bukti transfer
- Transfer gagal/parsial harus ditandai
- PR yang ditolak berhenti dan tidak bisa jadi PO
- Barang gagal QC dipisahkan
- Dokumen pendukung dicocokkan sebelum utang diakui
- Pembayaran parsial menyisakan saldo
- Barang yang sudah dikirim baru difakturkan

### 8.2 Yang aku tetapkan `[USULAN]`

Ini keputusan yang kuambil supaya aplikasi bisa dibangun. Semua bisa diganti.

| # | Aturan | Alasan |
|---|---|---|
| 1 | Pengiriman parsial didukung | tanpa ini alur stok kurang buntu |
| 2 | Satu PR untuk Gudang & Produksi, dibedakan `wo_id` | menghapus duplikasi pengadaan |
| 3 | Stok masuk setelah QC lulus | barang cacat tidak boleh tersedia |
| 4 | Reject ≤ toleransi diserap ke HPP; di atas toleransi jadi kerugian produksi. Rework masuk HPP. Retur hanya untuk bahan | normal vs abnormal spoilage |
| 5 | Metode valuasi: rata-rata bergerak | paling sederhana, satu angka per produk |
| 6 | Overhead: tarif predeterminasi dari DLH, kapasitas normal, selisih disesuaikan di akhir periode | jam kerja sudah ada di sumber (`penggunaan_tenaga_kerja`); HPP tetap lengkap walau WO tutup di tengah periode |
| 7 | Pajak masuk; harga master **net** (belum PPN); tarif dari `konfigurasi_pajak` berversi, tidak di-hardcode | tarif berubah tanpa mengubah harga |
| 8 | Satu pembayaran bisa dialokasikan ke beberapa faktur | pembayaran gabungan itu lazim |
| 9 | Dokumen tidak bisa dihapus, hanya dibatalkan | audit |
| 10 | Approval bertingkat nominal, ambang di `aturan_approval` | ambang bisa diubah tanpa deploy |
| 11 | Akun hanya untuk 12 staf; karyawan = data, slip dicetak | Q9 |
| 12 | Notifikasi in-app + email; WhatsApp menyusul | in-app paling murah, email cukup untuk operasional |
| 13 | Retur penjualan mengurangi piutang; stok masuk kembali setelah QC | konsisten dengan aturan stok |
| 14 | Diskon di level baris, bukan level dokumen | lebih mudah diaudit per item |
| 15 | Pajak di level baris, tarif dari `konfigurasi_pajak` | satu dokumen bisa campur tarif |
| 16 | Kurs dicatat saat transaksi, tidak di-revaluasi otomatis | menghindari selisih kurs yang tidak diminta |
| 17 | Termin: pelanggan default 30 hari dengan override; pemasok tanpa default, wajib diisi | sumber hanya menyebut angka untuk pelanggan |
| 18 | Selisih qty terima tidak pernah lolos toleransi; hanya harga/total yang bertoleransi | mencegah pembayaran barang yang tidak diterima |
| 19 | Batas kredit: block, bukan reject; override per pesanan + alasan | menjaga kontrol tanpa mematikan penjualan |
| 20 | Payroll dihitung dari tabel tarif berversi; override manual wajib alasan | tarif berubah tiap periode |

### 8.3 Dua arti "periode" yang harus dibedakan `[ANALISIS]`

Kata "periode" muncul di dua tempat dengan arti berbeda. Kalau dicampur, tutup buku akan mengunci payroll yang salah.

| Istilah | Milik | Panjang | Yang dikunci |
|---|---|---|---|
| **Periode penggajian** | `periode_payroll` | 1 bulan, bisa beda awal/akhir | presensi, lembur, draft payroll |
| **Periode akuntansi** | `periode_akuntansi` | 1 bulan kalender | jurnal, **bukan** dokumen sumber |

`[USULAN]` Aturannya: **tutup buku mengunci jurnal, bukan dokumen.** Dokumen sumber (faktur, PO, slip) tetap bisa dilihat; koreksi lewat jurnal penyesuaian di periode berikutnya. Payroll punya kuncinya sendiri (GJ-5), terpisah dari tutup buku.

`[ANALISIS]` Kenapa dipisah: payroll Desember sering dibayar Januari. Kalau tutup buku Desember ikut mengunci payroll, gaji terakhir tahun tidak bisa dibayar.

### 8.4 Yang masih kosong

Lihat bagian 9. Itu daftar lengkapnya.

---

## 9. Analisis gap

`[ANALISIS]` Ini bagian yang kamu minta: **data apa yang kurang, dan apa solusinya.**

Kolom **"Sumber"** menjelaskan kondisi sebenarnya di empat DOCX. Kolom **"Usulan"** adalah solusiku. Kolom **"Kalau salah"** menjelaskan akibatnya kalau diisi asal.

### 9.1 Gap yang memblokir (harus diputuskan sebelum coding)

| # | Aspek | Sumber | Kalau salah | Usulan | Status |
|---|---|---|---|---|---|
| G1 | **Metode valuasi persediaan** | Tidak disebut sama sekali | HPP tidak bisa dihitung; PR13 tidak bisa dibuat | Rata-rata bergerak. `saldo_stok` (qty, nilai, harga_rata) per produk per gudang, di-update dalam transaksi yang sama dengan mutasi | `[DIKUNCI]` |
| G2 | **Bill of materials** | Tidak ada, padahal PR03 butuh "kebutuhan bahan" | PR03 mustahil; user ketik manual tiap WO | Tabel `produk_komponen` (produk, bahan, `qty_per_unit`, `toleransi_scrap`, `versi`, `berlaku_dari`) — satu level | `[DIKUNCI]` |
| G3 | **Rumus overhead** | Hanya disebut "biaya overhead pabrik" sebagai komponen HPP; ERD punya `penggunaan_tenaga_kerja` dan `biaya_overhead`, tapi **tanpa rumus alokasi** | HPP bisa dikarang, laporan tidak bisa dipertanggungjawabkan | Tarif predeterminasi = pool anggaran ÷ kapasitas normal (jam). Diterapkan per WO = DLH × tarif. Selisih akhir periode disesuaikan ke HPP | `[DIKUNCI]` |
| G4 | **Termin pembayaran** | Pelanggan: "rata-rata 30 hari, disesuaikan per transaksi". Pemasok: **tidak tersedia di sumber** | Jatuh tempo salah, aging piutang salah | Pelanggan default 30 hari + override per pesanan/faktur. Pemasok tanpa default, wajib input per invoice | `[DIKUNCI]` |
| G5 | **Toleransi three-way match** | Tidak ada angkanya; sumber hanya bilang "apabila ketiga dokumen sesuai" | Setiap selisih jadi exception, atau over-billing lolos | `toleransi_persen` + `toleransi_nominal` per pemasok, default 0, hanya untuk **harga/total**. Selisih qty **selalu** exception | `[DIKUNCI]` |
| G6 | **Perlakuan barang gagal QC** | Status sudah jelas di sumber: **QC Passed / Rework / Rejected**; `produk_tidak_standar` ditandai tidak dipakai. Yang tidak ada: perlakuan **biaya** reject | Biaya reject bisa hilang, atau membebani HPP secara keliru | Reject ≤ `toleransi_reject` diserap ke unit baik; di atasnya jadi kerugian produksi. Rework masuk HPP. Retur hanya untuk bahan (PG-07) | `[DIKUNCI]` |
| G7 | **Rumus lembur, BPJS, PPh 21** | Tabel tarif sudah ada di ERD sumber (`tarif_lembur`, `tarif_bpjs`, `tarif_ptkp`), tapi tidak ada rumusnya | Payroll salah hitung | Semua komponen dihitung dari tabel tarif berversi. Lembur & BPJS dari persentase; PPh 21 dari lookup TER (PMK 168/2023). Override manual wajib alasan | `[DIKUNCI]` |
| G8 | **Batas kredit pelanggan** | Tidak ada sama sekali | Pesanan melebihi kemampuan bayar tetap lolos | `batas_kredit` per pelanggan (default 0 = tunai). Exposure = piutang + pesanan terbuka. Melewati limit → status `MENUNGGU_PERSETUJUAN_KREDIT`. Override Manajemen per pesanan + alasan wajib | `[DIKUNCI]` |

### 9.2 Gap yang bisa diisi dengan usulan

| # | Aspek | Sumber | Usulan |
|---|---|---|---|
| G9 | **Alokasi stok** | Hanya "cek ketersediaan" | Tabel `alokasi_stok`, mengurangi tersedia tanpa mengubah saldo |
| G10 | **Penomoran dokumen** | Tidak ada aturan format | `{TIPE}/{tahun}/{bulan}/{urut}` dengan `dokumen_counter` |
| G11 | **Periode akuntansi** | Tidak disebut | Tutup buku per periode akuntansi + jurnal penutup |
| G12 | **Jurnal pembalik** | Tidak disebut | Tabel `jurnal_pembalik` — dokumen batal menghasilkan jurnal balik, bukan hapus |
| G13 | **Akun GR/IR** | Tidak ada | Akun perantara "barang diterima belum ditagih" |
| G14 | **Status `laporan`** | Ada tabel `laporan` | Dibuang; laporan dihitung saat dibuka |
| G15 | **Edit setelah dikunci** | Hanya "Direksi mengunci" | Tidak bisa edit; koreksi lewat dokumen baru |
| G16 | **Konkurensi approval** | Tidak disebut | Optimistic lock: `UPDATE ... WHERE status = 'x'` |
| G17 | **Retensi & arsip** | Tidak disebut | Tidak ada penghapusan; arsip setelah tutup buku |
| G18 | **Satuan & konversi** | Hanya "satuan" | Multi-satuan + tabel konversi |

### 9.3 Gap yang butuh konfirmasi eksternal

| # | Aspek | Status |
|---|---|---|
| G19 | Integrasi mesin absensi | **masuk cakupan**, menunggu konfirmasi merek & akses ekspor |
| G20 | Integrasi bank | **masuk cakupan**, menunggu konfirmasi API atau file transfer |
| G21 | Multi-gudang | **masuk cakupan** |
| G22 | Multi-perusahaan | tetap di luar — tidak relevan untuk satu PT |
| G23 | Portal pelanggan/supplier | tetap di luar — keputusan pengguna |
| G24 | Pelaporan pajak (e-Faktur) | **masuk cakupan**, butuh format & kewajiban pelaporan |

### 9.4 Ringkasan: apa yang paling rapuh

`[ANALISIS]` Kalau aku harus menunjuk tiga hal yang paling mungkin membuat proyek ini gagal:

1. **HPP.** Tiga gap (`G1`, `G2`, `G3`) menumpuk di satu fitur. Kalau ketiganya tidak diputuskan, PR13 tidak akan pernah selesai dan kelompok Produksi akan mengarang angkanya.
2. **Pengadaan ganda.** Kalau Produksi dan Pengeluaran sama-sama membangun PR/PO sendiri, kamu akan punya dua jalur pembelian, dua tabel utang yang tidak nyambung, dan laporan pembelian yang tidak pernah utuh.
3. **Jurnal yang ditulis tiap modul.** Ini kesalahan paling umum di proyek semacam ini, dan akibatnya baru terlihat di akhir saat laporan tidak balance.

`[KEPUTUSAN]` Ketiganya sudah dikunci: Q1 rata-rata bergerak, Q2 BOM satu level, Q3 DLH + predeterminasi.

---

## 10. Hal non-fungsional

`[ANALISIS]` Sumber tidak membahas satu pun dari ini. Semuanya `[KURANG]`, jadi semuanya `[USULAN]`.

### 10.1 Autentikasi & sesi

- Login lewat Supabase Auth (sudah ada di repo).
- Role **tidak** disimpan di token, tapi dibaca dari tabel `pengguna` setiap request. Alasannya: kalau role diubah, efeknya harus langsung.
- Sesi kedaluwarsa mengikuti default Supabase.

### 10.2 Otorisasi

Dua lapis:

1. **Server** — setiap aksi memeriksa role sebelum menulis. Ini yang mengikat.
2. **Client** — menu dan tombol disembunyikan sesuai role. Ini hanya kenyamanan, bukan keamanan.

`[ANALISIS]` Jangan pernah mengandalkan lapis kedua saja. Kalau tombolnya disembunyikan tapi endpoint-nya terbuka, siapa pun yang tahu URL bisa menembak.

### 10.3 Audit

Setiap tabel punya `created_by`, `created_at`, `updated_by`, `updated_at`. Setiap transisi status punya baris di `riwayat_status`.

`[USULAN]` Tidak perlu tabel audit terpisah. Kolom + riwayat sudah cukup untuk pertanyaan "siapa dan kapan".

### 10.4 Penomoran dokumen

`[KURANG]` Sumber tidak menentukan format. `[USULAN]`:

```
{ TIPE }/{ YYYY }/{ MM }/{ Urut 4 digit }
Contoh: SO/2026/11/0001
```

Diambil dari tabel `dokumen_counter(tipe, periode, urut_terakhir)` dengan `UPDATE ... RETURNING` agar atomik. **Jangan** pakai `COUNT(*) + 1` — dua orang yang menyimpan bersamaan akan dapat nomor yang sama.

### 10.5 Konkurensi

`[KURANG]` Sumber tidak membahas dua orang menyetujui dokumen yang sama.

`[USULAN]` Optimistic lock sederhana:

```sql
UPDATE permintaan_pembelian
SET status = 'DISETUJUI'
WHERE id = $1 AND status = 'MENUNGGU_PERSETUJUAN';
```

Kalau `rowCount = 0`, berarti sudah diubah orang lain → tampilkan pesan "dokumen sudah diproses". Ini lima baris kode dan menutup seluruh kelas bug ini.

### 10.6 Zona waktu, mata uang, angka

- Zona waktu: `Asia/Jakarta`, disimpan UTC di database.
- Mata uang: IDR sebagai default. Transaksi asing menyimpan `mata_uang`, `kurs`, dan nilai IDR pada saat transaksi.
- Uang: `numeric(18,2)` — **jangan** `float`.
- Qty: `numeric(18,4)` untuk bahan yang bisa pecahan.
- Pembulatan: 2 desimal, dibulatkan saat ditampilkan, bukan saat disimpan.

### 10.7 Skala

`[ANALISIS]` Pabrik menengah: perkiraan puluhan dokumen per hari, ratusan baris payroll per bulan. Tidak butuh cache, antrean, atau arsitektur khusus. Supabase tier biasa cukup.

Yang perlu diperhatikan bukan beban, tapi **jumlah query yang berulang** — misalnya saldo stok yang dihitung ulang di setiap baris tabel. Solusi: satu view atau satu query agregat, bukan N+1.

### 10.8 Backup & pemulihan

Supabase menyediakan backup harian. `[USULAN]` Tambahkan satu hal yang lebih penting untuk proyek ini: **skrip seed data**. Tanpa data contoh, setiap kelompok akan mengisi database dengan data karangan masing-masing dan tidak bisa saling menguji.

---

## 11. Arsitektur teknis

`[ANALISIS]` Ini bukan keputusan sumber. Ini usulanku berdasarkan repo yang sudah ada.

### 11.1 Stack yang sudah terpasang

| Lapis | Teknologi | Status |
|---|---|---|
| Framework | Next.js 16.4 App Router | ✅ ada |
| Bahasa | TypeScript | ✅ ada |
| UI | Tailwind 4 | ✅ ada |
| Database | Supabase Postgres | ✅ ada |
| Auth | Supabase Auth + `@supabase/ssr` | ✅ ada |
| Package manager | pnpm | ✅ ada |
| Test | — | ❌ belum ada |
| CI | — | ❌ belum ada |

**Foundation: `partial`.** Kerangka jalan, domain bisnis belum ada sama sekali.

### 11.2 Struktur folder `[USULAN]`

```
src/
├── core/
│   ├── auth/          sesi, ambil user, cek role
│   ├── izin/          matriks aksi → role
│   ├── dokumen/       nomor, state machine, riwayat
│   ├── inventory/     mutasi, saldo, alokasi
│   ├── ledger/        COA, postJournal, laporan
│   ├── pengadaan/     PR, PO, penerimaan, QC, matching
│   ├── audit/         helper created_by / updated_by
│   └── ui/            tabel, form, badge status, dialog
│
├── modules/
│   ├── pendapatan/
│   ├── pengeluaran/
│   ├── produksi/
│   └── penggajian/
│
└── app/               routing tipis, menyambung ke modul
```

Isi satu modul:

```
modules/pendapatan/
├── service/           aturan bisnis modul
├── schema/            tipe & validasi
└── ui/                halaman & komponen
```

### 11.3 Aturan yang harus ditegakkan

| Aturan | Cara menegakkan |
|---|---|
| Modul tidak impor modul lain | ESLint rule `no-restricted-imports` |
| Stok hanya lewat `core/inventory` | review PR |
| Jurnal hanya lewat `core/ledger` | review PR |
| Tabel hanya dipakai pemiliknya | daftar pemilik tabel di dokumen ini |
| Migrasi tidak boleh diedit setelah dijalankan | penomoran berurutan |

`[ANALISIS]` Aturan pertama bisa ditegakkan otomatis oleh lint. Tiga sisanya harus lewat review. Kalau kamu tidak punya waktu review, minimal lakukan **satu review per minggu per kelompok** — itu sudah cukup untuk menangkap 80% pelanggaran.

### 11.4 Migrasi database

`[USULAN]` Satu file per perubahan, berurutan:

```
supabase/migrations/
├── 0001_initial.sql          (sudah ada: profiles)
├── 0002_core.sql             pengguna, karyawan, produk, akun, dll
├── 0003_inventory.sql
├── 0004_ledger.sql
├── 0005_pengadaan.sql
├── 0006_pendapatan.sql
├── 0007_produksi.sql
├── 0008_payroll.sql
├── 0009_pajak_valuta.sql     konfigurasi pajak, faktur pajak, mata uang, kurs, satuan
└── 0010_bank_notifikasi.sql  rekening bank, mutasi bank, rekonsiliasi, notifikasi, aturan approval
```

`[ANALISIS]` File `0002` sampai `0004` **harus selesai sebelum empat kelompok mulai**. Kalau tidak, mereka akan membuat tabel yang bertabrakan.

### 11.5 Catatan Next.js 16 `[ANALISIS]`

`AGENTS.md` di repo sudah memperingatkan bahwa Next.js 16 berbeda dari yang diketahui AI. Ini penting karena empat kelompok pemula akan memakai AI:

- AI akan menyarankan pola Next.js 13–15 yang tidak berlaku.
- Docs lokal ada di `node_modules/next/dist/docs/`.
- **Jangan hapus blok warning itu dari `AGENTS.md`** — dan pastikan setiap kelompok membacanya sebelum prompt pertama.

---

## 12. Definisi selesai

`[ANALISIS]` "Selesai" di proyek ini bukan "fiturnya sudah ada di kode", tapi "fiturnya bisa dipakai dari UI dan angkanya nyambung ke laporan".

### 12.1 Definition of Done per fitur `[USULAN]`

Sebuah fitur dianggap selesai kalau:

1. Bisa dilakukan dari UI, bukan hanya API.
2. Menolak input tidak valid dengan pesan yang bisa dibaca.
3. Meninggalkan jejak di `riwayat_status` kalau mengubah status.
4. Efek angkanya muncul di laporan terkait.
5. Bisa diulang dari seed data kosong.

Poin 5 yang paling sering dilupakan. Fitur yang hanya jalan karena ada data sisa di database belum selesai.

### 12.2 Definition of Done per siklus `[USULAN]`

Satu siklus dianggap selesai kalau seluruh rantai dokumennya bisa dijalankan berurutan tanpa menyentuh database manual, dan setiap perpindahan status menghasilkan jurnal yang balance.

---

## 13. Risiko proyek

`[ANALISIS]` Ini risiko nyata dari konteks yang kamu sebutkan: empat kelompok, semua pemula, semua memakai AI.

| # | Risiko | Kenapa terjadi | Mitigasi |
|---|---|---|---|
| R1 | Empat skema berbeda | AI masing-masing mengarang tabel | Schema core selesai **sebelum** kelompok mulai |
| R2 | Dua modul pengadaan | Produksi dan Pengeluaran sama-sama butuh PR/PO | Pengadaan masuk `core`, sudah diputuskan di §4.1 |
| R3 | Jurnal tidak balance | Tiap modul menyusun jurnal sendiri | Satu `postJournal()`, kode review |
| R4 | AI menulis Next.js 15 | Model training tertinggal | Wajib baca `AGENTS.md` + docs lokal |
| R5 | Satu kelompok memblokir tiga lainnya | Dependensi ke core tidak selesai | Core dikerjakan paling awal, sendiri |
| R6 | Merge conflict | Semua menyentuh file yang sama | Batas folder per modul, conflict hanya di core |
| R7 | Uji end-to-end gagal karena data kosong | Tidak ada seed | Skrip seed sejak awal, dijalankan juga di CI |
| R8 | Fitur banyak, tidak ada yang utuh | Cakupan penuh, waktu terbatas | **Semua fitur masuk**, tidak ada yang dipotong atau ditunda. Yang dijaga adalah DoD: satu fitur tidak dianggap selesai sebelum lolos §12.1 |

`[ANALISIS]` R5 adalah yang paling sering membunuh proyek kelompok. Kalau core belum jadi, tiga kelompok hanya bisa menunggu — dan menunggu sambil memakai AI berarti mereka akan mulai mengarang. Itu memperparah R1.

**Saran urutan:** core dulu, satu siklus diselesaikan penuh sebagai contoh (Pendapatan paling mudah), baru tiga sisanya jalan paralel memakai pola yang sudah terbukti.

---

## 14. Pertanyaan terbuka

`[KEPUTUSAN]` Ini yang harus kamu jawab sebelum backlog bisa dikunci.

### 14.1 Yang memblokir semua pekerjaan

| # | Pertanyaan | Kalau tidak dijawab |
|---|---|---|
| Q1 | Metode valuasi persediaan | `[DIJAWAB]` **rata-rata bergerak** |
| Q2 | BOM disimpan atau manual | `[DIJAWAB]` **BOM tersimpan, satu level, berversi** |
| Q3 | Dasar alokasi overhead | `[DIJAWAB]` **DLH + tarif predeterminasi + kapasitas normal** |
| Q4 | Perlakuan biaya barang reject | `[DIJAWAB]` **toleransi: normal diserap, abnormal jadi kerugian** |

### 14.2 Yang memblokir satu modul

| # | Pertanyaan | Modul |
|---|---|---|
| Q5 | Termin pembayaran | `[DIJAWAB]` **pelanggan 30 + override; pemasok wajib input** |
| Q6 | Toleransi matching | `[DIJAWAB]` **per pemasok, default 0, hanya harga/total** |
| Q7 | Batas kredit pelanggan | `[DIJAWAB]` **blokir + override, exposure = piutang + pesanan terbuka** |
| Q8 | Model harga & pajak | `[DIJAWAB]` **harga net, PPN dihitung, tarif berversi** |
| Q9 | Akun karyawan | `[DIJAWAB]` **tidak — 12 akun staf** |
| Q10 | Perhitungan payroll | `[DIJAWAB]` **semua dihitung dari tabel tarif** |

### 14.3 Yang memblokir cara kerja tim

| # | Pertanyaan | Status |
|---|---|---|
| Q11 | Siapa yang membangun core? | `[DIJAWAB]` **tech lead, core v0 dulu** |
| Q12 | Ada review sebelum merge atau tidak? | `[DIJAWAB]` ya — tech lead review semua merge |
| Q13 | Deadline proyek | `[TIDAK DIPAKAI]` dikerjakan mengalir, tanpa target tanggal |
| Q14 | Satu repo atau fork per kelompok? | `[DIJAWAB]` satu repo, branch per kelompok |

### 14.4 Peta G ↔ Q

Dua penomoran ini menunjuk isu yang sama dari sudut berbeda: **G** = gap di analisis (§9), **Q** = pertanyaan yang harus dijawab (§14). Pakai tabel ini untuk berpindah.

| Gap | Pertanyaan | Isu |
|---|---|---|
| G1 | Q1 | metode valuasi |
| G2 | Q2 | BOM |
| G3 | Q3 | overhead |
| G6 | Q4 | perlakuan QC gagal |
| G4 | Q5 | termin pembayaran |
| G5 | Q6 | toleransi matching |
| G8 | Q7 | batas kredit |
| G24 | Q8 | tarif & dasar pajak |
| — | Q9 | akun karyawan (keputusan pengguna, bukan gap data) |
| G7 | Q10 | rumus payroll |

---

## 15. Lampiran — peta use case ke fitur

`[ANALISIS]` Tabel ini yang menghubungkan dokumen ini dengan `diagram-sia-lengkap.md` dan makalah asli.

| UC | Fitur | Modul |
|---|---|---|
| PD01 | PD-1 | Pendapatan |
| PD02, PD03 | PD-2 | Pendapatan |
| PD04 | PD-3 | Pendapatan |
| PD05 | PD-4 | Pendapatan |
| PD06, PD07 | PD-5 | Pendapatan |
| PD08 | PD-6 | Pendapatan |
| PD09 | PD-8 | Core ledger |
| PD10 | PD-9 | Pendapatan |
| PG01 | PG-1 | Pengeluaran |
| PG02 | PG-2 | Core pengadaan (layar: Pengeluaran) |
| PG03, PG04 | PG-3 | Pengeluaran |
| PG05 | PG-4 | Pengeluaran |
| PG06 | PG-5 | Core pengadaan (layar: Pengeluaran) |
| PG07 | PG-6 | Core pengadaan (layar: Pengeluaran) |
| PG08 | PG-7 | Core pengadaan (layar: Pengeluaran) |
| PG09, PG10 | PG-8 | Core pengadaan + Accounting |
| PG11, PG12 | PG-9 | Pengeluaran |
| PR01 | PR-1 | Produksi |
| PR02 | PR-2 | Produksi |
| PR03, PR04, PR05, PR06 | PR-3 | Produksi + Core pengadaan |
| PR07 | PG-5 | Pengeluaran |
| PR08 | PG-6 | Pengeluaran |
| PR09 | PR-4 | Produksi |
| PR10, PR11, PR12 | PR-5 | Produksi |
| PR13 | PR-6 | Produksi |
| PR14 | PR-7 | Produksi |
| GJ00 | C1 | Core |
| GJ01 | GJ-1 | Penggajian |
| GJ02 | GJ-2 | Penggajian |
| GJ03, GJ04 | GJ-3 | Penggajian |
| GJ05 | GJ-4 | Penggajian |
| GJ06, GJ07 | GJ-5 | Penggajian |
| GJ08, GJ09 | GJ-6 | Penggajian |
| GJ10, GJ11 | GJ-7 | Penggajian |

**Fitur tanpa UC di sumber:**

| Fitur | Kenapa ada |
|---|---|
| C3 approval bertingkat | dibutuhkan karena cakupan penuh |
| C9 laporan keuangan | sumber tidak pernah menyebutnya, padahal ini inti SIA |
| C10 tutup buku | gap G11 |
| C11 master data | dibutuhkan semua modul |
| C12 notifikasi | sumber menyebut "kemungkinan" |
| PD-7 retur penjualan | disebut di sumber, tidak punya UC |
| PD-2 diskon & pajak | dibutuhkan, tidak ada UC |
| PG-10 rekonsiliasi bank | disebut, tidak ada UC |
| GJ-8 impor presensi | sumber menyebut "kemungkinan" |

`[ANALISIS]` Perhatikan: **dua UC Produksi (PR07 dan PR08) dikerjakan kelompok Pengeluaran.** Ini bukan salah tulis — ini konsekuensi keputusan pengadaan tunggal. Kalau kamu memilih desain lain, tabel ini berubah.

---

## 16. Penutup

`[ANALISIS]` Tiga kalimat yang merangkum semuanya:

1. Aplikasi ini adalah **mesin dokumen** yang menerjemahkan peristiwa menjadi status, lalu status menjadi angka. Fiturnya banyak, polanya satu.
2. Yang menentukan berhasil atau tidak bukan jumlah fitur, tapi **tiga service + satu domain bersama** — stok, jurnal, dokumen, pengadaan. Semua sisanya kosmetik.
3. Ada **empat keputusan** yang memblokir seluruh pekerjaan (Q1–Q4), ditambah dua keputusan tim yang belum dijawab (Q11 siapa membangun core, Q13 deadline). Selama belum dijawab, kelompok akan mengarang — dan mengarang bersamaan di empat tempat adalah cara paling cepat membuat empat aplikasi yang tidak bisa disatukan.

**Dokumen terkait:**

- `diskusi-app-sia.md` — ringkasan sumber & peta cakupan
- `diagram-sia-lengkap.md` — 112 diagram hasil rekreasi

---

## 17. Catatan keputusan

`[KEPUTUSAN]` Bagian ini mencatat hal yang sudah diputuskan, supaya tidak dibuka ulang tanpa alasan.

| Tanggal | Keputusan | Dampak ke dokumen |
|---|---|---|
| — | Cakupan **penuh**, tidak ada pemotongan fitur | §5.6 |
| — | **Satu repo** untuk empat kelompok | §14.3 Q14 |
| — | **Branch per kelompok**, tech lead me-review semua merge | §14.3 Q12 |
| — | Akun hanya staf internal; pelanggan/supplier tanpa akun | §3.1, §5.6 |
| — | Fitur menjadi **46** (12 core + 34 modul) | §5, §15, §16 |
| — | Laporan keuangan (C9) dan tutup buku (C10) masuk core | §5.1 |
| — | Pengadaan: **domain di core, layar di modul Pengeluaran** | §2.4, §7.2, §7.3 |
| — | Penomoran G dan Q dipetakan di satu tabel | §14.4 |
| — | **Q1: valuasi = rata-rata bergerak** | §9.1 G1, §14.1, §8.2 |
| — | **Q2: BOM tersimpan, satu level, berversi** | §9.1 G2, §14.1, §7.2 |
| — | **Q3: overhead = DLH, tarif predeterminasi, kapasitas normal** | §9.1 G3, §14.1, §8.2, §7.2 |
| — | **Q4: reject ≤ toleransi diserap, di atasnya jadi kerugian; retur hanya bahan** | §9.1 G6, §14.1, §8.2, §7.2 |
| — | **Q5: termin pelanggan 30 + override; pemasok wajib input** | §9.1 G4, §14.1, §8.2 |
| — | **Q6: toleransi match per pemasok, default 0, hanya harga/total** | §9.1 G5, §14.1, §8.2, §7.4 |
| — | **Q7: batas kredit blokir + override, exposure penuh** | §9.1 G8, §14.2, §8.2 |
| — | **Q8: harga master net, PPN dihitung di dokumen, tarif berversi** | §14.2, §8.2, §7.2 |
| — | **Q9: karyawan tidak punya akun — 12 akun staf** | §3.1, §14.2, §8.2 |
| — | **Q10: payroll dihitung dari tabel tarif berversi (TER untuk PPh 21)** | §9.1 G7, §14.2, §8.2, §7.2 |
| — | **Q11: tech lead membangun core v0; C9–C12 menyusul** | §14.3, §11.4 |
| — | **Q13: tanpa target tanggal, dikerjakan mengalir** | §14.3 |
| — | Skrip demo dihapus; §12 hanya berisi Definition of Done | §12 |

### 17.1 Konsekuensi teknis "satu repo, branch per kelompok" `[USULAN]`

| Hal | Aturan |
|---|---|
| Nama branch | `feat/pendapatan`, `feat/pengeluaran`, `feat/produksi`, `feat/payroll` |
| Branch core | `main` — hanya tech lead yang merge ke sini |
| Folder milik | satu kelompok hanya menyentuh `src/modules/<miliknya>` |
| File core | diubah lewat PR terpisah, tidak dicampur ke PR fitur |
| Migrasi | **hanya tech lead** yang menomori dan merge file migrasi |
| Seed | satu file seed bersama, diubah lewat PR |

`[ANALISIS]` Aturan migrasi itu yang paling penting. Kalau empat kelompok masing-masing membuat `supabase/migrations/0005_*.sql`, kamu akan punya empat file dengan nomor sama dan urutan yang tidak bisa ditebak. Satu-satunya cara aman: kelompok mengirim DDL sebagai usulan, tech lead yang menomori.
