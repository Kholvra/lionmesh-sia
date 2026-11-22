# Design Contract: PG-002 — Permintaan pembelian dari Gudang dan Produksi

- Source: `docs/product/items/PG-002-permintaan-pembelian/01-requirement.md` (`PG-002`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-15`)
- Status: `Proposed` — belum diverifikasi; semua aturan `Unverified`
- Profile: product app (dokumen dengan status)
- Scope: pengajuan permintaan pembelian, nomor dokumen, riwayat, revisi sukarela, pengembalian, dan pembatalan oleh pemohon
- Owner: pemilik track PG-B (belum ditetapkan)

## Intent and non-goals

**Intent.** Setiap kebutuhan pembelian masuk sebagai satu dokumen yang punya nomor unik, pengaju yang tercatat dari sesi, dan riwayat status yang tidak bisa diubah diam-diam. Permintaan yang sudah tidak diperlukan dibatalkan dengan alasan, bukan dihapus.

**Non-goals.** Aturan status final (milik `C-013`, mengikuti `D-46`), approval (`PG-003`), pemilihan pemasok (`PG-004`), PO (`PG-005`), dan perintah produksi.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser ke server action | baris barang, keterangan, alasan batal dari form | parse dan validasi skema sebelum core | baris tervalidasi bertipe | tolak dengan pesan; jangan teruskan |
| `B-02` | Sesi ke identitas pengaju | cookie sesi | ambil pengguna dan peran dari sesi (`ARCH-001` BOUNDARY-02) | `actor_id` dan peran tepercaya | tolak bila tidak ada sesi; abaikan `actor_id` dari klien |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Permintaan diajukan | pengaju berperan Gudang atau Produksi (`D-33`) | server action | tolak sebelum core |
| `PRE-02` | Baris barang disimpan | produk dan satuan ada di master `C-011` dan aktif (`D-38`, `D-50`) | service core | tolak dengan pesan |
| `PRE-03` | Baris barang disimpan | qty lebih dari 0 `[USULAN]` | service core | tolak dengan pesan |
| `PRE-04` | Permintaan dibatalkan | pengguna adalah pemohon; alasan terisi; status salah satu dari `DIAJUKAN`, `REVISI`, `MENUNGGU_PERSETUJUAN`, `DISETUJUI`, `PEMASOK_DITETAPKAN` (`D-48`, `[USULAN-AGEN]`) | service core | tolak dengan pesan; status tidak berubah |
| `PRE-05` | Permintaan direvisi sukarela | pengguna adalah pemohon; status `MENUNGGU_PERSETUJUAN` atau `DISETUJUI` (`D-48`, `[USULAN-AGEN]`) | service core | tolak dengan pesan; status tidak berubah |
| `PRE-06` | Permintaan diubah baris atau keterangannya | status `DIAJUKAN` atau `REVISI`, dan pengguna adalah pemohon | service core | tolak dengan pesan |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | permintaan tersimpan dengan nomor unik dari `core/dokumen` (`D-50`) | dokumen lain | nomor terpakai |
| `POST-02` | permintaan memiliki baris riwayat pertama dengan aktor dan waktu (`ARCH-001` POST-03) | riwayat lama | baris riwayat |
| `POST-03` | status awal `DIAJUKAN` (`D-46`) | aturan status | tidak ada |
| `POST-04` | pembatalan menulis satu baris riwayat dengan alasan, aktor, dan waktu (`D-48`, `D-08`) | riwayat lama, baris barang | baris riwayat |
| `POST-05` | revisi sukarela dari `MENUNGGU_PERSETUJUAN` atau `DISETUJUI` menulis baris riwayat dan menggugurkan approval yang ada (`D-48`) | riwayat lama, baris barang | baris riwayat; approval ditandai gugur |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | modul Pengeluaran | pengajuan tidak memanggil mutasi stok atau jurnal `[ANALISIS]` | mutasi stok atau baris jurnal dari PR |
| `INV-02` | core dokumen | dokumen tidak dihapus; pembatalan hanya mengubah status (`D-48`) | hapus baris permintaan |
| `INV-03` | core dokumen | nomor permintaan tidak dipakai ulang (`D-50`) | dua permintaan bernomor sama (`ARCH-001` INV-04) |
| `INV-04` | core pengadaan | permintaan yang ditolak atau dibatalkan tidak bisa menjadi PO (`analisis-sia.md` §8.1) | PO dari PR berstatus `DITOLAK` atau `DIBATALKAN` (ditegakkan di `PG-005`) |
| `INV-05` | core pengadaan | `DITOLAK` dan `DIBATALKAN` bersifat final | perubahan status dari keduanya |
| `INV-06` | core pengadaan | revisi dari `MENUNGGU_PERSETUJUAN` atau `DISETUJUI` menggugurkan approval; approval diulang dari awal (`D-48`) `[USULAN-AGEN]` | approval lama masih berlaku setelah revisi |
| `INV-07` | core pengadaan | pembatalan hanya sebelum PO terbit (status `DITERBITKAN` atau lebih lanjut tidak bisa dibatalkan) `[USULAN-AGEN]` | permintaan dibatalkan setelah PO terbit |

Transisi status (`D-46`, `diagram-sia-lengkap.md` §5.2; `D-48` dan `[USULAN-AGEN]` ditandai):

| Dari | Ke | Pemicu | Siapa |
|---|---|---|---|
| (awal) | `DIAJUKAN` | pengajuan | Gudang, Produksi |
| `DIAJUKAN` | `REVISI` | dikembalikan | Purchasing |
| `REVISI` | `DIAJUKAN` | diajukan ulang | pemohon |
| `DIAJUKAN` | `MENUNGGU_PERSETUJUAN` | diperiksa dan diteruskan | Purchasing |
| `DIAJUKAN`, `REVISI`, `MENUNGGU_PERSETUJUAN`, `DISETUJUI`, `PEMASOK_DITETAPKAN` | `DIBATALKAN` | dibatalkan dengan alasan (`D-48`) `[USULAN-AGEN]` untuk daftar status | pemohon |
| `MENUNGGU_PERSETUJUAN`, `DISETUJUI` | `DIAJUKAN` | revisi sukarela, approval gugur (`D-48`) `[USULAN-AGEN]` | pemohon |

Tidak ada `DRAFT` dan `DIPERIKSA` pada permintaan (`D-46`). Nama akhir tetap spec.

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Penyimpanan gagal di tengah | tidak ada permintaan setengah tersimpan | ulangi pengajuan |
| Nomor bertabrakan | core menolak; tidak ada dua nomor sama (`ARCH-001` INV-04) | ulangi pengajuan |
| Pengembalian, pembatalan, atau revisi gagal menulis riwayat | status tidak berubah | ulangi aksi |
| Dua aksi bersamaan pada permintaan yang sama | hanya satu yang berlaku; lainnya ditolak dengan pesan untuk memuat ulang | muat ulang permintaan |

## Architecture boundaries

| ID | Rule | Sumber | Catatan |
|---|---|---|---|
| `ARCH-06` | tabel dan aturan pengadaan berada di `core/pengadaan` | `D-05` | item ini hanya memanggil service `C-013` |
| `ARCH-05` | nomor dan riwayat dokumen melalui `core/dokumen` | `D-08`, `D-50` | item ini tidak menghitung nomor sendiri |
| `ARCH-08` | modul tidak membaca tabel milik modul lain | `D-25` | produk dan satuan lewat service `C-011` |
| `ARCH-09` | peran mengikuti 12 akun staf; izin pengajuan sesuai matriks v0 | `D-18`, `D-33` | Q-10 terjawab |

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | input tidak valid ditolak | uji perilaku | `05-evidence.md` AC-02, AC-03 | `Unverified` |
| `B-02` | pengaju dari sesi | uji perilaku | `05-evidence.md` AC-05 | `Unverified` |
| `PRE-01` | peran tidak diizinkan ditolak | uji perilaku | `05-evidence.md` AC-08 | `Unverified` |
| `PRE-02` | produk nonaktif atau tidak ada ditolak | uji perilaku | `05-evidence.md` AC-01, edge case | `Unverified` |
| `PRE-03` | qty nol ditolak | uji perilaku | `05-evidence.md` AC-03 | `Unverified` |
| `PRE-04` | pembatalan tanpa alasan atau bukan pemohon ditolak | uji perilaku | `05-evidence.md` AC-07, AC-11, AC-12 | `Unverified` |
| `PRE-05` | revisi sukarela hanya dari `MENUNGGU_PERSETUJUAN` atau `DISETUJUI` | uji perilaku | `05-evidence.md` AC-13 | `Unverified` |
| `PRE-06` | edit baris hanya saat `DIAJUKAN` atau `REVISI` | uji perilaku | `05-evidence.md` AC-06 | `Unverified` |
| `POST-01` | nomor unik sesuai format | uji perilaku | `05-evidence.md` AC-09 | `Unverified` |
| `POST-02` | riwayat awal | uji perilaku | `05-evidence.md` AC-06 | `Unverified` |
| `POST-03` | status awal `DIAJUKAN` | uji perilaku | `05-evidence.md` AC-01 | `Unverified` |
| `POST-04` | pembatalan menulis riwayat dengan alasan | uji perilaku | `05-evidence.md` AC-07 | `Unverified` |
| `POST-05` | revisi menulis riwayat dan menggugurkan approval | uji perilaku | `05-evidence.md` AC-13; `PG-003` AC-11 | `Unverified` |
| `INV-01` | tidak ada mutasi atau jurnal | pencarian kode dan review | — | `Unverified` |
| `INV-02` | tidak ada hapus permanen | pencarian kode | — | `Unverified` |
| `INV-04` | PR ditolak atau dibatalkan tidak jadi PO | uji lintas item (`PG-005`) | `05-evidence.md` AC-15; `PG-005` AC-03 | `Unverified` |
| `INV-05` | status final tidak berubah | uji perilaku | `05-evidence.md` AC-14 | `Unverified` |
| `INV-06` | approval gugur saat revisi | uji lintas item (`PG-003`) | `PG-003` AC-11 | `Unverified` |
| `INV-07` | pembatalan setelah PO ditolak | uji lintas item (`PG-005`) | `05-evidence.md` AC-15 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Daftar status (Q-01) | Terjawab — `D-46`. Nama akhir: spec | POST-03 dan transisi |
| `C-011` di `depends on` (Q-02) | Terjawab — sudah ada di `backlog.md`; `D-38` | PRE-02 |
| Dependensi `PG-001` (Q-03) | Terjawab — `[USULAN-AGEN]` (dipertahankan sesuai backlog) | jadwal, bukan perilaku |
| Referensi produksi (Q-04) | Terjawab — `[USULAN-AGEN]` (opsional, tanpa validasi sampai `PR-002`) | kolom dan alur Produksi |
| Nilai PR (Q-05) | Terjawab — `[USULAN-AGEN]` (diisi Purchasing saat pemeriksaan) | `PG-003` ambang |
| Prioritas (Q-06) | Terjawab — `[USULAN-AGEN]` (tidak ada di v0) | - |
| Pembatalan (Q-07) | Terjawab — `D-48` (aturan) dan `[USULAN-AGEN]` (daftar status asal, `DIBATALKAN`) | PRE-04, AC-07, INV-07 |
| Revisi sukarela (Q-08) | Terjawab — `D-48` dan `[USULAN-AGEN]` (kembali ke `DIAJUKAN`) | PRE-05, INV-06, AC-13 |
| Gudang tujuan (Q-09) | Terjawab — `D-52` (tampil bila lebih dari satu gudang) | kolom PR |
| Izin pengaju (Q-10) | Terjawab — `D-33` | PRE-01 |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| Approval | milik `PG-003` |
| Loop/termination | tidak ada algoritma berulang |
| Batas modul | milik `ARCH-001` |
