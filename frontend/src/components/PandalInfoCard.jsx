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
        {/* Crowd */}
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold ${crowd.bg} ${crowd.text}`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${crowd.dot} animate-pulse`}
            />

            <span className="truncate">
              {pandal.crowdLabel}
            </span>
          </span>
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
        <div className="flex items-center gap-2.5 text-[11px] font-semibold text-[#131b2e]">
          <span className="flex items-center gap-1 text-[#005bb3]">
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
