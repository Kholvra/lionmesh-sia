# Design Contract: PR-002 — Perintah produksi

- Source: `docs/product/items/PR-002-perintah-produksi/01-requirement.md` (`PR-002`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-13`)
- Status: `Proposed` — belum diverifikasi. Semua aturan `Unverified`
- Profile: product app / modul internal Next.js + Supabase
- Scope: dokumen WO, status, riwayat status, batal, nomor dokumen
- Owner: track PR-B (perilaku), tech lead (skema)

## Intent and non-goals

**Intent.** Setiap WO punya satu induk yang statusnya dan riwayatnya bisa dipertanggungjawabkan, dan tidak pernah dihapus.

**Non-goals.** Kebutuhan bahan (`PR-003`), pemakaian (`PR-004`), hasil (`PR-005`), HPP (`PR-006`), approval pengadaan, dan pesanan penjualan.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server action | Form WO: produk, target, tanggal, gudang, versi, alasan batal | Parse dan validasi di server | Nilai bertipe | Tolak dengan pesan |
| `B-02` | Sesi → identitas aktor | Cookie sesi | Ambil dari sesi | `actor_id` dan peran | Tolak tanpa sesi; jangan terima `actor_id` dari klien |
| `B-03` | Server → database | Query service PR-002 | RLS dan constraint | Baris lolos kebijakan | Tolak di database |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Membuat WO | Aktor berperan Produksi (`D-33`) | Service PR-002 | Tolak sebelum menyentuh data |
| `PRE-02` | Membuat WO | Produk punya versi BOM berlaku pada tanggal perintah (`PR-001`, `versiBerlakuPada`) | Service PR-002 | Tolak; pesan menyebut BOM |
| `PRE-03` | Membuat WO | Target qty > 0; `tgl_target_selesai` ≥ tanggal perintah | Service PR-002 | Tolak; pesan menyebut field |
| `PRE-04` | Mengubah status | Transisi ada di tabel `01-requirement.md` (`D-46` §5.3) | Service PR-002 | Tolak; status tidak berubah |
| `PRE-05` | Mengubah data WO (target, tanggal, gudang) | Status `DIRENCANAKAN` (`[USULAN-AGEN]`) | Service PR-002 | Tolak dengan pesan status |
| `PRE-06` | Membatalkan WO | Aktor berperan Produksi dan pemohon (`D-48`); alasan terisi; status ∈ {`DIRENCANAKAN`, `CEK_BAHAN`, `BAHAN_CUKUP`} (`[USULAN-AGEN]`) | Service PR-002 | Tolak; pesan sesuai `01-requirement.md` |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | WO baru punya nomor dari `core/dokumen` dan riwayat awal `DIRENCANAKAN` | Nomor unik | Baris dokumen, baris riwayat |
| `POST-02` | Perubahan status menambah tepat satu baris riwayat dan tidak mengubah baris lama | Riwayat lama | Baris riwayat baru |
| `POST-03` | Pembatalan mengubah status menjadi `DIBATALKAN` dengan alasan tersimpan, tanpa menghapus baris | Data WO | Riwayat |
| `POST-04` | Perubahan status dan riwayat terjadi dalam satu transaksi | Status dan riwayat konsisten | Tidak ada |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core dokumen | Nomor dokumen unik per tipe per periode (`INV-04` `ARCH-001`) | Dua WO dengan nomor sama |
| `INV-02` | Core dokumen | Setiap perubahan status punya baris riwayat (`INV-05` `ARCH-001`) | Status berubah tanpa riwayat |
| `INV-03` | Service PR-002 | WO tidak dihapus (`analisis-sia.md` §7.1 poin 3) | Hapus baris WO |
| `INV-04` | Service PR-002 | Versi BOM WO tidak berubah setelah dipilih (`EPIC-PR` gate 4) | Mengganti versi BOM WO |
| `INV-05` | Service PR-002 | Batal hanya dari status dalam batas `PRE-06`; tidak ada batal setelah `BAHAN_KURANG` kecuali lewat penolakan permintaan | Batal dari `BERJALAN` atau setelahnya |

State table (`D-46` §5.3 + batal `D-48`, `[USULAN-AGEN]` batas):

| State | Arti | Transisi legal |
|---|---|---|
| `DIRENCANAKAN` | WO dibuat | → `CEK_BAHAN`; → `DIBATALKAN` (`PRE-06`) |
| `CEK_BAHAN` | Ketersediaan dicek | → `BAHAN_CUKUP`, `BAHAN_KURANG`; → `DIBATALKAN` (`PRE-06`) |
| `BAHAN_CUKUP` | Stok cukup | → `BERJALAN`; → `DIBATALKAN` (`PRE-06`) |
| `BAHAN_KURANG` | Stok kurang | → `MENUNGGU_PEMBELIAN` (permintaan disetujui); → `DIBATALKAN` (permintaan ditolak) |
| `MENUNGGU_PEMBELIAN` | Menunggu bahan | → `BAHAN_SIAP` |
| `BAHAN_SIAP` | Bahan diterima | → `BERJALAN` |
| `BERJALAN` | Bahan dikeluarkan untuk WO | → `HASIL_DICATAT` |
| `HASIL_DICATAT` | Hasil dicatat | → `QC_PASSED`, `REWORK`, `REJECTED` |
| `REWORK` | Perlu perbaikan | → `HASIL_DICATAT` |
| `QC_PASSED` | Lulus QC | → `SELESAI` |
| `REJECTED` | Ditolak QC | terminal |
| `SELESAI` | Barang jadi diterima | terminal |
| `DIBATALKAN` | Dibatalkan | terminal |

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Pembuatan nomor gagal di tengah | Tidak ada WO setengah jadi | Ulangi dari form |
| Perubahan status gagal di tengah | Status dan riwayat tetap konsisten (`POST-04`) | Ulangi |
| Versi BOM berubah antara form dan simpan | Simpan memakai versi yang dipilih pada form; tidak ada versi baru yang diam-diam dipakai | Pengguna memilih ulang |

## Architecture boundaries

Nomor dokumen dan riwayat hanya lewat `core/dokumen` (`ARCH-05`, `D-08`). Modul tidak membaca tabel milik modul lain (`ARCH-08`, `D-25`). Permintaan bahan dan statusnya dimiliki `core/pengadaan` (`D-05`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Input tidak valid tidak diproses | Uji perilaku | `05-evidence.md` AC-03 | `Unverified` |
| `B-02` | `actor_id` dari klien diabaikan | Uji perilaku | — | `Unverified` |
| `B-03` | RLS menolak peran tidak sesuai | Uji database | `05-evidence.md` AC-08 | `Unverified` |
| `PRE-01` | Peran selain Produksi ditolak | Uji perilaku | `05-evidence.md` AC-08 | `Unverified` |
| `PRE-02` | Produk tanpa BOM ditolak | Uji perilaku | `05-evidence.md` AC-07 | `Unverified` |
| `PRE-03` | Target 0 atau tanggal mundur ditolak | Uji perilaku | `05-evidence.md` AC-03, AC-12 | `Unverified` |
| `PRE-04` | Transisi di luar tabel ditolak | Uji perilaku | `05-evidence.md` AC-11 | `Unverified` |
| `PRE-05` | Ubah setelah `DIRENCANAKAN` ditolak | Uji perilaku | `05-evidence.md` AC-13 | `Unverified` |
| `PRE-06` | Batal tanpa alasan atau dari status di luar batas ditolak | Uji perilaku | `05-evidence.md` AC-09, AC-10 | `Unverified` |
| `POST-01` | Nomor unik dan riwayat awal | Uji perilaku | `05-evidence.md` AC-01, AC-02 | `Unverified` |
| `POST-02` | Riwayat lama tidak berubah | Uji perilaku | `05-evidence.md` AC-04 | `Unverified` |
| `POST-03` | Batal tidak menghapus baris | Uji perilaku | `05-evidence.md` AC-05 | `Unverified` |
| `POST-04` | Status dan riwayat satu transaksi | Uji database | `05-evidence.md` AC-04 | `Unverified` |
| `INV-01` | Nomor tidak bertabrakan | Uji database | `05-evidence.md` AC-02 | `Unverified` |
| `INV-02` | Setiap perubahan ada riwayat | Uji perilaku | `05-evidence.md` AC-04 | `Unverified` |
| `INV-03` | Tidak ada hapus | Review UI dan kode | `05-evidence.md` AC-05 | `Unverified` |
| `INV-04` | Versi BOM tetap | Uji perilaku | `05-evidence.md` AC-06 | `Unverified` |
| `INV-05` | Tidak ada batal dari `BERJALAN` ke atas | Uji perilaku | `05-evidence.md` AC-10 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Nama status (`D-46` §5.3) | `Locked` | Nama berbeda antar item |
| Ikatan pesanan (Q-02) | `Proposed` — `[USULAN-AGEN]`: tidak ada | Menambah dependensi lintas siklus bila diubah |
| Batas batal dan ubah (Q-04, Q-08) | `Proposed` — `[USULAN-AGEN]` | Stok atau status tidak sesuai bila batas salah |
| Format nomor (Q-05) | `Locked` (`D-50`); kode tipe `WO` `Proposed` | Nomor tidak seragam dengan dokumen lain |
| Penegakan `INV-02` di database (trigger) atau service | `Proposed` | Menentukan tingkat jaminan |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| Kontrak stok atau jurnal | Item ini tidak mengubah stok atau uang secara langsung |
| Approval WO | Tidak ada di `D-46` |
| Loop/termination | Tidak ada algoritma berulang |
