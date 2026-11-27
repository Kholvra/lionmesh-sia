# GJ-006 — Bukti Verifikasi

Tanggal: 2026-11-27. Branch `gj-006-pembayaran-gaji-dan-slip`, ditumpuk di atas `gj-005-periksa-dan-setujui-payroll` (#47). Supabase lokal (`pnpm db:reset` + `pnpm db:seed:local`), dev server, Chromium headless lebar 1440.

Migrasi `0021_gj006_pembayaran_slip.sql` (nomor menunggu persetujuan tech lead, `D-09`): `batch_transfer_gaji`, `transfer_gaji` (unik per periode dan karyawan), `percobaan_transfer_gaji`, `catatan_dana_gaji`, `slip_gaji` (satu ASLI per karyawan per periode, pengganti wajib alasan), `cetak_slip_gaji`; semuanya append-only kecuali status transfer. Status periode mengikuti hasil transfer lewat transisi `BAYAR` di core dokumen. Tidak ada jurnal (GJ-007).

**Bukti transfer disimpan di Supabase Storage**, bucket privat `bukti-transfer-gaji` (PDF/PNG/JPG, maks 10 MB): Finance mengunggah, Finance dan Accounting membaca, peran lain ditolak oleh policy `storage.objects`. Nominal transfer diambil fungsi DB dari komponen draft, bukan dari form.

Juga di branch ini: `slip.module.css` diganti varian `print:` Tailwind pada kartu slip, sehingga hanya slip yang tercetak.

## Uji database

20/20 lolos: bayar sebelum disetujui ditolak; HR tidak bisa mengunggah bukti; Finance mengunggah; HR (penghitung) tidak bisa membayar; tanpa bukti ditolak; batch Agus dibayar dan Siti gagal → periode `GAGAL_TRANSFER`; nominal 2.500.000 dari draft; pembayaran ganda ditolak; ulang tanpa alasan ditolak; ulang dengan alasan → periode `DIBAYAR`; Accounting membaca bukti, Karyawan ditolak; slip sebelum dibayar ditolak; cetak dan cetak ulang tercatat; pengganti tanpa alasan ditolak, dengan alasan tersimpan; Karyawan tidak membaca slip maupun transfer.

## Uji layar

| AC | Hasil | Bukti |
|---|---|---|
| AC-01, AC-02, AC-06 | Lolos | Finance mengunggah bukti PDF, memilih hasil per karyawan (satu gagal) → batch tersimpan, karyawan gagal punya tautan proses ulang |
| AC-03, AC-05 | Lolos | Transfer ulang Siti dengan alasan → keempat transfer `DIBAYAR`, periode `DIBAYAR` (dicek di DB; cek teks di skrip layar keliru, data benar) |
| AC-04 | Lolos (DB) | "Alasan percobaan ulang wajib diisi." |
| AC-07 | Lolos | Dua objek bukti di Storage, terunduh oleh Accounting |
| AC-08, AC-11, AC-12, AC-13, AC-15 | Lolos (DB) | Lihat uji database; rekening tidak lengkap ditolak `kirim_batch_gaji`; dana kurang dicatat tanpa memproses transfer |
| AC-09, AC-10 | Lolos | HR mencetak slip Agus ("Cetak slip tercatat."); slip sebelum dibayar ditolak |
| AC-14 | Lolos | Slip pengganti "Nama bank salah cetak" tersimpan; slip asli tetap ada (dicek di DB) |
| AC-16, AC-17 | Lolos | Karyawan membuka slip → "Slip gaji hanya dibuka dan dicetak HR."; view transfer dan slip 0 baris |

Tanpa error halaman. `pnpm verify` dan `pnpm check:migrations` (21 berkas, nomor unik): exit 0.
