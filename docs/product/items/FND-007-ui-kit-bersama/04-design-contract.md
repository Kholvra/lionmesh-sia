# Design Contract: FND-007 — UI kit bersama

- Source: `docs/product/items/FND-007-ui-kit-bersama/01-requirement.md` (`FND-007`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-08`)
- Status: `Proposed`
- Profile: product app / shared UI primitives
- Scope: tabel, form, status badge, dialog konfirmasi
- Owner: tech lead
- Referensi: `ARCH-001` (`ARCH-01`, `ARCH-02`); `D-46`, `D-47`, `D-48`

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
| `INV-01` | `grep` tanpa hasil | AC-06 | — | `Unverified` |
| `INV-02` | `pnpm arch:check` gagal bila modul impor modul | AC-05 | — | `Unverified` |
| `INV-03` | Label di luar daftar tidak tampil | AC-03 | — | `Unverified` |
| `PRE-01` | Nilai di luar daftar ditolak badge | AC-03 | — | `Unverified` |
| `PRE-02` | Aksi tanpa konfirmasi tidak jalan | AC-04 | — | `Unverified` |
| `POST-01` | Batal tidak mengubah data | AC-04 | — | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Gate UI di `backlog.md` (`OQ-07-01`) | `[USULAN-AGEN]` | Item modul mulai tanpa primitive |
| Perilaku tabel, konfirmasi, pesan, aksesibilitas (`OQ-07-02`, `OQ-07-04` sampai `OQ-07-06`) | `[USULAN-AGEN]` | AC-01 sampai AC-04, AC-07, AC-08 berbeda dari keputusan |
| Bukti manual sampai runner (`OQ-07-07`) | `[USULAN-AGEN]` | Bukti tidak bisa diulang otomatis |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| State machine dokumen | Tidak ada dokumen di item ini |
| Trust boundary | Input diperiksa di server oleh item pemanggil (`ARCH-001` `BOUNDARY-01`) |
| Loop/termination | Tidak ada algoritma berulang |
| Architecture boundary penuh | Milik `ARCH-001`; item ini hanya merujuk |
