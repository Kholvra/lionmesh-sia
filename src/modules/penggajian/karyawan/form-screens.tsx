import { Suspense } from "react";

import { createKaryawan, deactivateKaryawan, updateKaryawan } from "@/modules/penggajian/karyawan/actions";
import { KaryawanForm } from "@/modules/penggajian/karyawan/components/karyawan-form";
import { NonaktifForm } from "@/modules/penggajian/karyawan/components/nonaktif-form";
import { KaryawanTidakDitemukan, TidakBerwenang } from "@/modules/penggajian/karyawan/components/states";
import { getDaftarAktif, getKaryawanUntukUbah } from "@/modules/penggajian/karyawan/queries";
import { aksesSesi } from "@/modules/penggajian/karyawan/sesi";
import { Notice } from "@/modules/penggajian/ui/notice";
import { PageHeader } from "@/modules/penggajian/ui/page-header";
import { ui } from "@/modules/penggajian/ui/kelas";

const ITEM = "GJ-001 Mengelola data karyawan";
const DAFTAR = { href: "/penggajian/karyawan", label: "Data karyawan" };

function Memuat({ title }: { title: string }) {
  return <PageHeader back={DAFTAR} description="Memuat formulir…" item={ITEM} title={title} />;
}

async function TambahKonten() {
  const akses = await aksesSesi();
  const header = (
    <PageHeader
      back={DAFTAR}
      description="Data harus unik dan setiap perubahan tercatat dengan pelaku dan waktunya."
      item={ITEM}
      title="Tambah karyawan"
    />
  );
  if (!akses.bolehMengubah) return (<>{header}<TidakBerwenang /></>);

  return (
    <>
      {header}
      <KaryawanForm aksi={createKaryawan} batalHref={DAFTAR.href} daftar={await getDaftarAktif()} />
    </>
  );
}

export function KaryawanTambahScreen() {
  return (
    <Suspense fallback={<Memuat title="Tambah karyawan" />}>
      <TambahKonten />
    </Suspense>
  );
}

async function UbahKonten({ id }: { id: string }) {
  const akses = await aksesSesi();
  const back = { href: `/penggajian/karyawan/${id}`, label: "Detail karyawan" };
  if (!akses.bolehMengubah) {
    return (<><PageHeader back={back} item={ITEM} title="Ubah data karyawan" /><TidakBerwenang /></>);
  }
  const karyawan = await getKaryawanUntukUbah(id, akses);
  if (!karyawan) {
    return (<><PageHeader back={DAFTAR} item={ITEM} title="Ubah data karyawan" /><KaryawanTidakDitemukan /></>);
  }

  return (
    <>
      <PageHeader
        back={back}
        description="NIK tetap. Perubahan gaji pokok dicatat sebagai entri baru di halaman detail."
        item={ITEM}
        title={`Ubah data karyawan / ${karyawan.nama}`}
      />
      {karyawan.status === "NONAKTIF" ? (
        <Notice title="Karyawan nonaktif tidak bisa diubah." tone="warning" />
      ) : (
        <KaryawanForm
          aksi={updateKaryawan.bind(null, id)}
          batalHref={back.href}
          daftar={await getDaftarAktif()}
          karyawan={karyawan}
        />
      )}
    </>
  );
}

export function KaryawanUbahScreen({ id }: { id: string }) {
  return (
    <Suspense fallback={<Memuat title="Ubah data karyawan" />}>
      <UbahKonten id={id} />
    </Suspense>
  );
}

async function StatusKonten({ id }: { id: string }) {
  const akses = await aksesSesi();
  const back = { href: `/penggajian/karyawan/${id}`, label: "Detail karyawan" };
  if (!akses.bolehMengubah) {
    return (<><PageHeader back={back} item={ITEM} title="Nonaktifkan karyawan" /><TidakBerwenang /></>);
  }
  const karyawan = await getKaryawanUntukUbah(id, akses);
  if (!karyawan) {
    return (<><PageHeader back={DAFTAR} item={ITEM} title="Nonaktifkan karyawan" /><KaryawanTidakDitemukan /></>);
  }

  return (
    <>
      <PageHeader
        back={back}
        description="Nonaktif bukan hapus. Data, riwayat gaji, dan presensi tetap tersimpan."
        item={ITEM}
        title={`Nonaktifkan karyawan / ${karyawan.nama}`}
      />
      <div className={ui.stack}>
        {karyawan.status === "NONAKTIF" ? (
          <Notice title="Karyawan ini sudah nonaktif." tone="info" />
        ) : (
          <>
            <NonaktifForm aksi={deactivateKaryawan.bind(null, id)} batalHref={back.href} nama={karyawan.nama} />
            <Notice title="Dampak perubahan" tone="info">
              <p>Karyawan nonaktif tidak bisa dipilih untuk dokumen baru, misalnya presensi.</p>
              <p>Gaji karyawan yang keluar di tengah periode dihitung prorata saat perhitungan gaji.</p>
            </Notice>
          </>
        )}
      </div>
    </>
  );
}

export function KaryawanStatusScreen({ id }: { id: string }) {
  return (
    <Suspense fallback={<Memuat title="Nonaktifkan karyawan" />}>
      <StatusKonten id={id} />
    </Suspense>
  );
}
