import Link from "next/link";
import { Suspense } from "react";

import { BelumAdaKaryawan, TidakBerwenang } from "@/modules/penggajian/karyawan/components/states";
import { KaryawanTable, KaryawanTableLoading } from "@/modules/penggajian/karyawan/components/karyawan-table";
import { listKaryawan } from "@/modules/penggajian/karyawan/queries";
import { aksesSesi } from "@/modules/penggajian/karyawan/sesi";
import { PageHeader } from "@/modules/penggajian/shell/page-header";
import ui from "@/modules/penggajian/shell/ui.module.css";

const ITEM = "GJ-001 Mengelola data karyawan";
const JUDUL = "Data karyawan";
const DESKRIPSI = "Kelola identitas, informasi penggajian, dan status hubungan kerja.";

async function DaftarKaryawan() {
  const akses = await aksesSesi();
  if (!akses.bolehMembaca) {
    return (
      <>
        <PageHeader item={ITEM} title={JUDUL} />
        <TidakBerwenang />
      </>
    );
  }

  const rows = await listKaryawan(akses);
  return (
    <>
      <PageHeader
        actions={
          akses.bolehMengubah ? (
            <Link className={`${ui.button} ${ui.primary}`} href="/penggajian/karyawan/tambah">
              Tambah karyawan
            </Link>
          ) : null
        }
        description={DESKRIPSI}
        item={ITEM}
        title={JUDUL}
      />
      <section className={ui.card}>
        <h2 className={ui.cardTitle}>Direktori karyawan</h2>
        {rows.length === 0 ? (
          <BelumAdaKaryawan bolehTambah={akses.bolehMengubah} />
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
          <PageHeader description={DESKRIPSI} item={ITEM} title={JUDUL} />
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
