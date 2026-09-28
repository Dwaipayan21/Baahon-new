import PandalInfoCard from "./PandalInfoCard";
import PandalSheetActions from "./PandalSheetActions";

const PandalBottomSheet = ({
  pandal,
  onClose,
  onViewDetails,
  isDesktop = false,
  selectedPandals = [],
  onTogglePandalSelection,
  routeDistance,
  routeDuration,
  routeLoading = false,
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
      className={`animate-slide-up bg-white rounded-t-3xl shadow-[0_-12px_36px_rgba(15,23,42,0.12)] border border-slate-100 p-4 relative z-30 flex flex-col gap-3 transition-all duration-300 select-none ${
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
                className="material-symbols-outlined material-symbols-filled text-amber-500 text-[18px] flex-shrink-0"
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
      <PandalInfoCard
        pandal={pandal}
        crowd={crowd}
        routeDistance={routeDistance}
        routeDuration={routeDuration}
        routeLoading={routeLoading}
      />

      {/* Action Buttons */}
      <PandalSheetActions
        pandal={pandal}
        isSelected={isSelected}
        onViewDetails={onViewDetails}
        onTogglePandalSelection={onTogglePandalSelection}
      />
    </div>
  );
};

export default PandalBottomSheet;