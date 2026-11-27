import Link from "next/link";
import { Suspense } from "react";

import { PageHeader } from "@/components/ui/page-header";
import { EmptyState, ErrorState } from "@/components/ui/states";
import { KaryawanTable, KaryawanTableLoading } from "@/modules/penggajian/karyawan/components/karyawan-table";
import { listKaryawan } from "@/modules/penggajian/karyawan/queries";
import { aksesSesi } from "@/modules/penggajian/karyawan/sesi";
import { ui } from "@/modules/penggajian/ui/kelas";

const ITEM = "GJ-001 Mengelola data karyawan";
const JUDUL = "Data karyawan";
const DESKRIPSI = "Kelola identitas, informasi penggajian, dan status hubungan kerja.";
const BREADCRUMB = [
  { label: "Siklus Penggajian", accent: true },
  ITEM,
] as const;

async function DaftarKaryawan() {
  const akses = await aksesSesi();
  if (!akses.bolehMembaca) {
    return (
      <>
        <PageHeader breadcrumb={BREADCRUMB} title={JUDUL} />
        <ErrorState
          judul="Anda tidak punya akses ke data karyawan"
          teks="Data karyawan hanya bisa dibuka oleh HR, Accounting, dan Finance. Hubungi HR bila Anda membutuhkannya."
          variant="compact"
        />
      </>
    );
  }

  const rows = await listKaryawan(akses);
  return (
    <>
      <PageHeader
        actions={
          akses.bolehMengubah ? (
            <Link className={ui.buttonPrimary} href="/penggajian/karyawan/tambah">
              Tambah karyawan
            </Link>
          ) : null
        }
        description={DESKRIPSI}
        breadcrumb={BREADCRUMB}
        title={JUDUL}
      />
      <section className={ui.card}>
        <h2 className={ui.cardTitle}>Direktori karyawan</h2>
        {rows.length === 0 ? (
          <EmptyState
            actionHref="/penggajian/karyawan/tambah"
            actionLabel={akses.bolehMengubah ? "Tambah karyawan" : undefined}
            judul="Belum ada data karyawan"
            teks="Tambahkan karyawan pertama agar presensi dan penggajian bisa dicatat."
            variant="compact"
          />
        ) : (
          <KaryawanTable rows={rows} tampilIdentitas={akses.identitas} tampilRekening={akses.rekening} />
        )}
      </section>
    </>
  );
}

export function KaryawanListScreen() {
  return (
    <Suspense
      fallback={
        <>
          <PageHeader breadcrumb={BREADCRUMB} description={DESKRIPSI} title={JUDUL} />
          <section aria-busy="true" className={ui.card}>
            <h2 className={ui.cardTitle}>Direktori karyawan</h2>
            <KaryawanTableLoading />
          </section>
        </>
      }
    >
      <DaftarKaryawan />
    </Suspense>
  );
}
