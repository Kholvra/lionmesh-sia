# Design Contract: PG-005 — Purchase order dari permintaan yang disetujui

- Source: `docs/product/items/PG-005-purchase-order/01-requirement.md` (`PG-005`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-15`)
- Status: `Proposed` — belum diverifikasi; semua aturan `Unverified`
- Profile: product app (dokumen komitmen dengan PPN)
- Scope: penerbitan PO, perhitungan PPN per baris, status PO, larangan edit setelah terbit, pembatalan sebelum penerimaan, dan larangan efek ke stok dan utang
- Owner: pemilik track PG-B (belum ditetapkan)

## Intent and non-goals

**Intent.** PO hanya menjadi komitmen. Ia tidak menaikkan stok, tidak membuat jurnal, dan tidak menaikkan utang. Setiap PO berasal dari permintaan yang sah dengan pemasok yang sudah ditetapkan, dan PO yang sudah terbit tidak berubah diam-diam.

**Non-goals.** Penerimaan (`PG-006`), QC (`PG-007`), faktur dan utang (`PG-008`), pembayaran (`PG-009`), kirim otomatis ke pemasok, dan portal pemasok.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser ke server action | baris PO, qty, harga, alasan batal | parse dan validasi skema | baris tervalidasi bertipe | tolak dengan pesan |
| `B-02` | Sesi ke identitas penerbit | cookie sesi | ambil pengguna dan peran dari sesi (`ARCH-001` BOUNDARY-02) | `actor_id` dan peran tepercaya | tolak bila tidak ada sesi |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | PO diterbitkan | permintaan berstatus `PEMASOK_DITETAPKAN` (`PG-004`) dan pengguna berperan Purchasing (`D-33`) | service core | tolak sebelum membuat PO |
| `PRE-02` | PO diterbitkan | permintaan tidak berstatus `DITOLAK` atau `DIBATALKAN` (`analisis-sia.md` §8.1, `D-48`) | service core | tolak dengan pesan |
| `PRE-03` | PO diterbitkan | PO punya minimal satu baris dengan qty lebih dari 0 `[USULAN]` | service core | tolak dengan pesan |
| `PRE-04` | PO dihitung | tarif PPN diambil dari `konfigurasi_pajak` yang berlaku pada tanggal PO (`D-17`, `D-51`(a)). Tarif diisi tech lead lewat seed (`D-33`) | service core | tolak bila tarif tidak ditemukan |
| `PRE-05` | PO diubah setelah `DITERBITKAN` | tidak diizinkan (`D-48`) `[USULAN-AGEN]` (Q-06) | service core | tolak dengan pesan |
| `PRE-06` | PO dibatalkan | pengguna Purchasing; alasan terisi; status `DITERBITKAN`; belum ada penerimaan pertama `[USULAN-AGEN]` (Q-05) | service core | tolak dengan pesan; status tidak berubah |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | PO tersimpan dengan nomor unik dari `core/dokumen` (`D-50`) dan status `DITERBITKAN` | dokumen lain | nomor terpakai, baris riwayat |
| `POST-02` | total PO = jumlah baris + PPN per baris dengan tarif yang berlaku, dalam IDR (`D-17`, `D-38`) | harga net | tidak ada |
| `POST-03` | status permintaan berpindah `PEMASOK_DITETAPKAN → DITERBITKAN` (`D-46`) | status lain | baris riwayat |
| `POST-04` | pembatalan menulis riwayat untuk PO dan permintaan dengan alasan (`D-48`) `[USULAN-AGEN]` | riwayat lama | baris riwayat |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | modul Pengeluaran | penerbitan PO tidak memanggil mutasi stok `[ANALISIS]` | mutasi stok dari PO (`analisis-sia.md` §6.4) |
| `INV-02` | core ledger | PO tidak memanggil `postJournal()` (`D-07`) | jurnal dari PO |
| `INV-03` | core pengadaan | PO tidak mengubah saldo utang | kenaikan utang dari PO (`analisis-sia.md` §6.4) |
| `INV-04` | core dokumen | PO yang sudah diterbitkan tidak diubah (`D-48`, G15) | perubahan qty atau harga pada PO `DITERBITKAN` |
| `INV-05` | core dokumen | PO tidak dihapus; pembatalan hanya mengubah status (`D-48`) | hapus baris PO |
| `INV-06` | core pengadaan | permintaan `DITOLAK` atau `DIBATALKAN` tidak menjadi PO (`analisis-sia.md` §8.1) | PO dari permintaan `DITOLAK` atau `DIBATALKAN` |
| `INV-07` | core pengadaan | status tidak mundur: PO `DIBATALKAN` tidak kembali ke `PEMASOK_DITETAPKAN` (`D-48`) `[USULAN-AGEN]` | perubahan status mundur |
| `INV-08` | core pengadaan | PO tidak bisa dibatalkan setelah penerimaan pertama (`D-48`) `[USULAN-AGEN]` | pembatalan PO dengan status `DITERIMA_SEBAGIAN` atau lebih lanjut |

Transisi status PO dan permintaan (`D-46`, `diagram-sia-lengkap.md` §5.2; `D-48` ditandai):

| Dari | Ke | Pemicu |
|---|---|---|
| `PEMASOK_DITETAPKAN` | `DITERBITKAN` | PO diterbitkan oleh Purchasing |
| `DITERBITKAN` | `DIBATALKAN` (PO dan permintaan) | pembatalan Purchasing dengan alasan, sebelum penerimaan pertama `[USULAN-AGEN]` |
| `DITERBITKAN` | `DITERIMA_SEBAGIAN` / `DITERIMA` | penerimaan barang (`PG-006`, di luar item ini) |

Tidak ada status "dikirim" atau "dikonfirmasi" (`D-46`). Kanal kirim dan konfirmasi di luar state machine (`[USULAN-AGEN]` Q-01, Q-02).

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Penerbitan gagal di tengah | tidak ada PO setengah jadi, dan tidak ada nomor terbakar tanpa dokumen | ulangi penerbitan |
| Tarif PPN tidak ditemukan | penerbitan ditolak | isi `konfigurasi_pajak` (seed) |
| Pembatalan gagal menulis riwayat | status PO dan permintaan tidak berubah | ulangi pembatalan |
| Kirim ke pemasok gagal (di luar sistem) | status PO tidak berubah | ulangi pengiriman di luar sistem |

## Architecture boundaries

| ID | Rule | Sumber | Catatan |
|---|---|---|---|
| `ARCH-06` | tabel PO di `core/pengadaan` | `D-05` | layar PO milik track PG-B |
| `ARCH-03` | jurnal hanya lewat `core/ledger` | `D-07` | PO tidak menulis jurnal |
| `ARCH-05` | nomor dan riwayat dokumen lewat `core/dokumen` | `D-08`, `D-50` | item ini tidak menghitung nomor sendiri |
| `ARCH-08` | modul tidak membaca tabel modul lain | `D-25` | pemasok dan harga lewat service core |
| `ARCH-09` | peran mengikuti 12 akun staf; penerbitan dan pembatalan PO oleh Purchasing | `D-18`, `D-33`, `D-48` | Q-01 terjawab sebagian |

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `PRE-01` | PO tanpa penetapan ditolak | uji perilaku | `05-evidence.md` AC-04 | `Unverified` |
| `PRE-02` | PO dari permintaan ditolak atau dibatalkan ditolak | uji perilaku | `05-evidence.md` AC-03, AC-13 | `Unverified` |
| `PRE-03` | PO tanpa baris ditolak | uji perilaku | `05-evidence.md` AC-05 | `Unverified` |
| `PRE-04` | tarif tidak ditemukan ditolak; tarif berversi dipilih per tanggal | uji perilaku (seed uji) | `05-evidence.md` AC-02 | `Unverified` |
| `PRE-05` | PO terbit tidak diedit | uji perilaku | `05-evidence.md` AC-08 | `Unverified` |
| `PRE-06` | pembatalan tanpa alasan atau setelah penerimaan ditolak | uji perilaku | `05-evidence.md` AC-12, AC-14 | `Unverified` |
| `POST-01` | nomor unik dan status | uji perilaku | `05-evidence.md` AC-01 | `Unverified` |
| `POST-02` | total dengan PPN per baris | uji perilaku | `05-evidence.md` AC-02 | `Unverified` |
| `POST-03` | status permintaan | uji perilaku | `05-evidence.md` AC-01 | `Unverified` |
| `POST-04` | pembatalan menulis riwayat dengan alasan | uji perilaku | `05-evidence.md` AC-10 | `Unverified` |
| `INV-01` | stok tidak berubah | uji perilaku | `05-evidence.md` AC-06 | `Unverified` |
| `INV-02` | tidak ada jurnal | uji perilaku dan pencarian kode | `05-evidence.md` AC-07 | `Unverified` |
| `INV-03` | utang tidak berubah | uji perilaku | `05-evidence.md` AC-07 | `Unverified` |
| `INV-04` | PO terbit tidak diubah | uji perilaku | `05-evidence.md` AC-08 | `Unverified` |
| `INV-05` | tidak ada hapus baris PO | pencarian kode dan uji perilaku | `05-evidence.md` AC-10 | `Unverified` |
| `INV-06` | PO dari permintaan ditolak atau dibatalkan ditolak | uji perilaku | `05-evidence.md` AC-03, AC-13 | `Unverified` |
| `INV-07` | status tidak mundur | uji perilaku | `05-evidence.md` AC-10, AC-13 | `Unverified` |
| `INV-08` | pembatalan setelah penerimaan ditolak | uji lintas item (`PG-006`) | `05-evidence.md` AC-14 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Kanal pengiriman (Q-01) | Terjawab — `[USULAN-AGEN]` (di luar sistem; tanpa status kirim) | AC-09 |
| Bukti konfirmasi (Q-02) | Terjawab — `[USULAN-AGEN]` (catatan teks dengan tanggal) | AC-09 |
| Jumlah PO per permintaan (Q-03) | Terjawab — `[USULAN-AGEN]` (satu PO per permintaan) | PRE-01 |
| Status lanjutan (Q-04) | Terjawab — `D-46` | transisi |
| Pembatalan (Q-05) | Terjawab — `D-48` dan `[USULAN-AGEN]` (sebelum penerimaan pertama; permintaan ikut batal) | transisi, PRE-06, AC-10, AC-14 |
| Perubahan setelah terbit (Q-06) | Terjawab — `D-48` dan `[USULAN-AGEN]` (tidak diedit; koreksi lewat pembatalan atau jurnal pembalik) | PRE-05 dan INV-04 |
| Akun PPN masukan (Q-07) | Terjawab — `D-35` (peran), `D-41` (nomor saat `FND-006`) | `PG-008` |
| Termin di PO (Q-08) | Terjawab — `D-14` (termin tidak di PO) | - |
| Mata uang (Q-09) | Terjawab — `D-38` (IDR) | POST-02 |
| Format nomor PO (Q-10) | Terjawab — `D-50` | POST-01 |
| Tabel dan layar `konfigurasi_pajak` (Q-11) | Terjawab — `D-33`, `D-51`(a), `D-31` (seed uji; layar tidak diperlukan) | PRE-04 dan AC-02 |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| State machine generik | milik `C-013` |
| Status `DIKIRIM` atau `DIKONFIRMASI` | `D-46` tidak memuatnya |
| Loop/termination | tidak ada algoritma berulang |
| Batas modul | milik `ARCH-001` |
