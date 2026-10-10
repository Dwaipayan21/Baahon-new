
import CrowdBadge from "./CrowdBadge";

const PandalInfoCard = ({
  pandal,
  routeDistance,
  routeDuration,
  routeLoading = false,
}) => {
  return (
    <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-slate-100 bg-slate-50/80 p-2">
      {/* Pandal image — no star rating */}
      <div className="relative h-16 w-[72px] shrink-0 overflow-hidden rounded-xl bg-slate-200 sm:h-20 sm:w-22">
        <img
          alt={pandal.name}
          className="h-full w-full object-cover"
          src={pandal.image}
          loading="lazy"
        />
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-between gap-1 py-0.5">
        {/* Crowd status — no category tags */}
        <div className="flex items-center">
          <CrowdBadge
            status={pandal.crowdStatus}
            observedAt={pandal.crowdObservedAt}
          />
        </div>

        {/* Address */}
        <div className="flex min-w-0 items-center gap-1 truncate text-xs text-slate-600">
          <span className="material-symbols-outlined shrink-0 text-[14px] text-slate-400">
            pin_drop
          </span>

          <span className="truncate">{pandal.address}</span>
        </div>

        {/* Distance, time and metro station */}
        <div className="flex min-w-0 items-center gap-2 text-[11px] font-semibold text-[var(--color-heading)]">
          <span className="flex min-w-0 shrink-0 items-center gap-1 text-[var(--color-primary)]">
            <span className="material-symbols-outlined text-[13px]">
              directions_walk
            </span>

            <span className="whitespace-nowrap">
              {routeDistance && routeDuration
                ? `${routeDistance} • ${routeDuration}`
                : routeLoading
                  ? "Calculating..."
                  : "Location unavailable"}
            </span>
          </span>

          {pandal.metroStation && (
            <span className="flex min-w-0 items-center gap-1 text-slate-500 truncate">
              <span className="material-symbols-outlined shrink-0 text-[13px] text-blue-700">
                subway
              </span>

              <span className="truncate">{pandal.metroStation}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PandalInfoCard;
