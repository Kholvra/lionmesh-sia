// Tailwind classes shared by the payroll screens. Values come from the tokens
// in globals.css. Buttons and the select live here because FND-007 has no
// Button or Select primitive yet.

const label = "text-[length:var(--font-size-label)] leading-[var(--line-height-label)]";
const body = "text-[length:var(--font-size-body)] leading-[var(--line-height-body)]";
const bodySm = "text-[length:var(--font-size-body-sm)] leading-[var(--line-height-body-sm)]";
const focusRing =
  "focus-visible:outline-[length:var(--focus-ring-width)] focus-visible:outline-[var(--border-focus)] focus-visible:outline-solid focus-visible:outline-offset-[var(--focus-ring-offset)]";

// globals.css sets `font: inherit` on form controls and `color: inherit` on
// buttons outside any cascade layer, which beats layered utilities. Font and
// text colour on controls therefore carry `!`.
const kontrolBody = "text-[length:var(--font-size-body)]! leading-[var(--line-height-body)]!";
const kontrolBodySm = "text-[length:var(--font-size-body-sm)]! leading-[var(--line-height-body-sm)]!";

const tombolDasar = [
  "inline-flex items-center justify-center whitespace-nowrap cursor-pointer no-underline font-semibold!",
  "rounded-[var(--radius-md)] border-[length:var(--border-width-default)] border-solid",
  "transition-colors duration-[var(--motion-fast)] ease-out motion-reduce:duration-[var(--motion-none)]",
  "disabled:cursor-progress disabled:opacity-70",
  focusRing,
].join(" ");
const tombolSedang = `h-[var(--control-height)] px-[var(--space-4)] ${kontrolBody}`;
const tombolSekunder =
  "border-[var(--border-strong)] bg-[var(--bg-surface)] text-[color:var(--text-primary)]! hover:border-[var(--ink-300)] hover:bg-[var(--bg-subtle)]";

export const ui = {
  header: "grid gap-[var(--space-2)] mb-[var(--space-8)]",
  backLink: `justify-self-start font-semibold no-underline hover:underline text-[color:var(--text-link)] ${label}`,
  breadcrumb:
    "m-0 text-[color:var(--text-secondary)] text-[length:var(--font-size-caption)] leading-[var(--line-height-caption)]",
  breadcrumbCycle: "text-[color:var(--text-link)]",
  headerRow: "flex items-end justify-between gap-[var(--space-6)]",
  headerText: "grid gap-[var(--space-2)]",
  title:
    "m-0 font-bold tracking-[-0.01em] text-[color:var(--text-primary)] text-[length:var(--font-size-title)] leading-[var(--line-height-title)]",
  description: `m-0 text-[color:var(--text-secondary)] ${bodySm}`,
  actions: "flex flex-wrap gap-[var(--space-3)]",

  stack: "grid gap-[var(--space-6)]",
  card: "grid gap-[var(--space-4)] p-[var(--space-5)] border-[length:var(--border-width-default)] border-solid border-[var(--border-subtle)] rounded-[var(--radius-lg)] bg-[var(--bg-surface)] shadow-[var(--shadow-sm)]",
  cardHeader: "flex items-center justify-between gap-[var(--space-4)]",
  cardTitle:
    "m-0 font-semibold text-[color:var(--text-primary)] text-[length:var(--font-size-section)] leading-[var(--line-height-section)]",
  cardHint: `m-0 text-[color:var(--text-muted)] ${label}`,
  grid: "grid grid-cols-12 items-start gap-[var(--space-6)]",
  span8: "col-span-8",
  span4: "col-span-4",

  formGrid: "grid grid-cols-2 items-start gap-x-[var(--space-6)] gap-y-[var(--space-4)]",
  formSection:
    "m-0 p-0 border-0 grid gap-[var(--space-4)] [&+&]:pt-[var(--space-4)] [&+&]:border-t-[length:var(--border-width-default)] [&+&]:border-solid [&+&]:border-[var(--border-subtle)]",
  legend: `p-0 mb-[var(--space-2)] font-semibold text-[color:var(--text-primary)] ${body}`,
  formActions: "flex gap-[var(--space-3)]",
  select: [
    "w-full h-[var(--control-height)] px-[var(--space-3)]",
    "border-[length:var(--border-width-default)] border-solid border-[var(--border-input)] rounded-[var(--radius-md)]",
    "bg-[var(--bg-surface)] text-[color:var(--text-primary)]",
    kontrolBody,
    "focus-visible:border-[var(--border-focus)] aria-invalid:border-[var(--status-danger-text)]",
    focusRing,
  ].join(" "),

  button: `${tombolDasar} ${tombolSedang} ${tombolSekunder}`,
  buttonSmall: `${tombolDasar} ${tombolSekunder} h-[var(--button-sm-height)] px-[var(--space-3)] ${kontrolBodySm}`,
  buttonPrimary: `${tombolDasar} ${tombolSedang} border-[var(--brand-500)] bg-[var(--brand-500)] text-[color:var(--text-on-brand)]! hover:border-[var(--brand-600)] hover:bg-[var(--brand-600)]`,
  buttonDanger: `${tombolDasar} ${tombolSedang} border-[var(--status-danger-text)] bg-[var(--bg-surface)] text-[color:var(--status-danger-text)]! hover:bg-[var(--status-danger-bg)]`,

  notice: [
    "grid gap-[var(--space-1)] px-[var(--space-4)] py-[var(--space-3)] rounded-[var(--radius-md)]",
    bodySm,
    "data-[tone=success]:bg-[var(--status-success-bg)] data-[tone=success]:text-[color:var(--status-success-text)]",
    "data-[tone=danger]:bg-[var(--status-danger-bg)] data-[tone=danger]:text-[color:var(--status-danger-text)]",
    "data-[tone=warning]:bg-[var(--status-warning-bg)] data-[tone=warning]:text-[color:var(--status-warning-text)]",
    "data-[tone=info]:bg-[var(--status-info-bg)] data-[tone=info]:text-[color:var(--status-info-text)]",
  ].join(" "),
  noticeTitle: "m-0 font-semibold",
  noticeBody: "text-[color:var(--text-primary)] [&_p]:m-0",

  facts: "m-0 grid grid-cols-2 gap-x-[var(--space-6)] gap-y-[var(--space-4)]",
  fact: [
    "grid gap-[var(--space-1)]",
    "[&_dt]:text-[color:var(--text-muted)] [&_dt]:text-[length:var(--font-size-label)] [&_dt]:leading-[var(--line-height-label)]",
    "[&_dd]:m-0 [&_dd]:text-[color:var(--text-primary)] [&_dd]:text-[length:var(--font-size-body)] [&_dd]:leading-[var(--line-height-body)]",
  ].join(" "),
  numeric: "tabular-nums!",

  table: [
    "w-full border-collapse",
    bodySm,
    "[&_th]:h-[var(--table-header-height)] [&_th]:px-[var(--space-4)] [&_th]:bg-[var(--bg-subtle)] [&_th]:text-[color:var(--text-muted)]",
    "[&_th]:text-[length:var(--font-size-caption)] [&_th]:font-medium [&_th]:tracking-[var(--letter-spacing-caption)] [&_th]:text-start [&_th]:uppercase",
    "[&_td]:h-[var(--table-row-height)] [&_td]:px-[var(--space-4)] [&_td]:py-[var(--space-3)] [&_td]:text-[color:var(--text-primary)]",
    "[&_td]:border-b-[length:var(--border-width-default)] [&_td]:border-solid [&_td]:border-[var(--border-subtle)]",
  ].join(" "),
  // Wins over the table's start alignment for th and td alike.
  right: "text-end!",

  timeline: [
    "m-0 p-0 list-none grid gap-[var(--space-3)]",
    "[&>li]:grid [&>li]:gap-[var(--space-1)] [&>li]:pb-[var(--space-3)]",
    "[&>li]:border-b-[length:var(--border-width-default)] [&>li]:border-solid [&>li]:border-[var(--border-subtle)]",
    "[&>li:last-child]:pb-0 [&>li:last-child]:border-b-0",
  ].join(" "),
  timelineMeta: `text-[color:var(--text-muted)] ${label}`,

  toolbar: "flex items-end gap-[var(--space-4)]",
  toolbarField: `grid gap-[var(--space-2)] min-w-[240px] font-semibold text-[color:var(--text-primary)] ${label}`,
  empty:
    "grid justify-items-start gap-[var(--space-3)] px-[var(--space-6)] py-[var(--space-12)] text-[color:var(--text-secondary)] [&_p]:m-0",

  // Read-only field: label above a grey box, matching the Figma read-only inputs.
  bidangBaca: "grid gap-[var(--space-2)]",
  bidangLabel: `text-[color:var(--text-secondary)] ${label}`,
  bidangNilai: [
    "flex items-center min-h-[var(--control-height)] px-[var(--space-3)] py-[var(--space-2)]",
    "border-[length:var(--border-width-default)] border-solid border-[var(--border-subtle)] rounded-[var(--radius-md)]",
    "bg-[var(--bg-subtle)] text-[color:var(--text-primary)]",
    body,
  ].join(" "),
  // Added by GJ-002.
  formWide: "col-span-full",
  // Two-column card body used by "Presensi hari ini".
  duaKolom: "grid grid-cols-2 items-start gap-[var(--space-6)]",
  angkaBesar:
    "m-0 font-bold tabular-nums text-[color:var(--text-primary)] text-[length:var(--font-size-display)] leading-[var(--line-height-display)]",
  teksTebal:
    "m-0 font-semibold text-[color:var(--text-primary)] text-[length:var(--font-size-section)] leading-[var(--line-height-section)]",

  // Added by GJ-003.
  // Process stepper (Figma "Stepper alur rekap"). Each step carries data-status.
  stepper:
    "m-0 flex items-center gap-[var(--space-3)] px-[var(--space-5)] py-[var(--space-4)] list-none border-[length:var(--border-width-default)] border-solid border-[var(--border-subtle)] rounded-[var(--radius-lg)] bg-[var(--bg-surface)]",
  langkah: [
    "group flex flex-[1_1_0] items-center gap-[var(--space-2)]",
    "not-last:after:content-[''] not-last:after:flex-[1_1_auto] not-last:after:h-[var(--border-width-default)] not-last:after:ms-[var(--space-2)] not-last:after:bg-[var(--border-subtle)]",
    "data-[status=selesai]:not-last:after:bg-[var(--text-primary)]",
  ].join(" "),
  langkahNomor: [
    "inline-flex flex-none items-center justify-center size-[var(--space-6)] rounded-[var(--radius-full)] font-semibold text-[length:var(--font-size-caption)]",
    "border-[length:var(--border-width-default)] border-solid border-[var(--border-input)] text-[color:var(--text-secondary)]",
    "group-data-[status=selesai]:border-[var(--text-primary)] group-data-[status=selesai]:bg-[var(--text-primary)] group-data-[status=selesai]:text-[color:var(--text-inverse)]",
    "group-data-[status=aktif]:border-[var(--brand-500)] group-data-[status=aktif]:bg-[var(--brand-500)] group-data-[status=aktif]:text-[color:var(--text-on-brand)]",
  ].join(" "),
  langkahTeks: "grid",
  langkahLabel: `text-[color:var(--text-primary)] ${bodySm} group-data-[status=aktif]:font-semibold group-data-[status=berikutnya]:text-[color:var(--text-secondary)]`,
  langkahPeran:
    "text-[color:var(--text-muted)] text-[length:var(--font-size-caption)] leading-[var(--line-height-caption)]",

  // Decision timeline with a coloured marker per event (Figma "Linimasa keputusan").
  linimasa: [
    "m-0 p-0 list-none grid gap-[var(--space-4)]",
    "[&>li]:relative [&>li]:grid [&>li]:gap-[var(--space-1)] [&>li]:ps-[var(--space-6)]",
    "[&>li]:before:content-[''] [&>li]:before:absolute [&>li]:before:top-[var(--space-1)] [&>li]:before:start-0 [&>li]:before:size-[var(--space-3)] [&>li]:before:rounded-[var(--radius-full)] [&>li]:before:bg-[var(--text-muted)]",
    "[&>li[data-tone=success]]:before:bg-[var(--status-success-text)] [&>li[data-tone=danger]]:before:bg-[var(--status-danger-text)]",
    "[&>li[data-tone=warning]]:before:bg-[var(--status-warning-text)] [&>li[data-tone=info]]:before:bg-[var(--status-info-text)]",
  ].join(" "),
  linimasaKepala: "flex flex-wrap items-center gap-[var(--space-2)]",

  // Stacked cell content (chip above a note) that keeps chips at their own width.
  selTumpuk: "grid justify-items-start gap-[var(--space-1)]",
} as const;
