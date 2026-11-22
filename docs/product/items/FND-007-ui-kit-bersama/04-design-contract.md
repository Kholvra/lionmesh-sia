# Design Contract: FND-007 — UI kit bersama

- Source: `docs/product/items/FND-007-ui-kit-bersama/01-requirement.md` (`FND-007`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-08`)
- Status: `Approved`
- Profile: product app / shared UI primitives
- Scope: tabel, form, status badge, dialog konfirmasi
- Owner: tech lead
- Referensi: `ARCH-001` (`ARCH-01`, `ARCH-02`); `D-46`, `D-47`, `D-48`, `D-58`

## Intent and non-goals

**Intent.** Primitive UI tidak mengandung logika domain dan tidak bergantung pada modul, sehingga bisa dipakai semua siklus tanpa melanggar batas modul.

**Non-goals.** Visual, layar fitur, validasi domain, layanan, dan penghapusan dokumen.

## Invariants

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Core UI | Komponen tidak mengimpor layanan domain atau tabel (AC-06) | Komponen memanggil klien data |
| `INV-02` | Core UI | Komponen tidak mengimpor modul (`ARCH-001` `ARCH-01`, `ARCH-02`) | Impor antar-modul atau core ke modul |
| `INV-03` | Core UI | Badge hanya menampilkan nilai dari daftar status yang diberikan pemanggil (`D-46`, `D-47`) | Label status di luar daftar |

## Preconditions and postconditions (ringkas)

| ID | Rule | Owner | Violation behavior |
|---|---|---|---|
| `PRE-01` | Pemanggil memberi daftar status dari state machine (`D-46`, `D-47`) | Modul pemanggil | Badge menolak nilai di luar daftar |
| `PRE-02` | Aksi yang wajib konfirmasi (setujui, tolak, batalkan, proses, selesai, posting) dipanggil lewat dialog | Modul pemanggil | Aksi tidak berjalan tanpa konfirmasi |
| `POST-01` | Aksi konfirmasi hanya dijalankan setelah "setuju" | Dialog | Tidak ada aksi saat "batal" |

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `INV-01` | pencarian impor tidak menemukan layanan domain, tabel, core, modul, atau Supabase | AC-06 | `05-evidence.md` — AC-06 | `Verified` |
| `INV-02` | impor komponen UI lintas modul lolos; impor antar-modul ditolak | AC-05 | `05-evidence.md` — AC-05 | `Verified` |
| `INV-03` | label status di luar daftar tidak tampil | AC-03 | `05-evidence.md` — AC-03 | `Verified` |
| `PRE-01` | nilai status di luar daftar ditolak badge dan dilaporkan | AC-03 | `05-evidence.md` — AC-03 | `Verified` |
| `PRE-02` | aksi setujui, tolak, dan batalkan hanya berjalan setelah konfirmasi | AC-04 | `05-evidence.md` — AC-04 | `Verified` |
| `POST-01` | batal atau kembali menutup dialog tanpa menjalankan aksi | AC-04 | `05-evidence.md` — AC-04 | `Verified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Gate UI di `backlog.md` (`OQ-07-01`) | Disahkan pada tingkat item oleh D-58 | Item modul mengikuti gate UI |
| Perilaku tabel, konfirmasi, pesan, aksesibilitas (`OQ-07-02` sampai OQ-07-06) | Disahkan pada tingkat item oleh D-58 | AC-01 sampai AC-04, AC-07, AC-08 memakai perilaku tersebut |
| Bukti manual sampai runner (`OQ-07-07`) | Disahkan pada tingkat item oleh D-58 | Langkah dan hasil ada di `05-evidence.md` |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| State machine dokumen | Tidak ada dokumen di item ini |
| Trust boundary | Input diperiksa di server oleh item pemanggil (`ARCH-001` `BOUNDARY-01`) |
| Loop/termination | Tidak ada algoritma berulang |
| Architecture boundary penuh | Milik `ARCH-001`; item ini hanya merujuk |
