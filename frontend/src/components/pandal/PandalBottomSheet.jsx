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
      text: "text-[var(--color-heading-secondary)]",
      dot: "bg-emerald-500",
    },
    moderate: {
      bg: "bg-amber-50",
      text: "text-amber-900",
      dot: "bg-amber-500",
    },
    high: {
      bg: "bg-orange-100",
      text: "text-orange-700",
      dot: "bg-orange-500",
    },
  };

  const crowd =
    crowdColors[pandal.crowdType] || crowdColors.moderate;

  const isSelected = selectedPandals.some(
    (item) => item.id === pandal.id
  );

  return (
    <div
      className={`animate-slide-up bg-white border border-slate-100 relative z-30 overflow-hidden select-none ${
        isDesktop
          ? "rounded-2xl max-w-sm shadow-[0_12px_36px_rgba(15,23,42,0.12)]"
          : "w-full max-h-[calc(100dvh-180px-env(safe-area-inset-bottom,0px))] overflow-y-auto overscroll-contain rounded-t-3xl shadow-[0_-12px_36px_rgba(15,23,42,0.12)]"
      }`}
    >
      {!isDesktop && (
        <div className="w-9 h-1 rounded-full bg-slate-300 mx-auto mt-2" />
      )}

      {/* =====================================================
          PANDAL CARD CONTENT
         ===================================================== */}
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <div className="flex items-center gap-1.5 min-w-0">
              <h2 className="truncate text-[18px] font-extrabold leading-tight text-[var(--color-heading)]">
                {pandal.name}
              </h2>

              {pandal.verified && (
                <span
                  className="material-symbols-outlined material-symbols-filled shrink-0 text-[18px] text-amber-500"
                  title="Verified Pandal"
                >
                  verified
                </span>
              )}
            </div>

            <span className="mt-0.5 truncate text-[12px] font-semibold text-slate-500">
              {pandal.area} •{" "}
              {pandal.category.charAt(0).toUpperCase() +
                pandal.category.slice(1)}
            </span>
          </div>

          <button
            type="button"
            aria-label="Close sheet"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-800"
          >
            <span className="material-symbols-outlined text-[16px]">
              close
            </span>
          </button>
        </div>

        {/* Pandal Information */}
        <div className="mt-3">
          <PandalInfoCard
            pandal={pandal}
            crowd={crowd}
            routeDistance={routeDistance}
            routeDuration={routeDuration}
            routeLoading={routeLoading}
          />
        </div>

        {/* Actions */}
        <div className="mt-3">
          <PandalSheetActions
            pandal={pandal}
            isSelected={isSelected}
            onViewDetails={onViewDetails}
            onTogglePandalSelection={onTogglePandalSelection}
          />
        </div>
      </div>
    </div>
  );
};

export default PandalBottomSheet;