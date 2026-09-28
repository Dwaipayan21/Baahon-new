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
    <section className="rounded-xl border border-[#dce8e1] bg-[#edf5ef] px-4 py-3.5 sm:px-5">
      <div className="flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#34715b] shadow-sm">
          <span className="material-symbols-outlined text-[20px]">campaign</span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-[10px] font-bold tracking-[0.14em] text-[#5b7868]">CROWD PULSE</p>
              <h2 className="mt-0.5 text-sm font-bold text-[#203b30]">Crowd status across loaded pandals</h2>
            </div>
            <span className="rounded-full border border-[#cfe0d3] bg-white/80 px-2 py-1 text-[9px] font-semibold text-[#4d7660]">
              {available} / {pandals.length} pandals with crowd data
            </span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-lg bg-white/80 px-2.5 py-2">
              <p className="text-base font-extrabold tabular-nums text-[#347454]">{counts.low}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[#718078]">Low crowd</p>
            </div>
            <div className="rounded-lg bg-white/80 px-2.5 py-2">
              <p className="text-base font-extrabold tabular-nums text-[#a67523]">{counts.moderate}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[#718078]">Moderate crowd</p>
            </div>
            <div className="rounded-lg bg-white/80 px-2.5 py-2">
              <p className="text-base font-extrabold tabular-nums text-[#a64f48]">{counts.high}</p>
              <p className="text-[9px] font-semibold uppercase tracking-wide text-[#718078]">High crowd</p>
            </div>
          </div>
          <p className="mt-2 text-[9px] text-[#718078]">
            {counts.observations.toLocaleString("en-IN")} crowd observations across loaded pandals
          </p>
        </div>
      </div>
    </section>
  );
};

export default CrowdReporterCard;