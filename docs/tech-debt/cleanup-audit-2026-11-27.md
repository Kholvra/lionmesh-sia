# Rapi-rapi pasca-audit 2026-11-27 — daftar tugas

Sumber: codebase audit 27 Nov 2026 (12 area, ±334 file, ±300 temuan).
Mesin bersih: `arch:check` 0 pelanggaran (305 modul), tanpa import lintas
siklus dan tanpa import core→atas. Semua item di bawah belum dikerjakan.

Cara pakai: kerjakan per fase berurutan; centang + tulis bukti saat selesai.
Detail lengkap (file:baris, duplikasi) ada di laporan audit 27 Nov.

## Fase 1 — Kebenaran uang & auth (kritis, duluan)
Bukti 2026-11-27 (branch `post-merge-consolidation`, 8 agen paralel):
`typecheck`/`lint`/`arch:check`/`check:migrations` hijau, `pnpm test`
124/124, skeptical review 1 temuan (A2 konten laporan) sudah ditambal +
re-verify hijau.
Risiko sisa: (1) A4 — Purchasing/Manajemen baca semua baris dokumen tanpa
filter tipe (mirror perilaku app; persempitan = keputusan terpisah);
(2) `formatRupiah` duplikat penggajian (`karyawan/format.ts`) di luar
scope U2; (3) U2 — `1500.567` kini ditolak (schema+DB batasi 2 desimal,
data produksi aman).

- [x] U1. Satu primitif desimal `parse/format/validate` skala-penuh —
      gantikan `core/ledger/money.ts:7`, `core/inventory/report.ts:48`,
      `core/inventory/valuation.ts:3` (+ `report.ts:104` duplikat
      `moneyToCents`); satukan 3 regex numerik
      (`inventory/decimal.ts:3`, `valuation.ts:4`, `report.ts:49`).
- [x] U2. Satu `formatRupiah` — `lib/format/money.ts:10` (cents) vs
      `lib/format/number.ts:18` (string desimal) beda makna; gabungkan
      grouping ribuan (`money.ts:6` vs `number.ts:5-15`); hapus yang tak
      terpakai.
- [x] U3. Satu helper jumlah bertanda — `ledger/report.ts:58-66` +
      `inventory/report.ts:92-100,117-120,176-187` (5×, beda tanda halus).
- [x] A1. Keluarkan Supabase + logika domain dari komponen —
      `components/auth-form.tsx:8,57-66`, `sign-out-button.tsx:6,12-15`
      pindah ke action `Result` di `lib/auth/server.ts`.
- [x] A2. Produksi fail-open → deny-all —
      `modules/produksi/context/actor-context.tsx:41-48`; pasang provider
      dari batas sesi.
- [x] A3. Satu sumber otorisasi — `MATRIKS_IZIN` vs array `peran` di
      `shell/nav.ts:24,39` vs `penggajian/karyawan/akses.ts:8-11` vs
      matriks `produksi/auth/actor.ts:61-96`; semua lewat `cekIzin`;
      tambah izin baca karyawan + `AksiDomain` untuk nav.
- [x] A4. Tambal gap RLS dokumen — `0007:405-421` revoke tanpa SELECT
      policy padahal `dokumen/queries.ts` baca langsung; migrasi forward
      baru (jangan edit 0007).
- [x] A5. Bug nyata tombol Batal — `permintaan-actions.tsx:157` render
      tanpa gate `canAjukan` yang diwajibkan `actions.ts:159`.
- [x] A6. Validasi WO Produksi hanya di UI — pindah ke
      `permintaan/schema.ts` / action server.

## Fase 2 — Fondasi UI bersama (dipakai semua siklus)
Bukti 2026-11-27 (branch `post-merge-consolidation`, 7 produser + 5
konsumen paralel): 12 primitif baru di `components/ui` + barrel,
8 file lama dihapus; `typecheck`/`lint`/`arch:check` hijau,
`pnpm test` 124/124, `pnpm build` hijau; spot-check visual
/penggajian/karyawan identik.
Risiko sisa: (1) delta piksel kecil di mana prototipe pakai nilai
non-token (dipetakan ke token terdekat, disengaja); (2) dev overlay
"1 Issue" pra-ada (`Date.now()` di AppLayout saat prerender, di luar
scope, build produksi hijau); (3) NIK berhuruf akan beda hasil cari
(NIK valid numerik, ekuivalen).

- [x] C1. `useTableState` + `sortRows` generik — 8 tabel
      (master, pemasok, permintaan, karyawan, antrean, notifikasi,
      periode, laporan).
- [x] C2. Satu set Loading/Error/Empty — promosikan
      `MasterLoading`/`MasterError`; gantikan salinan inline
      (pengeluaran routes, notifikasi, `GagalMemuat` laporan 24×,
      `states`/`gagal-dimuat` GJ).
- [x] C3. Satu `PageHeader` (+ breadcrumb, back link) — gabungkan
      `SectionHeader` laporan (16×), `PageHeader` GJ (15×), breadcrumb
      produksi (13×).
- [x] C4. Satukan badge & pesan — `StatusBadge` gantikan badge rakitan
      produksi (7+ situs); satu `Notice`/`Pesan`/`Callout`
      (pengeluaran `Pesan` 3+1, GJ `Notice` 7, callout produksi 5).
- [x] C5. Primitif form — satu `Select` (3 implementasi), satu
      `SubmitButton` "Memproses…" (5+), satu footer submit/batal.
- [x] C6. Kartu & grid — satu `MetricCard`/`Ringkasan` (26+),
      `SegmentedTabs`, `TableActionLink`, `SpkStepper` (produksi).
- [x] C7. CSS bersama — 49 blok kembar pemasok↔permintaan; header/card/
      button/alert kembar notifikasi↔pengaturan↔master↔dashboard;
      focus-ring ×5 → 1 utilitas; hapus dead CSS (±14 blok).
- [x] C8. Tiga panah SVG → satu `ArrowIcon`; hex hardcode
      `custom-select` → token; barrel `ui/index` ekspor semua;
      `confirm-dialog` satu guard; `status-badge` tanpa side-effect render.

## Fase 3 — Duplikasi core & module
Bukti 2026-11-27 (branch `post-merge-consolidation`, 5 wave-A + 6 wave-B
agen paralel): helper bersama di `lib` (parseRpcResult, ambilTeks,
pesanKesalahan, withAdminAction; createAdminClient + isRecord dipakai
ulang); semua query core migrasi; 3 file gemuk dipecah; barrel server
subpath + server-only; registry COA tunggal; `typecheck`/`lint`/
`arch:check` hijau, `pnpm test` 124/124, `pnpm build` hijau.
Catatan: `keIsoString`/`SELECT_MUTASI` nol kemunculan di source (audit
basi); module actions pesan-kustom sengaja tidak disatukan.
[blocked] K10 kaki-Supabase: tabel produksi belum ada, butuh keputusan
skema (DDL). Dikerjakan: store typed tunggal, formula 1×, demo dihapus,
izin terverifikasi terpusat.

- [x] K1. Paging: angkat `dashboard/pagination.ts:3` (`readAllPages`) untuk
      `ledger/report-queries` + `inventory/report-queries` (3 loop kembar).
- [x] K2. Koersi + pesan gagal: satu `ambilTeks`/koersi
      (`ledger/report-queries:20`, `inventory/report-queries:30`,
      `tutup-buku-queries:18`, +4 di notifikasi/dashboard) dan satu
      `pesanKesalahan` (master, pemasok, pengadaan).
- [x] K3. Parser RPC + wrapper sesi: satu `parseRpcResult` skema-driven
      (ledger, tutup-buku, dokumen) dan satu `withAdminAction`
      (7 wrapper ledger/inventory); `createAdminClient` untuk
      `dokumen/server.ts:25-37`; `isRecord` dari lib di dokumen.
- [x] K4. Transisi dokumen 8× → map `AKSI→rpc` + 1 wrapper generik
      (`dokumen/service.ts:61-216`); `keIsoString` 4×; konstanta
      `SELECT_MUTASI`; `susunAlasanTutup` (tutup-buku 2×).
- [x] K5. Validasi respons tak diperiksa — `inventory/service.ts`
      dereference `data` mentah; `dokumen/queries` + `service:23-25`
      cast `as`; skema zod + `safeParse` → `fail`.
- [x] K6. Pecah file gemuk — `ledger/report.ts` 506 (types→`types.ts`,
      klasifikasi→`rules.ts`), `tutup-buku-queries.ts` 356 (baca vs
      orkestrasi), `notifikasi/service.ts` (worker → `worker.ts`).
- [x] K7. Barrel campur pure+server (ledger/inventory/dokumen `index.ts`)
      → subpath `*/server` + `import "server-only"`; satukan 3 jalur
      privilege (assertIzin vs getSesiUser+cekIzin vs tanpa cek).
- [x] K8. Satukan registry peran COA persediaan (ledger vs inventory);
      dashboard baca `riwayat_status` langsung → `listPersediaan…` /
      API dokumen; pindah orkestrasi rekonsiliasi kartu keluar dari
      layar app (`kartu-persediaan.tsx:133-158`).
- [x] K9. Modul: `firstParam` query unwrap (pengeluaran+GJ+produksi
      metadata 14×/3 format + `PageProps` 3×); `PATH_*` konstan
      (GJ 11× literal); `PESAN` map typed GJ; hapus barrel mati
      produksi `types.ts`; nama impor relatif vs `@/` disatukan.
- [ ] K10. Produksi persistence (besar, terpisah dari UI): sessionStorage
      16 baca/7 tulis → action server + Supabase + zod; matriks izin →
      lib; seed SPK/stok → core/master; formula `hitungKebutuhanBahan`
      1×; hapus fabrikasi demo + tombol demo.

## Fase 4 — Scripts, migrasi, hygiene
Bukti 2026-11-27 (branch `post-merge-consolidation`, 2 agen paralel):
`scripts/lib/` 7 modul + semua skrip migrasi; rahasia env-only +
fail-fast; gap-detection (0016 allowlist) + CI seed-check diff-based
vs base + template `scripts/templates/new-migration.sql`; S4 Hygiene
selesai; `typecheck`/`lint`/`arch:check` hijau, `pnpm test` 124/124,
`pnpm build` hijau, `db:seed:local` tanpa-env terverifikasi.
Catatan: `db-seed-local` kembali literal (password lokal terdokumentasi
di AGENTS.md); fnd-006-session pertahankan fixture `+07:00` (isIsoDate
app menolak zona bernama); `../../../` sudah nol sejak K9.

- [x] S1. `scripts/lib/` bersama — loader env 1× (3 parser), guard
      host lokal 1× (12 file), konstanta DB URL 1× (8 file), login sesi
      1× (5 file), harness assert/lapor 1×, helper UI-verify 1×
      (C-009↔C-010), 1 loader TS (3 macam).
- [x] S2. Rahasia keluar dari skrip — password literal 5 file +
      publishable key (`verify-pg001-nominal.mjs:12`) → env-only +
      fail-fast.
- [x] S3. Disiplin seed/migrasi — cek CI: `seed-version` vs isi seed;
      `check-migrations` + deteksi gap urutan; template trigger
      immutable + policy untuk migrasi baru (jangan tulis ulang
      yang sudah teraplikasi).
- [x] S4. Konsistensi kecil — metadata rute penggajian; `RouteErrorProps`
      1 tipe; `refresh-button` macet → `useTransition`; typo "Master
      produk produk"; alias `@/` ganti `../../../`; nama produk 1
      varian; zona `Asia/Jakarta` bernama ganti `+7h` mentah.

## Fase 5 — Sidebar per siklus (TERAKHIR, setelah Fase 1–4)

Keputusan tercatat 2026-11-27: navigasi naik ke sidebar per siklus
(mengikuti model per-role Figma/shell GJ lama); nav di dalam konten
halaman dihapus. Detail desain dibahas lanjut sebelum fase ini jalan.
Cakupan: semua siklus sekaligus, langsung ready.

- [ ] N1. Kunci desain: AppShell global sebagai level 1 (pindah siklus)
      + sidebar siklus level 2 di tiap area, atau sidebar siklus
      menggantikan AppShell per area. Putuskan varian per-role vs statis.
- [ ] N2. Implement sidebar per siklus untuk semua siklus
      (pendapatan, pengeluaran, produksi, penggajian, laporan).
- [ ] N3. Hapus nav dalam-page: `ProduksiSubnav` (14 layar), breadcrumb
      (master 4×, pengeluaran, GJ `page-header`, produksi), header-nav
      per layar (laporan `SectionHeader` 16×, GJ 15×) → pindah ke
      sidebar siklus.

## Non-tujuan (sengaja tidak dikerjakan)

- Mengubah migrasi yang sudah teraplikasi (selalu fix-forward).
- Abstraksi baru untuk duplikasi <3 tanpa pelanggaran SSOT jelas.
- Perombakan arsitektur lapis (arah dependensi sudah benar).
