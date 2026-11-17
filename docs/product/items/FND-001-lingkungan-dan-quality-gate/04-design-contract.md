# Design Contract: FND-001 — Lingkungan yang dapat diulang

- Source: `docs/product/items/FND-001-lingkungan-dan-quality-gate/01-requirement.md` (`FND-001`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-08`)
- Status: `Proposed` — revisi 2026-11-17, diselaraskan dengan Supabase CLI (`D-27`)
- Profile: infrastructure / developer tooling
- Scope: penyiapan database, penerapan migrasi, reset, seed, gerbang mutu, CI
- Owner: tech lead

## Intent and non-goals

**Intent.** Perubahan skema dan data dasar hanya boleh masuk lewat jalur yang bisa diulang dan diperiksa, sehingga kegagalan kode bisa dibedakan dari kegagalan lingkungan.

**Non-goals.** Skema domain (`FND-002`), peran dan RLS (`FND-003`), perilaku fitur, deployment produksi, migrasi data dari sistem lama.

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Berkas migrasi → runner | `.sql` dari branch mana pun, termasuk yang dibuat AI | Pola nama, nomor unik, urutan menaik, tidak ada nomor yang dipakai ulang | Daftar migrasi tervalidasi | Gagal **sebelum** menyentuh database; pesan menyebut kedua berkas yang bertabrakan |
| `B-02` | Skrip seed → database | Berkas seed dari repo | Skema kosong, tidak ada sumber non-deterministik (waktu sekarang, acak tanpa benih, ID berurutan dari state) | Data dasar deterministik | Menolak berjalan; pesan menyebut perintah reset |
| `B-03` | Pemeriksaan → CI | Keluaran lint, tipe, build | Exit code dan ringkasan | Status lulus/gagal yang bisa dibaca mesin | CI merah; tidak ada pemeriksaan yang dianggap lulus karena "terlihat benar" |

`B-01` penting karena berkas migrasi datang dari empat branch berbeda. Runner adalah satu-satunya tempat yang boleh memutuskan urutan.

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | Perintah penyiapan dijalankan | Docker berjalan dan dapat dijangkau | Skrip penyiapan | Berhenti dengan pesan yang menyebut Docker; tidak mencoba menebak |
| `PRE-02` | Migrasi diterapkan | Setiap berkas cocok pola nama; nomor unik; urutan menaik; tidak ada nomor yang sudah dipakai berkas lain | Runner | Gagal sebelum koneksi; sebut kedua berkas |
| `PRE-03` | Seed dijalankan | Skema berada pada kondisi `siap` (migrasi terpasang, belum ada data dasar) | Skrip seed | Menolak; sebut perintah reset |
| `PRE-04` | Reset dijalankan | Target bukan lingkungan produksi | Operator + skrip | Menolak bila penanda lingkungan tidak terbaca sebagai lokal |

`PRE-04` adalah pengaman, bukan formalitas. Reset yang salah sasaran tidak bisa dibatalkan.

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | Seluruh migrasi terpasang; objek skema sama dengan gabungan isi migrasi | Tidak ada data aplikasi | Status versi skema tercatat |
| `POST-02` | Menjalankan penerapan ulang tidak mengubah skema dan tidak menghasilkan error | Skema dan data yang ada | Tidak ada |
| `POST-03` | Reset menghasilkan skema `siap`: seluruh migrasi terpasang, tanpa data dasar | — | Data hilang; itu tujuannya |
| `POST-04` | Seed menghasilkan jumlah baris dan nilai kunci yang **identik** pada dua kali jalan dari kondisi kosong | Urutan operasi deterministik | Data dasar terpasang |
| `POST-05` | Pemeriksaan mutu keluar dengan kode 0 hanya bila lint, tipe, dan build semuanya lolos | — | CI hijau |

`POST-04` diuji dengan membandingkan **jumlah baris dan nilai kunci**, bukan seluruh isi tabel. Perbandingan seluruh isi rapuh terhadap kolom waktu audit.

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | Tech lead | Berkas migrasi yang sudah di-merge ke `main` tidak berubah isinya | Menyunting migrasi lama untuk "memperbaiki" skema |
| `INV-02` | Runner | Nomor migrasi tidak pernah dipakai ulang, termasuk setelah berkas dihapus | Menghapus `0007` lalu memakai nomor itu untuk hal lain |
| `INV-03` | Skrip seed | Seed tidak bergantung pada tanggal hari ini, waktu sistem, atau acak tanpa benih tetap | Data uji berubah setiap hari |
| `INV-04` | Runner | Migrasi yang gagal tidak boleh tercatat sebagai sudah diterapkan | Skema setengah jadi yang dilaporkan "sudah migrate" |

Status lingkungan:

| State | Arti | Transisi legal |
|---|---|---|
| `kosong` | Tidak ada tabel aplikasi | `kosong → siap` lewat penerapan migrasi |
| `siap` | Seluruh migrasi terpasang, tanpa data dasar | `siap → terisi` lewat seed; `siap → siap` lewat reset |
| `terisi` | Data dasar terpasang | `terisi → siap` lewat reset penuh |

`terisi → siap` hanya legal lewat reset penuh. Menghapus sebagian baris seed secara manual dilarang karena meninggalkan data parsial yang tidak bisa dibedakan dari seed yang gagal di tengah. `kosong` hanya muncul sesaat di dalam reset.

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Nomor migrasi bertabrakan | Gagal sebelum menyentuh database | Ganti nomor salah satu berkas; tech lead menetapkan nomor |
| Migrasi gagal di tengah | Tidak tercatat sebagai diterapkan | Perbaiki berkas, jalankan ulang dari kondisi yang dilaporkan |
| Seed gagal di tengah | Skema tidak boleh ditinggalkan dalam status `terisi` | Reset, lalu seed ulang |
| Aplikasi dijalankan pada skema `kosong` | Pesan menyebut perintah penyiapan | Jalankan penyiapan |
| Pemeriksaan mutu gagal | CI merah dengan berkas dan baris | Perbaiki; tidak boleh melewati gate |

## Architecture boundaries

Item ini tidak menetapkan batas modul. Batas modul ada di `docs/architecture/contracts/ARCH-001-batas-core-modul/contract.md`.

Satu batasan yang tetap berlaku di sini: **mekanisme penyiapan tidak boleh menjadi ketergantungan runtime aplikasi**. Aplikasi tidak boleh memanggil alat migrasi saat berjalan.

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | Dua berkas bernomor sama ditolak dengan pesan menyebut keduanya | Manual + uji runner | `05-evidence.md` AC-03 | `PASS` |
| `PRE-01` | Docker mati → berhenti dengan pesan yang menyebut Docker | Uji `db-guard` | `05-evidence.md` PRE-01 | `PASS` |
| `PRE-02` | Berkas dengan nama tidak berpola ditolak | Uji runner | `05-evidence.md` AC-03 | `PASS` |
| `PRE-03` | Seed dua kali berturut-turut → yang kedua ditolak | Perintah | `05-evidence.md` AC-07 | `PASS` |
| `PRE-04` | Penanda lingkungan non-lokal → reset menolak | Uji `db-guard` | `05-evidence.md` PRE-04 | `PASS` |
| `POST-01` | Daftar tabel setelah penyiapan sama dengan gabungan migrasi | Perintah + diff | `05-evidence.md` AC-01 | `PASS` |
| `POST-02` | Penerapan ulang → tidak ada perubahan skema | Perintah + diff | `05-evidence.md` AC-02 | `PASS` |
| `POST-03` | Setelah reset, skema `siap` tanpa data dasar | Perintah | `05-evidence.md` AC-02 | `PASS` |
| `POST-04` | Dua kali reset+seed → jumlah baris dan kunci sama | Skrip pembanding | `05-evidence.md` AC-06 | `PASS` |
| `POST-05` | `AC-04` dan `AC-05` | CI | `AC-04` lulus; `AC-05` belum | `Unverified` |
| `INV-01` | Berkas migrasi lama tidak berubah di `main` | Review PR | belum ada riwayat `main` | `Unverified` |
| `INV-04` | Migrasi gagal → status tidak tercatat | Uji migrasi rusak | `05-evidence.md` INV-04 | `PASS` |

Sepuluh dari dua belas aturan `PASS`. Dua sisanya menunggu bukti luar: `POST-05` menunggu run CI pertama, `INV-01` menunggu riwayat `main` yang sudah di-merge.

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Alat penyiapan database | `Approved` — Supabase CLI lokal (`D-27`) | Mengubah `PRE-01` dan nama perintah di `AC-04` |
| Penyedia CI | `Approved` — GitHub Actions (`D-28`) | Mengubah `B-03`, bukan perilaku |
| Nama perintah (`db:setup`, `db:reset`, `db:seed`, `typecheck`) | `Approved` — dipakai di `package.json` | Menyentuh `AC-04` dan `AC-05` |
| Apakah test runner masuk sekarang atau bersama item perilaku pertama | `Proposed` — belum masuk | Tidak memblokir |

## Aturan yang sengaja tidak dibuat

| Tipe | Alasan |
|---|---|
| State machine dokumen | Tidak ada dokumen di item ini |
| Loop/termination | Tidak ada algoritma berulang |
| Otorisasi per peran | Milik `FND-003` |
| Batas modul | Milik `ARCH-001` |
