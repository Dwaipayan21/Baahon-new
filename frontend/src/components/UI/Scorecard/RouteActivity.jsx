const ActivityMetric = ({ icon, value, label }) => (
  <div className="min-w-0 flex-1 px-2 first:pl-0 last:pr-0 sm:px-3">
    <span className="material-symbols-outlined text-[17px] text-[var(--color-primary)]">
      {icon}
    </span>
    <p className="mt-1 truncate text-base font-extrabold tabular-nums text-[var(--color-heading)] sm:text-lg">
      {value}
    </p>
    <p className="mt-0.5 truncate text-[9px] font-medium text-[var(--color-muted)] sm:text-[10px]">
      {label}
    </p>
  </div>
);

const RouteActivity = ({ routeSummary }) => {
  const metrics = routeSummary
    ? [
        routeSummary.distanceLabel && {
          icon: "route",
          value: routeSummary.distanceLabel,
          label: routeSummary.distanceMetricLabel,
        },
        routeSummary.durationLabel && {
          icon: "schedule",
          value: routeSummary.durationLabel,
          label: routeSummary.durationMetricLabel,
        },
        Number.isFinite(routeSummary.stopCount) && {
          icon: "temple_hindu",
          value: routeSummary.stopCount,
          label: "Pandal stops",
        },
      ].filter(Boolean)
    : [];

  return (
    <section>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--color-primary)]">
            Journey Activity
          </p>
          <h2 className="mt-0.5 text-base font-bold text-[var(--color-heading)]">
            Latest Route
          </h2>
        </div>
        {routeSummary && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-[var(--color-success-container)] px-2.5 py-1 text-[10px] font-bold text-[var(--color-heading-secondary)]">
            <span className="material-symbols-outlined text-[14px]">
              {routeSummary.mode === "metro" ? "train" : "directions_walk"}
            </span>
            {routeSummary.modeLabel}
          </span>
        )}
      </div>
      <div className="rounded-2xl border border-[var(--color-border)] bg-white px-4 py-4 shadow-sm sm:px-5">
        {routeSummary ? (
          <>
            <div className="flex divide-x divide-[var(--color-border)]">
              {metrics.map((metric) => (
                <ActivityMetric key={metric.label} {...metric} />
              ))}
            </div>
            {routeSummary.stationCount > 0 && (
              <p className="mt-3 border-t border-[var(--color-border)] pt-2.5 text-[10px] text-[var(--color-muted)]">
                <span className="material-symbols-outlined mr-1 align-middle text-[14px] text-[var(--color-primary)]">train</span>
                {routeSummary.stationCount} metro {routeSummary.stationCount === 1 ? "station" : "stations"} on this route
              </p>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3 py-1">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--color-primary-container-light)] text-[var(--color-primary)]">
              <span className="material-symbols-outlined text-[20px]">route</span>
            </span>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-[var(--color-heading-secondary)]">No route activity yet</p>
              <p className="mt-0.5 text-[10px] leading-relaxed text-[var(--color-muted)]">
                Route distance and travel time will appear after you create a route.
              </p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default RouteActivity;