const PandalBottomSheet = ({
  pandal,
  onClose,
  onViewDetails,
  isDesktop = false,
  selectedPandals = [],
  onTogglePandalSelection,
}) => {
  if (!pandal) return null;

  const crowdColors = {
    low: {
      bg: "bg-emerald-50",
      text: "text-emerald-800",
      dot: "bg-emerald-500",
    },
    moderate: {
      bg: "bg-amber-50",
      text: "text-amber-900",
      dot: "bg-amber-500",
    },
    high: {
      bg: "bg-rose-50",
      text: "text-rose-900",
      dot: "bg-rose-500",
    },
  };

  const crowd =
    crowdColors[pandal.crowdType] || crowdColors.moderate;

  // Check whether this pandal has already been added as a route stop
  const isSelected = selectedPandals.some(
    (item) => item.id === pandal.id
  );

  return (
    <div
      className={`animate-[slideUp_0.4s_ease-out] bg-white rounded-t-3xl shadow-[0_-12px_36px_rgba(15,23,42,0.12)] border border-slate-100 p-4 relative z-30 flex flex-col gap-3 transition-all duration-300 select-none ${
        isDesktop
          ? "rounded-2xl max-w-sm shadow-[0_12px_36px_rgba(15,23,42,0.12)]"
          : "w-full"
      }`}
    >
      {!isDesktop && (
        <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto -mt-1 mb-0.5 cursor-pointer" />
      )}

      {/* Pandal Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5">
            <h2 className="font-bold text-base text-[#131b2e] truncate">
              {pandal.name}
            </h2>

            {pandal.verified && (
              <span
                className="material-symbols-outlined text-amber-500 text-[18px] flex-shrink-0"
                style={{ fontVariationSettings: "'FILL' 1" }}
                title="Verified Pandal"
              >
                verified
              </span>
            )}
          </div>

          <span className="text-xs text-slate-500 truncate">
            {pandal.area} •{" "}
            {pandal.category.charAt(0).toUpperCase() +
              pandal.category.slice(1)}
          </span>
        </div>

        <button
          type="button"
          aria-label="Close sheet"
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">
            close
          </span>
        </button>
      </div>

      {/* Pandal Information */}
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

              <span>{pandal.distanceText}</span>
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

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2.5 pt-0.5">
        
        {/* VIEW DETAILS */}
        <button
          type="button"
          onClick={() => onViewDetails(pandal)}
          className="h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
        >
          <span className="material-symbols-outlined text-[17px]">
            info
          </span>

          <span>View Details</span>
        </button>

        {/* ADD STOP / ADDED */}
        <button
          type="button"
          onClick={() =>
            onTogglePandalSelection?.(pandal)
          }
          className={`h-11 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
            isSelected
              ? "bg-emerald-600 text-white shadow-[0_4px_14px_rgba(5,150,105,0.25)]"
              : "bg-[#005bb3] text-white shadow-[0_4px_14px_rgba(0,91,179,0.25)]"
          }`}
        >
          <span className="material-symbols-outlined text-[18px]">
            {isSelected ? "check" : "add_location"}
          </span>

          <span>
            {isSelected ? "ADDED" : "ADD STOP"}
          </span>
        </button>

      </div>
    </div>
  );
};

export default PandalBottomSheet;