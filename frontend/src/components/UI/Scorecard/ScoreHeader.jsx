const ScoreHeader = ({
  totalPoints,
  visitedCount,
  onBack,
}) => {
  return (
    <section className="overflow-hidden rounded-2xl border border-[var(--color-primary)] bg-[var(--color-primary)] shadow-sm">
      <div className="flex h-[68px] items-center gap-3 border-b border-white/10 px-4 sm:px-5">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Explore"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/15 active:scale-[0.97]"
        >
          <span className="material-symbols-outlined text-[20px]">
            arrow_back
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold tracking-tight text-white sm:text-lg">
            Pujo Scorecard
          </p>

          <p className="mt-0.5 text-[10px] font-medium text-white/75 sm:text-[11px]">
            মা আসছেন{" "}
            <span className="px-1 text-[var(--color-marigold-light)]">
              •
            </span>{" "}
            Kolkata
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden text-xs font-bold tracking-wide text-white sm:block">
            Baahon
          </span>

          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
            <span className="material-symbols-outlined text-[21px] text-[var(--color-marigold-light)]">
            emoji_events
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 px-5 py-5 sm:px-6 sm:py-6">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/70">
            Your Pujo Score
          </p>

          <div className="mt-1 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold leading-none tabular-nums text-white sm:text-5xl">
              {totalPoints}
            </span>

            <span className="text-xs font-bold uppercase tracking-[0.08em] text-[var(--color-marigold-light)]">
              Points
            </span>
          </div>
        </div>

        <div className="flex shrink-0 flex-col items-end">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--color-marigold-container)] text-[var(--color-marigold-text)]">
            <span className="material-symbols-outlined material-symbols-filled text-[26px]">
              emoji_events
            </span>
          </div>

          <p className="mt-2 text-[10px] font-semibold text-white/70">
            {visitedCount} {visitedCount === 1 ? "pandal" : "pandals"} visited
          </p>
        </div>
      </div>
    </section>
  );
};

export default ScoreHeader;