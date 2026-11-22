# Design Contract: PR-006 — Biaya produksi dan HPP

- Source: `docs/product/items/PR-006-biaya-produksi-dan-hpp/01-requirement.md` (`PR-006`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-14`)
- Status: `Proposed` — belum diverifikasi. Semua aturan `Unverified`
- Profile: product app / modul internal Next.js + Supabase
- Scope: pembebanan TKL dan overhead, rework, HPP per WO, penyesuaian final, posting jurnal
- Owner: track PR-D (perilaku), Accounting (akun dan nilai), tech lead (batas core)

## Intent and non-goals

**Intent.** HPP setiap WO dapat dihitung ulang dari dokumen sumber dengan rumus yang sama, dan tidak berubah diam-diam ketika data lain berubah.

**Non-goals.** Penyelesaian overhead periode (`C-010`), penggajian (`GJ-*`), laporan efisiensi (`PR-007`), dan pengiriman barang jadi (`PD-*`).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Browser → server action | Kartu jam kerja, permintaan hitung dan posting | Parse dan validasi di server | ID WO tervalidasi; jam numerik | Tolak dengan pesan |
| `B-02` | Sesi → identitas aktor | Cookie sesi | Ambil dari sesi | `actor_id` dan peran | Tolak tanpa sesi |
| `B-03` | Core ledger → database | Jurnal | `postJournal()`, constraint, RLS | Jurnal balance dalam satu transaksi | Batalkan seluruh transaksi |
| `B-04` | Kartu jam kerja Produksi → PR-006 | Jam per karyawan per WO | Dibaca lewat service modul Produksi, bukan tabel penggajian | Total per WO | Tolak bila kartu tidak lengkap |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Hitung HPP final | WO berstatus `SELESAI` (`D-46`) | Service PR-006 | Tolak |
| `PRE-02` | Pembebanan | Tarif overhead dan tarif per jam ada untuk periode (`D-51`) | Service PR-006 | Tolak; pesan menyebut periode |
| `PRE-03` | Posting | Periode akuntansi tidak terkunci (`D-44` (5)) | Core ledger | Tolak; tidak ada baris tersimpan |
| `PRE-04` | Posting | Total debit = total kredit; akun aktif | Core ledger | Tolak |
| `PRE-05` | Posting | Aktor berperan Accounting (`D-33`) | Service PR-006 | Tolak sebelum menyentuh data |
| `PRE-06` | Pembebanan TKL | Kartu jam kerja WO ada dan belum dibebankan untuk jam itu | Service PR-006 | Tolak; pesan menyebut WO |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Pembebanan tercatat dengan komponen dan tautan sumber | Komponen sumber | Baris pembebanan, jurnal |
| `POST-02` | Jurnal diposting lewat `postJournal()` dengan debit = kredit | Saldo akun konsisten | Baris jurnal |
| `POST-03` | Total pembebanan dan penyesuaian = total HPP WO | Total | Tidak ada |
| `POST-04` | HPP WO yang sudah final tidak berubah walau BOM berubah | HPP lama | Tidak ada |
| `POST-05` | Penyesuaian final memindahkan sisa WIP WO ke `persediaan_barang_jadi` (nol bila tidak ada sisa) | Saldo WIP | Jurnal penyesuaian |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Service PR-006 | HPP unit = (bahan × harga rata + TKL + DLH × tarif + rework − reject abnormal) ÷ lulus (`EPIC-PR`) | Komponen dihitung dengan rumus lain |
| `INV-02` | Core ledger | Setiap posting balance (`ARCH-001` `INV-01`) | Jurnal tidak balance tersimpan |
| `INV-03` | Service PR-006 | Overhead memakai tarif predeterminasi; selisih hanya di tutup buku `C-010` (`D-12`, `D-44` (4)) | Overhead dari biaya aktual per WO; penyesuaian periode di `PR-006` |
| `INV-04` | Service PR-006 | HPP WO memakai versi BOM yang tersimpan di WO (`EPIC-PR` gate 4) | HPP berubah karena BOM baru |
| `INV-05` | Service PR-006 | Setiap komponen HPP menunjuk ke dokumen sumber (`EPIC-PR` gate 2) | Komponen tanpa sumber |
| `INV-06` | Service PR-006 | Pembebanan tambahan hanya untuk selisih jam dan DLH; tidak mengulang yang sudah dibukukan (`[USULAN-AGEN]`) | Pembebanan ganda untuk jam yang sama |

State HPP: tidak ada status baru di `D-46`. HPP mengikuti WO: `HASIL_DICATAT` (pembebanan), `SELESAI` (HPP final). Tidak ada transisi balik.

## Rumus

- Pembebanan TKL = Σ(jam × tarif per jam) untuk kartu jam kerja WO yang belum dibebankan (`D-44` (4)).
- Pembebanan overhead = DLH WO × tarif overhead periode (`D-12`).
- Biaya rework = bahan tambahan (harga rata) + jam rework × tarif + DLH rework × tarif overhead.
- HPP unit = (bahan + TKL + overhead + rework − reject abnormal) ÷ lulus, dengan suku sesuai `EPIC-PR`.

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Sumber TKL tidak tersedia | HPP tidak final; tidak ada angka parsial tersimpan | Tunggu sumber; ulangi |
| Posting gagal di tengah | Pembebanan dan jurnal dibatalkan bersama | Ulangi |
| Periode terkunci | Ditolak; tidak ada baris | Buka periode lewat prosedur `C-010` |
| Penyesuaian final setelah barang dikirim | Tidak mengubah unit yang sudah dikirim; koreksi lewat jurnal pembalik di periode berjalan (`D-44` (5)) | Dokumen koreksi |

## Architecture boundaries

Posting jurnal hanya lewat `core/ledger` (`ARCH-03`, `D-07`). TKL dibaca dari kartu jam kerja Produksi lewat service modul (`D-44` (4)), bukan dari penggajian. Modul tidak membaca tabel `GJ-*` (`D-25`, `ARCH-08`). Modul tidak mengimpor modul lain (`ARCH-01`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Input tidak valid tidak diproses | Uji perilaku | — | `Unverified` |
| `B-02` | `actor_id` dari klien diabaikan | Uji perilaku | — | `Unverified` |
| `B-03` | Kegagalan membatalkan seluruh transaksi | Uji database | `05-evidence.md` AC-04 | `Unverified` |
| `B-04` | Tidak ada tabel penggajian dibaca langsung | Review + pencarian | `05-evidence.md` AC-10 | `Unverified` |
| `PRE-01` | HPP final untuk WO belum `SELESAI` ditolak | Uji perilaku | `05-evidence.md` AC-05 | `Unverified` |
| `PRE-02` | Tarif tidak ada untuk periode ditolak | Uji perilaku | `05-evidence.md` AC-08 | `Unverified` |
| `PRE-03` | Periode terkunci ditolak | Uji perilaku | `05-evidence.md` AC-07 | `Unverified` |
| `PRE-04` | Jurnal tidak balance ditolak | Uji `postJournal()` | `05-evidence.md` AC-04 | `Unverified` |
| `PRE-05` | Peran selain Accounting ditolak | Uji perilaku | `05-evidence.md` AC-09 | `Unverified` |
| `PRE-06` | Kartu jam yang sudah dibebankan tidak dibebankan ulang | Uji perilaku | `05-evidence.md` AC-11 | `Unverified` |
| `POST-01` | Pembebanan dengan tautan sumber | Uji perilaku | `05-evidence.md` AC-02, AC-14 | `Unverified` |
| `POST-02` | Jurnal balance | Uji database | `05-evidence.md` AC-04 | `Unverified` |
| `POST-03` | Total pembebanan = total HPP | Uji perilaku | `05-evidence.md` AC-01 | `Unverified` |
| `POST-04` | HPP lama tidak berubah | Uji perilaku | `05-evidence.md` AC-06 | `Unverified` |
| `POST-05` | Sisa WIP nol setelah penyesuaian | Uji database | `05-evidence.md` AC-12 | `Unverified` |
| `INV-01` | Rumus sama dengan angka manual | Uji perilaku | `05-evidence.md` AC-01 | `Unverified` |
| `INV-02` | Jurnal balance | Uji `postJournal()` | `05-evidence.md` AC-04 | `Unverified` |
| `INV-03` | Overhead tidak berubah karena biaya aktual | Uji perilaku | `05-evidence.md` AC-03 | `Unverified` |
| `INV-04` | HPP tidak berubah karena BOM baru | Uji perilaku | `05-evidence.md` AC-06 | `Unverified` |
| `INV-05` | Setiap komponen punya sumber | Uji perilaku | `05-evidence.md` AC-02 | `Unverified` |
| `INV-06` | Pembebanan tambahan tidak ganda | Uji perilaku | `05-evidence.md` AC-11 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Sumber TKL (Q-01) | `Locked` untuk sumber (`D-44` (4)); lokasi kartu `Proposed` | Rumus tidak lengkap |
| Tarif per jam dan tarif overhead | `Locked` mekanisme (`D-51`, `D-12`); nilai diverifikasi | Angka HPP salah |
| DLH sama dengan jam tenaga kerja langsung (Q-02) | `Locked` (`D-12`, `D-44` (4)) | Suku overhead salah bila driver berubah |
| Penanggung jawab tarif overhead (Q-03) | `Proposed` — Accounting | Overhead tidak bisa diaudit |
| Penyesuaian overhead periode (Q-04) | `Locked` — `C-010` (`D-44` (4)) | Penyesuaian tidak punya pemilik |
| HPP sementara vs final (Q-05) | `Proposed` — `[USULAN-AGEN]` | Angka laporan tidak konsisten |
| Akun dan peran (Q-06) | `Locked` (`D-41`, `D-35`); kerugian nomor saat `FND-006` | Jurnal tidak bisa diposting |
| Komposisi biaya rework (Q-07) | `Locked` (`D-51`(e)); komposisi `Proposed` | Angka HPP salah |
| Reject abnormal (Q-08) | `Locked` (`D-51`(e)) | Kerugian salah |
| Periode posting (Q-09) | `Locked` (`D-43`, `D-44` (5)) | Periode salah bila WO lintas periode |
| Hak posting (Q-10) | `Locked` untuk Accounting (`D-33`); tanpa persetujuan terpisah `Proposed` | Hak akses salah |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| Kontrak penggajian | Milik `GJ-*`; TKL item ini berasal dari kartu jam kerja (`D-44`) |
| Status HPP "sementara" dan "final" di `D-46` | Tidak ada di sumber; HPP mengikuti status WO |
| Loop/termination | Tidak ada algoritma berulang |
