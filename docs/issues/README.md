# Issues

Catatan temuan yang **belum menjadi item backlog**. Isinya bukti dan usulan, bukan komitmen kerja.

## Bedanya dengan folder lain

| Folder | Isi | Siapa yang mengerjakan |
|---|---|---|
| `docs/product/items/` | item backlog yang sudah punya ID dan status | track pemilik |
| `docs/tech-debt/` | utang teknis pada item yang sudah selesai | tech lead |
| `docs/issues/` | temuan lintas item yang **belum punya ID item** | belum ada |

Kalau sebuah issue disetujui untuk dikerjakan, ia naik menjadi item `FND-*`/`C-*` di `backlog.md`, lalu file di sini ditandai `promoted` dengan ID item-nya. File tidak dihapus.

## Konvensi

- Nama file: `ISSUE-NNN-<slug>.md`, nomor tidak dipakai ulang.
- Status: `open` · `decided` · `promoted` · `closed`.
- Setiap temuan memakai kode `FNN` agar bisa dirujuk dari PR atau diskusi.
- Satu file = satu tema. Temuan yang tidak berhubungan dibuat file baru.

## Daftar

| ID | Judul | Status | Dicatat |
|---|---|---|---|
| `ISSUE-001` | [SSOT komponen UI: header, tombol, kartu, state halaman](ISSUE-001-ssot-komponen-ui.md) | `open` | 2026-11-23 |
| `ISSUE-002` | [Cacat shell `FND-009`: prerender `Date.now()` dan scroll 1280](ISSUE-002-cacat-shell-fnd-009.md) | `open` | 2026-11-23 |
