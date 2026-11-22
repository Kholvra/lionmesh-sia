# Design Contract: INT-002 — Rantai end-to-end

- Source: `docs/product/items/INT-002-rantai-end-to-end/01-requirement.md` (`INT-002`)
- Acceptance criteria: `02-acceptance-criteria.md` (`AC-01`…`AC-09`)
- Status: `Proposed` — belum diverifikasi; semua aturan `Unverified`
- Profile: product app — rantai dokumen lintas siklus (uang, stok, status)
- Scope: urutan langkah rantai, pemeriksaan status, jurnal, laporan, dan data uji
- Owner: tech lead (PT-07, `[USULAN-AGEN]`)
- Keputusan yang dipakai: `D-16`, `D-27`, `D-28`, `D-30`, `D-34`, `D-36`, `D-41`, `D-42`, `D-44`, `D-46`, `D-47` (a), `D-49`, `D-51` (b), (g)

## Intent and non-goals

**Intent.** Rantai dokumen lintas siklus dapat diulang dari kondisi awal yang sama, dan setiap langkah meninggalkan jejak dan jurnal yang benar.

**Non-goals.** Logika setiap langkah, jurnal gabungan (`INT-001`), rekonsiliasi stok (`INT-003`), dan skenario di luar `D-51` (g).

## Trust boundary

| ID | Boundary | Input/sumber | Validasi atau parse | Representasi tepercaya | Perilaku penolakan |
|---|---|---|---|---|---|
| `B-01` | Data uji → rantai | hasil `db:reset` + `db:seed` | cek kondisi `siap` lalu `terisi` | kondisi data terverifikasi | tolak; sebut perintah |
| `B-02` | Rantai → setiap siklus | langkah dan parameter | validasi di service siklus | input tervalidasi | rantai berhenti |
| `B-03` | Rantai → pemeriksa | status, jurnal, angka laporan | pembanding dengan nilai yang diharapkan | hasil lulus/gagal | gagal; sebut langkah |

## Preconditions

| ID | Trigger | MUST be true | Owner | Violation behavior |
|---|---|---|---|---|
| `PRE-01` | rantai dimulai | skema `siap` lalu `terisi` (`D-30`) | penguji | tolak; sebut `db:reset` atau `db:seed` |
| `PRE-02` | rantai dimulai | nilai yang diharapkan sudah ditulis dan dihitung tangan (PT-02, `[USULAN-AGEN]`) | penguji | tolak jalan |
| `PRE-03` | setiap langkah | langkah sebelumnya berhasil | penguji | rantai berhenti |

## Postconditions

| ID | On success, MUST guarantee | Preserved values/state | Side effects |
|---|---|---|---|
| `POST-01` | setiap dokumen dalam rantai berstatus akhir yang diharapkan | — | — |
| `POST-02` | setiap perpindahan status punya `riwayat_status` | — | baris riwayat |
| `POST-03` | setiap jurnal yang diposting balance | — | baris jurnal |
| `POST-04` | laporan dari `C-009` sesuai nilai yang diharapkan | — | — |
| `POST-05` | run kedua dari reset + seed menghasilkan snapshot identik | — | — |
| `POST-06` | pada tiap jalur gagal (`D-51` (g)), dokumen berhenti di status penolakan dan tidak ada mutasi atau jurnal baru (AC-08, AC-10) | mutasi, jurnal sebelum kegagalan | — |

## Invariants and state transitions

| ID | Owner | Invariant | Forbidden case |
|---|---|---|---|
| `INV-01` | rantai | tidak ada perubahan database di luar langkah rantai | perubahan manual |
| `INV-02` | setiap siklus | dokumen yang gagal tidak meninggalkan status setengah jadi | dokumen dengan status tanpa jurnal |
| `INV-03` | core ledger | setiap jurnal balance (`INV-01` ARCH-001) | jurnal tidak balance |
| `INV-04` | core dokumen | setiap perubahan status punya riwayat (`INV-05` ARCH-001) | status berubah tanpa jejak |
| `INV-05` | rantai | jalur gagal tidak mengubah `mutasi_stok`, `saldo_stok`, atau `jurnal` (AC-10) | mutasi atau jurnal baru pada jalur gagal |

Tidak ada state machine di item ini. Status tiap dokumen dimiliki item siklusnya.

## Failure and recovery semantics

| Kegagalan | Perilaku yang diwajibkan | Pemulihan |
|---|---|---|
| Langkah gagal di tengah rantai | rantai berhenti; dokumen tidak setengah jadi | `db:reset` + `db:seed`, lalu ulangi |
| Data uji tidak lengkap | rantai menolak jalan | `db:reset` + `db:seed` |
| Angka laporan berbeda | pemeriksaan gagal; menyebut angka | telusuri ke jurnal sumber |

## Architecture boundaries

- Rantai tidak boleh menulis langsung ke tabel siklus; setiap langkah lewat service siklus (`ARCH-08`, `D-25`).
- Jurnal hanya lewat `core/ledger` (`D-07`).
- Persediaan hanya lewat `core/inventory` (`D-06`).

## Verification mapping

| Contract ID | Observable oracle | Check type/owner | Evidence | Status |
|---|---|---|---|---|
| `B-01` | rantai menolak tanpa seed | perintah | `05-evidence.md` AC-09 | `Unverified` |
| `PRE-01` | reset lalu seed sebelum rantai | perintah | `05-evidence.md` AC-01 | `Unverified` |
| `PRE-02` | nilai diharapkan dicatat sebelum run | catatan | `05-evidence.md` AC-02 | `Unverified` |
| `POST-01` | status akhir sesuai tabel | pembanding | `05-evidence.md` AC-02 | `Unverified` |
| `POST-02` | setiap perpindahan ada riwayat | perintah hitung baris | `05-evidence.md` AC-03 | `Unverified` |
| `POST-03` | jurnal setiap langkah balance | perintah SQL | `05-evidence.md` AC-04 | `Unverified` |
| `POST-04` | angka laporan sesuai | pembanding | `05-evidence.md` AC-05 | `Unverified` |
| `POST-05` | dua run identik | pembanding snapshot | `05-evidence.md` AC-07 | `Unverified` |
| `INV-01` | tidak ada perubahan manual | catatan langkah | `05-evidence.md` AC-01 | `Unverified` |
| `INV-02` | jalur gagal tidak menyisakan dokumen | perintah hitung | `05-evidence.md` AC-08 | `Unverified` |
| `INV-05` | jalur gagal tidak mengubah mutasi atau jurnal | perintah hitung | `05-evidence.md` AC-10 | `Unverified` |
| `POST-06` | tiga jalur gagal berhenti dengan benar | uji fixture | `05-evidence.md` AC-08 | `Unverified` |
| `INV-03` | jurnal balance | perintah SQL | `05-evidence.md` AC-04 | `Unverified` |
| `INV-04` | riwayat lengkap | perintah hitung | `05-evidence.md` AC-03 | `Unverified` |

## Open decisions and assumptions

| Hal | Status | Dampak bila salah |
|---|---|---|
| Skenario acuan (PT-01) | `Terjawab — D-51 (g)` (analisis §6 sebagai data ilustratif) | — |
| Nilai yang diharapkan (PT-02) | `Proposed` `[USULAN-AGEN]` (dihitung tangan sebelum run) | rantai lulus karena nilai dihitung dari hasil |
| `FND-008` menyeed seluruh master (PT-03) | `Proposed` `[USULAN-AGEN]` | rantai gagal atau data uji tidak konsisten |
| Cakupan jalur gagal (PT-04) | `Terjawab — D-51 (g)` (tiga jalur) | — |
| Cara menjalankan (PT-05) | `Proposed` `[USULAN-AGEN]` (skrip) | bukti tergantung layar |
| Tempat menjalankan (PT-06) | `Proposed` `[USULAN-AGEN]` (lokal, bukan gerbang PR) | regresi rantai lolos tanpa terdeteksi |
