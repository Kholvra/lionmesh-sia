export type SpkStep = {
  step: number;
  title: string;
  actor: string;
};

export type SpkStepperProps = {
  activeStep: number;
  steps?: readonly SpkStep[];
  completedMarker?: "check" | "number";
  connectorTone?: "neutral" | "completed";
  hoverable?: boolean;
  className?: string;
};

export const SPK_STEPS: readonly SpkStep[] = [
  { step: 1, title: "Direncanakan", actor: "Produksi" },
  { step: 2, title: "Cek bahan", actor: "Gudang" },
  { step: 3, title: "Berjalan", actor: "Gudang · Produksi" },
  { step: 4, title: "Hasil dicatat", actor: "Produksi" },
  { step: 5, title: "QC lulus", actor: "QC" },
  { step: 6, title: "Selesai", actor: "Gudang" },
];

const SECTION =
  "shadow-card rounded-[var(--radius-md)] border border-transparent bg-[var(--bg-surface)] px-[var(--space-5)] py-[var(--space-3)]";
const CIRCLE_BASE =
  "flex size-[var(--space-6)] shrink-0 items-center justify-center rounded-full text-[length:var(--font-size-caption)] font-semibold";
const CIRCLE_CURRENT =
  "bg-[var(--brand-500)] text-[color:var(--text-inverse)]";
const CIRCLE_COMPLETED =
  "bg-[var(--status-success-bg)] text-[color:var(--status-success-text)]";
const CIRCLE_UPCOMING =
  "border border-[color:var(--border-input)] bg-[var(--bg-surface)] text-[color:var(--text-secondary)]";
const TITLE_BASE = "m-0 text-[length:var(--font-size-label)]";
const TITLE_CURRENT =
  "font-semibold text-[color:var(--text-primary)]";
const TITLE_OTHER = "font-medium text-[color:var(--text-secondary)]";
const ACTOR =
  "mt-[var(--space-1)] text-[length:var(--font-size-caption)] text-[color:var(--text-muted)]";
const CONNECTOR =
  "hidden h-0.5 w-14 shrink-0 lg:block xl:w-20";
const CONNECTOR_NEUTRAL = "bg-[var(--border-strong)]";
const CONNECTOR_COMPLETED = "bg-[var(--status-success-bg)]";

/** Presentational six-stage SPK stepper. Callers own the active step number. */
export function SpkStepper({
  activeStep,
  className,
  completedMarker = "check",
  connectorTone = "completed",
  hoverable = false,
  steps = SPK_STEPS,
}: SpkStepperProps) {
  return (
    <section
      className={`${SECTION} ${
        hoverable
          ? "transition-shadow duration-[var(--motion-fast)] hover:shadow-md"
          : ""
      } ${className ?? ""}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-[var(--space-2)]">
        {steps.map((item, idx) => {
          const isCurrent = item.step === activeStep;
          const isCompleted = item.step < activeStep;
          return (
            <div className="contents" key={item.step}>
              <div className="flex shrink-0 items-center gap-[var(--space-2)]">
                <span
                  className={`${CIRCLE_BASE} ${
                    isCurrent
                      ? CIRCLE_CURRENT
                      : isCompleted
                        ? CIRCLE_COMPLETED
                        : CIRCLE_UPCOMING
                  }`}
                >
                  {isCompleted && completedMarker === "check"
                    ? "✓"
                    : item.step}
                </span>
                <div className="whitespace-nowrap leading-tight">
                  <p
                    className={`${TITLE_BASE} ${
                      isCurrent ? TITLE_CURRENT : TITLE_OTHER
                    }`}
                  >
                    {item.title}
                  </p>
                  <p className={ACTOR}>{item.actor}</p>
                </div>
              </div>
              {idx < steps.length - 1 ? (
                <div
                  className={`${CONNECTOR} ${
                    connectorTone === "completed" && isCompleted
                      ? CONNECTOR_COMPLETED
                      : CONNECTOR_NEUTRAL
                  }`}
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
