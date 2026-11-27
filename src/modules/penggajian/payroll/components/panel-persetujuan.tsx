import Link from "next/link";

import type { Peran } from "@/lib/auth";
import { approvePayroll, checkPayroll } from "@/modules/penggajian/payroll/persetujuan-actions";
import type { DraftView } from "@/modules/penggajian/payroll/queries";
import { terkunci } from "@/modules/penggajian/payroll/status";
import { Notice } from "@/modules/penggajian/ui/notice";
import { ui } from "@/modules/penggajian/ui/kelas";
import { FormAksi } from "@/modules/penggajian/shared/form-aksi";

/** Accounting checks a calculated draft; Direksi approves a checked one; both may return it with a reason. */
export function PanelPersetujuan({ draft, peran }: { draft: DraftView; peran: Peran | null }) {
  const kembali = (label: string) => (
    <Link className={ui.buttonDanger} href={`/penggajian/payroll/${draft.periodeId}/kembalikan`}>{label}</Link>
  );
  if (terkunci(draft.status)) {
    return <Notice title="Draft disetujui dan dikunci" tone="success"><p>Tidak ada aksi buka kunci. Koreksi hanya lewat jurnal pembalik di pembukuan gaji.</p></Notice>;
  }
  if (peran === "Accounting" && draft.status === "DRAFT_TERHITUNG") {
    return (
      <FormAksi aksi={checkPayroll} isian={[]} kirimLabel="Verifikasi & teruskan" tersembunyi={{ periodeId: draft.periodeId }} />
    );
  }
  if (peran === "Accounting" && draft.status === "DIPERIKSA") {
    return <div className={ui.formActions}>{kembali("Kembalikan ke HR")}</div>;
  }
  if (peran === "Direksi" && draft.status === "DIPERIKSA") {
    return (
      <div className={ui.formActions}>
        <FormAksi
          aksi={approvePayroll}
          isian={[]}
          kirimLabel="Setujui payroll"
          konfirmasi={{ judul: "Setujui dan kunci payroll?", pesan: "Draft dikunci dan jurnal akrual dibuat. Tidak ada buka kunci; koreksi hanya lewat jurnal pembalik.", ya: "Ya, setujui" }}
          tersembunyi={{ periodeId: draft.periodeId }}
        />
        {kembali("Kembalikan dengan alasan")}
      </div>
    );
  }
  if (peran === "Direksi" && draft.status === "DRAFT_TERHITUNG") {
    return <Notice title="Menunggu pemeriksaan Accounting" tone="info"><p>Persetujuan Direksi baru bisa setelah draft diperiksa.</p></Notice>;
  }
  return null;
}
