const JourneyProgress = ({ visited, total, percentage, remaining }) => {
  const progressWidth = Math.min(percentage, 100);

  return (
    <section className="rounded-xl border border-[#eadfc7] bg-[#fffaf0] px-4 py-3.5 shadow-[0_3px_12px_rgba(80,59,22,0.035)] sm:px-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#f8edcf] text-[#9b6b24]">
            <span className="material-symbols-outlined text-[20px]">map</span>
          </span>
          <div className="min-w-0">
            <p className="text-[10px] font-bold tracking-[0.13em] text-[#8c6b38]">
              YOUR PUJO JOURNEY
            </p>
            <p className="mt-0.5 truncate text-sm font-bold text-[#263b32]">
              {visited} / {total} Pandals
            </p>
          </div>
        </div>
        <span className="shrink-0 text-lg font-extrabold tabular-nums text-[#9d6125]">
          {percentage}%
        </span>
      </div>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-[#eee5d0]"
        role="progressbar"
        aria-label="Pandal journey progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={progressWidth}
      >
        <div
          className="h-full rounded-full bg-[#cb7945] transition-[width] duration-500"
          style={{ width: `${progressWidth}%` }}
        />
      </div>
      <p className="mt-2 text-[10px] font-medium text-[#8b7c60]">
        {remaining} {remaining === 1 ? "pandal" : "pandals"} left to discover
      </p>
    </section>
  );
};

export default JourneyProgress;