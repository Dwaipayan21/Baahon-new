import CrowdBadge from "./CrowdBadge";
const PandalInfoCard = ({
  pandal,
  crowd,
  routeDistance,
  routeDuration,
  routeLoading = false,
}) => {
  return (
    <div className="flex items-center gap-3 bg-slate-50/80 rounded-2xl p-2.5 border border-slate-100">
      <div className="w-22 h-20 rounded-xl overflow-hidden flex-shrink-0 relative bg-slate-200">
        <img
          alt={pandal.name}
          className="w-full h-full object-cover"
          src={pandal.image}
          loading="lazy"
        />

        <span className="absolute bottom-1 left-1 text-[9px] px-1.5 py-0.5 rounded bg-black/65 text-white font-bold backdrop-blur-xs">
          {pandal.rating} ★
        </span>
      </div>

      <div className="flex flex-col justify-between flex-1 min-w-0 py-0.5 gap-1.5">
        
        {/* Real Crowd Data */}
        <div className="flex items-center">
          <CrowdBadge
            status={pandal.crowdStatus}
            observedAt={pandal.crowdObservedAt}
          />
        </div>

        {/* Address */}
        <div className="flex items-center gap-1 text-slate-600 truncate text-xs">
          <span className="material-symbols-outlined text-[14px] text-slate-400 flex-shrink-0">
            pin_drop
          </span>

          <span className="truncate">
            {pandal.address}
          </span>
        </div>

        {/* Distance + Metro */}
        <div className="flex items-center gap-2.5 text-[11px] font-semibold text-[var(--color-heading)]">
          <span className="flex items-center gap-1 text-[var(--color-primary)]">
            <span className="material-symbols-outlined text-[13px]">
              directions_walk
            </span>

            <span>
              {routeLoading
                ? "Calculating..."
                : routeDistance && routeDuration
                  ? `${routeDistance} • ${routeDuration}`
                  : "Location unavailable"}
            </span>
          </span>

          {pandal.metroStation && (
            <span className="flex items-center gap-1 text-slate-500 truncate">
              <span className="material-symbols-outlined text-[13px] text-blue-700">
                subway
              </span>

              <span className="truncate">
                {pandal.metroStation}
              </span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PandalInfoCard;
