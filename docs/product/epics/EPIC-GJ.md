# EPIC-GJ — Siklus Penggajian

**Status:** `active`
**Track:** GJ-A master · GJ-B presensi · GJ-C payroll · GJ-D bayar
**Milestone:** M1

## Outcome

Presensi dan lembur berubah menjadi payroll yang dihitung, diperiksa, disetujui, dibayar, dan dijurnal — dengan tarif yang bisa berubah tanpa mengubah kode.

## Cakupan

| Track | Item |
|---|---|
| GJ-A | `GJ-001` karyawan, gaji pokok, PTKP |
| GJ-B | `GJ-002` presensi & lembur · `GJ-003` rekap · `GJ-008` impor presensi |
| GJ-C | `GJ-004` hitung payroll · `GJ-005` periksa & setujui |
| GJ-D | `GJ-006` pembayaran & slip · `GJ-007` jurnal & laporan |

## Aturan yang mengikat

- `D-53` (menggantikan `D-18` soal akun): karyawan punya akun terbatas (peran ke-13, self-service) untuk mencatat presensi dan lembur miliknya sendiri; HR boleh input atas nama dan koreksi. Slip tetap diterbitkan HR dan dicetak; tidak ada portal slip.
- `D-19` seluruh komponen dihitung dari tabel tarif berversi.
- PPh 21 memakai lookup TER, bukan bracket progresif bulanan.
- Gaji pokok diambil dari histori, bukan kolom tunggal.
- Koreksi manual wajib alasan dan tercatat.

## Gate selesai

1. Satu periode payroll berjalan dari presensi sampai slip.
2. `GJ-004` menghasilkan angka yang sama saat dijalankan ulang pada data yang sama.
3. `GJ-007` menghasilkan jurnal balance dan laporan yang cocok.
4. Perubahan tarif di tabel tidak mengubah payroll periode yang sudah ditutup.

## Risiko

| Risiko | Mitigasi |
|---|---|
| Tabel TER salah isi | validasi jumlah baris dan kategori PTKP saat seed |
| Periode payroll terkunci terlambat | kunci otomatis saat `GJ-005` disetujui |
