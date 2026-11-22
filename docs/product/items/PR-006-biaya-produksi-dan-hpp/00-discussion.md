# PR-006 — Diskusi

## Sumber permintaan

Baris backlog: `PR-006` — Biaya produksi & HPP, track PR-D biaya, level 6, depends on `PR-004`, `PR-005`, `FND-006`. Blocks `PR-007`.

Fitur analisis: `PR-6` — "bahan + TKL + overhead → HPP" (`analisis-sia.md` §5.4, use case `PR13`, P1).

## Konteks

HPP per WO adalah tujuan utama Produksi di sisi uang. `EPIC-PR` mengunci rumus berikut:

```text
HPP unit = (bahan × harga_rata)
         + TKL
         + (DLH × tarif_overhead)
         + biaya rework
         − reject abnormal
```

Keputusan yang mengikat:

| ID | Isi | Dampak |
|---|---|---|
| `D-10` | Bahan dinilai rata-rata bergerak | suku `bahan × harga_rata` |
| `D-11` | BOM satu level, berversi | bahan per unit dari versi WO |
| `D-12` | Overhead dari tarif predeterminasi; selisih disesuaikan akhir periode; kapasitas normal | suku `DLH × tarif_overhead` |
| `D-13` | Reject ≤ toleransi diserap; di atasnya kerugian. Rework masuk HPP | suku rework dan reject abnormal |
| `D-07`, `D-43` | Jurnal hanya lewat `postJournal()`; langsung diposting; koreksi lewat jurnal pembalik | posting HPP |
| `D-25` | Data lintas siklus lewat service core | TKL dibaca lewat service atau modul yang berwenang, bukan tabel penggajian |
| `D-33` | Matriks izin v0 | "Catat biaya produksi" = Accounting |
| `D-35` | Akun dipanggil lewat peran | peran `tenaga_kerja_langsung`, `overhead_pabrik`, `barang_dalam_proses`, `persediaan_barang_jadi`, `hpp`, `kerugian_produksi_abnormal` |
| `D-41` | COA dasar: 120, 121, 122, 501, 601, 602 bernomor; akun kerugian menunggu `FND-006` | nomor di konfigurasi, bukan di modul |
| `D-44` | Saat pengakuan: TKL dibebankan ke perintah produksi dari kartu jam kerja di Produksi (jam × tarif per jam), bukan dari data payroll; sisa diselesaikan saat tutup buku | sumber TKL per WO; penyelesaian sisa di `C-010` |
| `D-51` (e) | Rework = biaya tambahan nyata ke WO yang sama; reject abnormal = biaya terserap per unit | rumus rework dan reject abnormal |

## Aktor / consumer

- **Accounting** — mencatat biaya produksi (`D-33`).
- **Produksi** — melihat HPP WO dan mengisi kartu jam kerja per WO.
- **Sistem** — menghitung pembebanan dan memposting jurnal.

## Masalah

Tanpa HPP, Produksi mengarang angka atau tidak punya angka sama sekali (`analisis-sia.md` §9.4 poin 1). Gap `G1`, `G2`, `G3` menumpuk di item ini. Dua di antaranya sudah dikunci (`D-10`, `D-11`). Sumber TKL dikunci `D-44`; sumber DLH dan tarif dikunci `D-12` dan `D-51`.

## Desired outcome

Ketika WO selesai, sistem menghitung HPP per unit dan total dengan rumus di atas. Setiap komponen bisa ditelusuri ke dokumen sumber. Jurnal HPP diposting dan balance.

## Known constraints

- Rumus di atas mengikat (`EPIC-PR`).
- Perubahan BOM tidak mengubah HPP WO lama (`EPIC-PR` gate 4).
- HPP harus bisa ditelusuri ke dokumen sumber (`EPIC-PR` gate 2).
- Tutup buku mengunci jurnal, bukan dokumen (`D-43`, `D-44` (5)).

## Open questions

Klasifikasi: `Terjawab — D-xx`, `Terjawab — [USULAN-AGEN]`, `Terjawab — sumber`. Tidak ada pertanyaan `Terbuka`.

| ID | Question | Why it matters | Owner | Status |
|---|---|---|---|---|
| Q-01 | Sumber TKL per WO dan lokasi kartu jam kerja. Apakah `PR-006` membaca tabel penggajian? | Tanpa sumber TKL, rumus tidak lengkap. Membaca penggajian melanggar `D-25`. | Tech lead / user | **Terjawab — D-44 (4)**: TKL = kartu jam kerja Produksi × tarif per jam, bukan data payroll. Tarif per jam berversi, nilainya di konfigurasi: **Terjawab — D-51**: mekanisme berversi; nilai diverifikasi saat implementasi. **Terjawab — [USULAN-AGEN]** untuk lokasi: kartu jam kerja adalah data modul Produksi (tabel per WO, satu baris per karyawan per tanggal, dengan jam). `PR-006` membacanya lewat service modul Produksi, tidak lewat tabel penggajian. Alasan: hanya dipakai siklus Produksi; `D-25` melarang akses tabel lintas modul. |
| Q-02 | Sumber DLH per WO. | Tanpa DLH, suku overhead tidak bisa dihitung. | User / tech lead | **Terjawab — D-12 dan D-44 (4)**: DLH = total jam kerja tenaga kerja langsung per WO dari kartu jam kerja. Jam mesin tidak dipakai sebagai driver (`D-12`). |
| Q-03 | Tarif overhead: siapa menetapkan pool anggaran, kapasitas normal, dan periodenya? | Tarif adalah input rumus. Tanpa penanggung jawab, tidak bisa diaudit. | User | **Terjawab — D-12 dan D-51**: tarif predeterminasi dengan kapasitas normal, berversi per periode; nilai diverifikasi saat implementasi. **Terjawab — [USULAN-AGEN]** untuk penanggung jawab: Accounting menetapkan tarif per periode; nilainya disimpan sebagai konfigurasi berversi dan di-seed tech lead sesuai matriks ("kelola konfigurasi"). Alasan: "Catat biaya produksi" = Accounting (`D-33`). |
| Q-04 | Selisih overhead di akhir periode: dikerjakan di `PR-006` atau tutup buku `C-010`? | Menentukan pemilik penyesuaian. | Tech lead | **Terjawab — D-44 (4)**: sisa diselesaikan saat tutup buku, yaitu `C-010`. `PR-006` tidak memuat penyesuaian periode. |
| Q-05 | HPP sementara vs final: kapan dihitung dan dibukukan? | Menentukan jurnal dan angka laporan. | User | **Terjawab — [USULAN-AGEN]** (dengan `D-43`, tanpa draft): dua posting, bukan draft. (1) Pembebanan TKL dan overhead dibukukan saat WO mencapai `HASIL_DICATAT` dan ulang untuk jam tambahan saat rework; (2) HPP sementara dibukukan saat barang jadi diterima (`PR-005`, Q-07); (3) HPP final dihitung saat WO `SELESAI`; selisih sisa dibukukan sebagai penyesuaian. Alasan: sesuai urutan `PR-005` dan `D-43`. |
| Q-06 | Akun COA: rework, kerugian produksi, dan komponen lain. | Tanpa kode akun, jurnal tidak bisa diposting. | Accounting / user | **Terjawab — D-41 dan D-51(e)**: bahan, WIP, barang jadi, HPP, TKL, dan overhead bernomor di `D-41`. Rework tidak punya akun terpisah: dibebankan ke `barang_dalam_proses` WO yang sama (`D-51`(e)). Kerugian abnormal memakai peran `kerugian_produksi_abnormal` (nomor saat `FND-006`). |
| Q-07 | Biaya rework dihitung dari apa? | `D-13` hanya menetapkan rework masuk HPP. | User | **Terjawab — D-51 (e)**: biaya tambahan nyata yang dibebankan ke WO yang sama. **Terjawab — [USULAN-AGEN]** untuk komposisi: bahan tambahan (dari `PR-004` pada status `REWORK`) + jam kerja rework × tarif per jam + DLH rework × tarif overhead. Alasan: hanya biaya yang benar-benar keluar; mengikuti rumus `D-12`. |
| Q-08 | Nilai reject abnormal: dihitung dengan apa? | Menentukan jumlah kerugian. | User | **Terjawab — D-51 (e)**: reject abnormal = reject di atas toleransi × biaya terserap per unit pada WO itu. Dihitung dan dibukukan oleh `PR-005` saat keputusan QC; `PR-006` menampilkannya sebagai pengurang di rumus HPP. |
| Q-09 | HPP per periode akuntansi, sementara WO bisa lintas periode. | Menentukan periode posting. | User | **Terjawab — D-43 dan D-44 (5)**: jurnal lahir per transaksi; periode posting = tanggal transaksi; periode tertutup menolak transaksi baru; koreksi lewat jurnal pembalik di periode berjalan. WIP WO lintas periode tetap di `barang_dalam_proses` sampai selesai. |
| Q-10 | Siapa yang boleh memposting dan menyetujui HPP. | Hak akses dan jejak. | User | **Terjawab — D-33 dan [USULAN-AGEN]**: Accounting mencatat dan memposting; tidak ada persetujuan HPP terpisah, karena matriks v0 tidak memuat baris itu. Alasan: `D-43` menetapkan jurnal langsung diposting. |
| Q-11 | Prioritas dan ukuran. | Lihat `PR-001/00-discussion.md`. | Tim | **Terjawab — D-50**: prioritas P1 (analisis §5.4). Ukuran **[USULAN-AGEN]** L, dengan risiko tercatat di `03-readiness-review.md`; tidak dipecah pada tahap ini. |

## Rumus pembebanan (`[USULAN-AGEN]`)

| Komponen | Sumber | Dibebankan pada |
|---|---|---|
| TKL | jam kerja WO × tarif per jam (`D-44`) | saat `HASIL_DICATAT` (dan ulang untuk jam tambahan) |
| Overhead | DLH WO × tarif overhead periode (`D-12`) | saat `HASIL_DICATAT` (dan ulang untuk DLH tambahan) |
| Rework | bahan tambahan + jam rework × tarif + DLH rework × tarif overhead | saat rework dicatat |
| Reject abnormal | `PR-005` Q-07 dan `D-51`(e) | saat keputusan QC |

## Decisions

| ID | Decision | Date | Owner | Consequence |
|---|---|---|---|---|
| `D-12` | Overhead dari tarif predeterminasi | 2026-11-22 | Keputusan pengguna | Metode overhead dan driver DLH (Q-02, Q-03) |
| `D-33` | Matriks izin v0 | 2026-11-22 | Keputusan pengguna | Menjawab Q-10 |
| `D-41` | COA dasar | 2026-11-22 | Keputusan pengguna | Akun rework tidak dibuat (Q-06) |
| `D-43` | Aturan jurnal | 2026-11-22 | Keputusan pengguna | Tanpa draft (Q-05) |
| `D-44` | Saat pengakuan | 2026-11-22 | Keputusan pengguna | Sumber TKL (Q-01), penyelesaian sisa di `C-010` (Q-04), periode (Q-09) |
| `D-51` | Parameter dan rumus (e) | 2026-11-22 | Keputusan pengguna | Tarif, rework, reject abnormal (Q-01, Q-07, Q-08) |

Keputusan di atas berlaku lintas item. Item ini tidak punya keputusan sendiri.

## Assumptions (agent-proposed)

- `[USULAN-AGEN]` HPP final dihitung saat WO `SELESAI`.
- `[USULAN-AGEN]` Penyesuaian final setelah barang jadi diterima dibukukan ke `persediaan_barang_jadi` dan hanya memengaruhi unit yang belum dikirim; unit yang sudah dikirim dikoreksi lewat jurnal pembalik di periode berjalan (`D-44` (5)).

## Pertentangan sumber dan keputusan

| Sumber | Isi | Keputusan terkunci | Tindakan |
|---|---|---|---|
| `proses-bisnis.md` B4, `siklus-produksi-lmsh.md` FR-05 (catatan [USULAN]) | Overhead per "jam mesin atau tonase output" | `D-12`: DLH × tarif predeterminasi | `D-12` menang. Driver jam mesin dicatat sebagai pertentangan untuk koordinator. |
| `proses-bisnis.md` B2 dan `siklus-produksi-lmsh.md` §Penilaian (catatan [USULAN]) | Nilai bahan FIFO | `D-10` | `D-10` menang. |
| `proses-bisnis.md` §9 (catatan [USULAN]) | "Penyelesaian selisih 601 dan 602: akhir bulan" | `D-44 (4)`: "saat tutup buku" | `D-44` menang; penyelesaian di `C-010`. |
| Item `PR-006` lama dan backlog/EPIC lama: TKL "dari penggajian" | sumber TKL dari modul penggajian | `D-44 (4)`: kartu jam kerja Produksi | `D-44` menang. |
| `D-44` (4) (kartu jam kerja Produksi) dan `D-53` / `GJ-002` (presensi karyawan) | Dua sumber jam kerja | Keduanya terkunci; hubungannya tidak dijelaskan | Dicatat untuk koordinator. Default: kartu jam kerja per WO terpisah dari presensi, tidak diambil dari presensi. |

## Rejected alternatives

- **HPP ditulis manual oleh Accounting.** Ditolak: `analisis-sia.md` §9.4 poin 1 dan rumus mengikat.
- **Overhead dari biaya aktual per WO.** Ditolak: `D-12`.
- **Modul Produksi menulis jurnal sendiri.** Ditolak: `D-07`.
- **TKL dari data payroll.** Ditolak: `D-44 (4)`.

## Prioritas dan ukuran

- Prioritas: P1 (`analisis-sia.md` §5.4, `PR-6`), mengikuti `D-50`.
- Ukuran: `[USULAN-AGEN]` L. Empat suku rumus, kartu jam kerja, tarif, jurnal, dan penyesuaian periode. Tidak dipecah pada tahap ini; risiko dicatat.

## Next step

Tidak ada pertanyaan terbuka. Item boleh naik ke `ready` begitu `PR-004`, `PR-005`, dan `FND-006` berstatus `done`.
