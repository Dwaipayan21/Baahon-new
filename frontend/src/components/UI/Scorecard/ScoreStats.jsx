const ScoreStats = ({ scorecardStats, categoryCounts, routeSummary }) => {
  const routeDistanceAvailable = Boolean(routeSummary?.distanceLabel);
  const routeStat = routeDistanceAvailable
    ? {
        value: routeSummary.distanceLabel,
        label: routeSummary.distanceMetricLabel,
        detail: "From the latest route",
      }
    : {
        value: routeSummary ? "Unavailable" : "No route",
        label: "Route Activity",
        detail: routeSummary
          ? "Distance data unavailable"
          : "No route created yet",
      };
  const stats = [
    {
      icon: "temple_hindu",
      value: scorecardStats.visitedCount,
      label: "Pandals Visited",
      detail: "Darshans completed",
      tone: "text-[#a64935] bg-[#fff0e9]",
    },
    {
      icon: "category",
      value: scorecardStats.categoryCount,
      label: "Categories",
      detail: "Puja styles explored",
      tone: "text-[#2e6b5c] bg-[#e9f5ed]",
    },
    {
      icon: "military_tech",
      value: scorecardStats.totalPoints,
      label: "Points Earned",
      detail: "Your Pujo score",
      tone: "text-[#93631b] bg-[#fff4d8]",
    },
    {
      icon: "route",
      ...routeStat,
      tone: "text-[#3665a0] bg-[#edf3ff]",
    },
  ];

  return (
    <section>
      <div className="mb-2.5 flex items-end justify-between gap-3">
        <h2 className="text-base font-bold text-[#1b302b]">Darshan Highlights</h2>
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[#56816b]">
          <span className="h-1.5 w-1.5 rounded-full bg-[#5d9b70]" />
          Saved totals
        </span>
      </div>
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="min-w-0 rounded-xl border border-[#e5e9e2] bg-white p-3.5 shadow-[0_3px_12px_rgba(28,48,39,0.04)] sm:p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${stat.tone}`}>
                <span className="material-symbols-outlined text-[18px]">{stat.icon}</span>
              </span>
              <span className="truncate text-[10px] font-medium text-[#7b8982]">
                {stat.label}
              </span>
            </div>
            <p className="mt-3 truncate text-[22px] font-extrabold leading-none tabular-nums text-[#1c302b] sm:text-2xl">
              {stat.value}
            </p>
            <p className="mt-1 truncate text-[10px] text-[#78857f] sm:text-[11px]">
              {stat.detail}
            </p>
          </article>
        ))}
      </div>
      {Object.keys(categoryCounts).length > 0 && (
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {Object.entries(categoryCounts).map(([category, count]) => (
            <span
              key={category}
              className="rounded-full border border-[#e2e9e2] bg-white px-2.5 py-1 text-[9px] font-medium capitalize text-[#65756b]"
            >
              {category} <strong className="text-[#344c40]">{count}</strong>
            </span>
          ))}
        </div>
      )}
    </section>
  );
};

export default ScoreStats;