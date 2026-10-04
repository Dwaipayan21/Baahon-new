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
      tone: "text-[var(--color-primary)] bg-[var(--color-primary-container-light)]",
    },
    {
      icon: "category",
      value: scorecardStats.categoryCount,
      label: "Categories",
      detail: "Puja styles explored",
      tone: "text-[var(--color-primary)] bg-[var(--color-primary-container-light)]",
    },
    {
      icon: "military_tech",
      value: scorecardStats.totalPoints,
      label: "Points Earned",
      detail: "Your Pujo score",
      tone: "text-[var(--color-primary)] bg-[var(--color-primary-container-light)]",
    },
    {
      icon: "route",
      ...routeStat,
      tone: "text-[var(--color-success)] bg-[var(--color-success-container)]",
    },
  ];

  return (
    <section>
      <div className="mb-2.5 flex items-end justify-between gap-3">
        <h2 className="text-base font-bold text-[var(--color-heading)]">Darshan Highlights</h2>
        <span className="flex items-center gap-1.5 text-[10px] font-semibold text-[var(--color-muted)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-success)]" />
          Saved totals
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <article
            key={stat.label}
            className="min-w-0 rounded-2xl border border-[var(--color-border)] bg-white p-4 shadow-sm"
          >
            <div className="flex items-center justify-between gap-2">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}>
                <span className="material-symbols-outlined text-[18px]">{stat.icon}</span>
              </span>
            </div>
            <p className={`mt-4 truncate text-[22px] font-extrabold leading-none tabular-nums ${
              stat.label === "Points Earned"
                ? "text-[var(--color-marigold)]"
                : "text-[var(--color-heading)]"
            }`}>
              {stat.value}
            </p>
            <p className="mt-1.5 truncate text-[11px] font-semibold text-[var(--color-muted)]">
              {stat.label}
            </p>
            <p className="mt-0.5 truncate text-[10px] text-[var(--color-muted)]">
              {stat.detail}
            </p>
          </article>
        ))}
      </div>
      {Object.keys(categoryCounts).length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {Object.entries(categoryCounts).map(([category, count]) => (
            <span
              key={category}
              className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-[9px] font-medium capitalize text-[var(--color-muted)]"
            >
              {category} <strong className="text-[var(--color-heading-secondary)]">{count}</strong>
            </span>
          ))}
        </div>
      )}
    </section>
  );
};

export default ScoreStats;