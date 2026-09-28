const ScoreHeader = ({ totalPoints, visitedCount, onBack }) => {
  return (
    <section className="overflow-hidden rounded-2xl border border-[#19443c] bg-[#153f38] px-5 py-4 text-white shadow-[0_12px_28px_rgba(21,63,56,0.15)] sm:px-7 sm:py-5">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Explore"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition hover:bg-white/20"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
        <p className="min-w-0 flex-1 text-center text-xs font-bold tracking-[0.12em] text-white/90 sm:text-sm">
          PUJO SCORECARD
        </p>
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 text-[#f6cb71]">
          <span className="material-symbols-outlined text-[20px]">person</span>
        </span>
      </div>

      <p className="mt-3 text-center text-xs font-medium text-white/65">
        Maa Asche <span className="px-1 text-[#f6cb71]">•</span> Kolkata
      </p>

      <div className="mt-3 flex items-center justify-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f2c66d] text-[#543914] shadow-inner">
          <span className="material-symbols-outlined material-symbols-filled text-[25px]">emoji_events</span>
        </span>
        <div className="text-center">
          <p className="text-[10px] font-bold tracking-[0.18em] text-[#f4d38c]">
            YOUR PUJO SCORE
          </p>
          <div className="mt-0.5 flex items-baseline justify-center gap-2">
            <span className="text-4xl font-extrabold leading-none tabular-nums sm:text-5xl">
              {totalPoints}
            </span>
            <span className="text-[10px] font-bold tracking-[0.18em] text-white/65">
              POINTS
            </span>
          </div>
        </div>
      </div>

      <p className="mt-3 text-center text-[10px] font-semibold tracking-[0.14em] text-white/60">
        {visitedCount} {visitedCount === 1 ? "PANDAL" : "PANDALS"} VISITED
      </p>
    </section>
  );
};

export default ScoreHeader;