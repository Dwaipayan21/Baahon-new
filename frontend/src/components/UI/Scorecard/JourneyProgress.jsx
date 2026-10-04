const JourneyProgress = ({
  visited,
  total,
  percentage,
  remaining,
}) => {
  const progressWidth = Math.min(percentage, 100);

  return (
    <section className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4 shadow-sm sm:px-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-container-light)] text-[var(--color-primary)]">
            <span className="material-symbols-outlined text-[20px]">map</span>
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.13em] text-[var(--color-heading)]">
              Your Puja Journey
            </p>
            <p className="mt-0.5 truncate text-sm font-bold text-[var(--color-heading)]">
              {visited} / {total} Pandals
            </p>
          </div>
        </div>
        <span className="shrink-0 text-lg font-extrabold tabular-nums text-[var(--color-primary)]">
          {percentage}%
        </span>
      </div>
      <div
        className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--color-primary-container)]"
        role="progressbar"
        aria-label="Pandal journey progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressWidth}
      >
        <div
          className="h-full rounded-full bg-[var(--color-primary)] transition-[width] duration-500"
          style={{ width: `${progressWidth}%` }}
        />
      </div>
      <p className="mt-2 text-[10px] font-medium text-[var(--color-muted)]">
        {remaining} {remaining === 1 ? "pandal" : "pandals"} left to discover
      </p>
    </section>
  );
};

export default JourneyProgress;