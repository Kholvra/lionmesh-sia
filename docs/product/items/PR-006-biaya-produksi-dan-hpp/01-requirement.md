---
id: PR-006
slug: biaya-produksi-dan-hpp
title: Biaya produksi dan HPP
epic: EPIC-PR
milestone: M1
lane: active
sequence: unset # topologi hybrid (backlog.md), bukan urutan strict
type: feature
req_status: specified
delivery_status: not_started
priority: P1 # D-50: mengikuti P1 analisis §5.4
size: L # D-50: usulan paket; risiko dicatat, tidak dipecah
depends_on:
  - FND-006
  - PR-004
  - PR-005
blocks:
  - PR-007
owner_role: kelompok Produksi # pemilik track: D-50
package: docs/product/items/PR-006-biaya-produksi-dan-hpp
---

# PR-006 — Biaya produksi dan HPP

## Masalah

HPP per perintah produksi belum bisa dihitung. Bahan, tenaga kerja langsung, dan overhead tidak bertemu di satu tempat per WO. Tanpa HPP, laporan produksi dan persediaan tidak bisa dipertanggungjawabkan.

## Outcome

Ketika perintah produksi selesai, sistem menghitung HPP per unit dan total dengan rumus yang mengikat. Setiap komponen HPP bisa ditelusuri ke dokumen sumbernya. Overhead memakai tarif predeterminasi. Pembebanan TKL dan overhead diposting ke WIP WO, dan jurnal HPP diposting dan balance.

Rumus yang mengikat (`docs/product/epics/EPIC-PR.md`):

```text
HPP unit = (bahan × harga_rata)
         + TKL
         + (DLH × tarif_overhead)
         + biaya rework
         − reject abnormal
```

## Aktor dan izin

| Aktor | Peran | Dasar |
|---|---|---|
| Accounting | mencatat biaya produksi dan memposting HPP | `D-33`, `[USULAN-AGEN]` Q-10 |
| Produksi | mengisi kartu jam kerja per WO; melihat HPP WO | `D-44` (4), `D-33` |
| Sistem | menghitung pembebanan dan HPP; memposting jurnal lewat `core/ledger` | `D-07` |

Hak "lihat HPP WO": Produksi, Accounting, Manajemen (`[USULAN-AGEN]`; laporan produksi `D-33`).

## Cakupan

### Termasuk

- Kartu jam kerja per WO: jam per karyawan per tanggal (`[USULAN-AGEN]`, Q-01).
- Pembebanan TKL (jam × tarif per jam) dan overhead (DLH × tarif predeterminasi) ke WIP WO.
- Biaya rework (bahan tambahan, jam rework, DLH rework).
- HPP WO per unit dan total dengan setiap komponen dan tautan sumbernya.
- Jurnal pembebanan dan jurnal penyesuaian HPP final lewat `postJournal()`.

### Di luar cakupan

- Laporan produksi dan indikator efisiensi (`PR-007`).
- Penggajian dan jurnal TKL di modul penggajian (`GJ-*`).
- Penyelesaian selisih overhead dan tutup buku (`C-010`, `D-44` (4)).
- Perubahan BOM (`PR-001`).

## Status dan transisi

| Kejadian | Efek | Pelaku |
|---|---|---|
| WO mencapai `HASIL_DICATAT` | pembebanan TKL dan overhead dibukukan; HPP sementara belum final | sistem; Accounting menjalankan pembebanan |
| Rework dicatat ulang | pembebanan tambahan untuk jam dan DLH baru | sistem |
| WO `SELESAI` | HPP final dihitung; penyesuaian sisa dibukukan | Accounting |

Tidak ada status HPP baru di `D-46`. HPP mengikuti status WO. Pembebanan bersifat tambahan (tidak mengulang yang sudah dibukukan).

## Perhitungan

- TKL = Σ(jam kartu jam kerja WO × tarif per jam karyawan atau tarif berlaku), dibebankan sekali per jam (`D-44` (4), `D-51`).
- Overhead = DLH WO × tarif overhead periode (`D-12`).
- Biaya rework = bahan tambahan (nilai harga rata) + jam rework × tarif + DLH rework × tarif overhead.
- Reject abnormal = dari `PR-005` (kerugian produksi, dibukukan saat keputusan QC).
- HPP unit = (bahan × harga_rata + TKL + DLH × tarif + rework − reject abnormal) ÷ jumlah lulus (`EPIC-PR`).

Nilai tarif dan persen dari `D-51` (mekanisme berversi); nilainya diverifikasi saat implementasi.

## Jurnal

Akun dipanggil lewat peran (`D-35`); nomor di konfigurasi (`D-41`).

| Kejadian | Debit | Kredit | Nilai |
|---|---|---|---|
| Pembebanan TKL | `barang_dalam_proses` | `tenaga_kerja_langsung` | jam × tarif per jam |
| Pembebanan overhead | `barang_dalam_proses` | `overhead_pabrik` | DLH × tarif overhead |
| Biaya rework (bahan) | `barang_dalam_proses` | `persediaan_bahan` | qty × harga rata (dicatat di `PR-004`) |
| Penyesuaian HPP final (selisih sisa) | `persediaan_barang_jadi` | `barang_dalam_proses` | sisa WIP WO setelah penerimaan |
| Pengiriman barang jadi (`PD-004`/`PD-008`) | `hpp` | `persediaan_barang_jadi` | di luar item ini |

Jurnal pembebanan TKL mengosongkan saldo `tenaga_kerja_langsung` yang terisi dari gaji pabrik (`D-44` (4)); sisa diselesaikan di `C-010`.

## Validasi dan pesan

| Kondisi gagal | Pesan yang ditampilkan | Perilaku |
|---|---|---|
| Tarif overhead belum ada untuk periode | "Tarif overhead untuk periode {periode} belum ditetapkan." | tolak posting |
| HPP final untuk WO belum `SELESAI` | "HPP final hanya bisa dihitung saat perintah SELESAI (sekarang: {status})." | tolak |
| Periode akuntansi terkunci | "Periode {periode} sudah ditutup. Transaksi baru tidak bisa diposting." | tolak; tidak ada baris |
| Jurnal tidak balance | "Jurnal tidak seimbang; transaksi dibatalkan." | batalkan seluruh transaksi |
| Kartu jam kerja belum ada untuk WO | "Kartu jam kerja untuk {nomor WO} belum diisi." | tolak HPP final |
| Peran selain Accounting memposting | "Hanya Accounting yang bisa mencatat biaya produksi." | tolak |

## Success

- HPP WO tampil dengan setiap komponen dan dokumen sumbernya.
- Jumlah jurnal HPP sama dengan total yang dibebankan dan disesuaikan; jurnal balance.
- HPP WO yang sudah final tidak berubah ketika BOM diubah.

## Edge cases

- WO lintas periode: WIP tetap di `barang_dalam_proses` sampai selesai; jurnal masuk periode tanggal transaksi (`D-44` (5)).
- Reject abnormal lebih besar dari nilai WO: dibatasi oleh saldo WIP (kerugian tidak bisa melebihi saldo WIP WO).

## Decision references

- `D-07`, `D-10`, `D-11`, `D-12`, `D-13`, `D-25`, `D-33`, `D-35`, `D-41`, `D-43`, `D-44`, `D-46`, `D-50`, `D-51`(e).
- `docs/product/epics/EPIC-PR.md`, rumus mengikat dan gate selesai 2 dan 4.
- `docs/product/reference/analisis-sia.md` §6.7, §6.9, §8.3, §9.1 G1–G3. Referensi, bukan normatif.
