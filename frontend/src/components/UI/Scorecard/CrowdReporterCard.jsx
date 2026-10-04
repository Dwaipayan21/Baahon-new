const CrowdReporterCard = ({ pandals }) => {
  const counts = pandals.reduce(
    (summary, pandal) => {
      const status = String(pandal.crowdStatus || "UNKNOWN").toUpperCase();
      if (status === "LOW") summary.low += 1;
      else if (status === "MODERATE" || status === "MEDIUM") summary.moderate += 1;
      else if (status === "HIGH") summary.high += 1;

      summary.observations += Number(pandal.crowdSampleCount) || 0;
      return summary;
    },
    { low: 0, moderate: 0, high: 0, observations: 0 }
  );
  const available = counts.low + counts.moderate + counts.high;

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4 shadow-sm sm:px-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[var(--color-surface)] text-[var(--color-success)] shadow-sm">
          <span className="material-symbols-outlined text-[20px]">campaign</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold tracking-[0.14em] text-[var(--color-heading-secondary)]">CROWD PULSE</p>
              <h2 className="mt-0.5 text-sm font-bold text-[var(--color-heading)]">Crowd status across loaded pandals</h2>
            </div>
            <span className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)]/80 px-2 py-1 text-[9px] font-semibold text-[var(--color-text)]">
              {available} / {pandals.length} pandals with crowd data
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-[var(--color-surface)]/80 px-2.5 py-2">
              <p className="text-base font-extrabold tabular-nums text-[var(--color-heading-secondary)]">{counts.low}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Low crowd</p>
            </div>
            <div className="rounded-lg bg-[var(--color-surface)]/80 px-2.5 py-2">
              <p className="text-base font-extrabold tabular-nums text-[var(--color-marigold-text)]">{counts.moderate}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">Moderate crowd</p>
            </div>
            <div className="rounded-lg bg-[var(--color-surface)]/80 px-2.5 py-2">
              <p className="text-base font-extrabold tabular-nums text-[var(--color-marigold-text)]">{counts.high}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[var(--color-muted)]">High crowd</p>
            </div>
          </div>
          <p className="mt-2 text-[9px] text-[var(--color-muted)]">
            {counts.observations.toLocaleString("en-IN")} crowd observations across loaded pandals
          </p>
        </div>
      </div>
    </section>
  );
};

export default CrowdReporterCard;