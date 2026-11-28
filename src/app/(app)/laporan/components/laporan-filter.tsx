import { Select } from "@/components/ui/select";
import { SubmitButton } from "@/components/ui/submit-button";
import type { PeriodeLaporan } from "@/core/ledger";
import styles from "../laporan.module.css";

export interface OpsiFilter {
  value: string;
  label: string;
}

export interface SelectFilter {
  name: string;
  label: string;
  value?: string;
  options: readonly OpsiFilter[];
}

interface LaporanFilterProps {
  action: string;
  periodeOptions: readonly PeriodeLaporan[];
  periodeValue?: string;
  selects?: readonly SelectFilter[];
}

export function LaporanFilter({
  action,
  periodeOptions,
  periodeValue,
  selects = [],
}: LaporanFilterProps) {
  const nilaiPeriode = periodeValue ?? periodeOptions[0]?.kunci ?? "";

  return (
    <form action={action} className={styles.filter} method="get">
      <div className={styles.filterField}>
        <label className={styles.filterLabel} htmlFor="periode">
          Periode
        </label>
        <Select
          className={styles.select}
          defaultValue={nilaiPeriode}
          id="periode"
          name="periode"
        >
          {periodeOptions.length === 0 ? (
            <option value="">Belum ada periode</option>
          ) : (
            periodeOptions.map((periode) => (
              <option key={periode.kunci} value={periode.kunci}>
                {periode.label}
              </option>
            ))
          )}
        </Select>
      </div>

      {selects.map((select) => (
        <div className={styles.filterField} key={select.name}>
          <label className={styles.filterLabel} htmlFor={select.name}>
            {select.label}
          </label>
          <Select
            className={styles.select}
            defaultValue={select.value ?? select.options[0]?.value ?? ""}
            id={select.name}
            name={select.name}
          >
            {select.options.length === 0 ? (
              <option value="">Tidak ada pilihan</option>
            ) : (
              select.options.map((opsi) => (
                <option key={opsi.value} value={opsi.value}>
                  {opsi.label}
                </option>
              ))
            )}
          </Select>
        </div>
      ))}

      <SubmitButton className={styles.primaryButton} type="submit">
        Tampilkan
      </SubmitButton>
    </form>
  );
}
