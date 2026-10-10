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
  selectedPandalRouteLoading = false,
  routeLoading = false,
}) => {
  if (!pandal) return null;

  const isSelected = selectedPandals.some(
    (item) => item.id === pandal.id
  );

  return (
    <div
      className={`animate-slide-up relative z-30 w-full shrink-0 overflow-hidden border border-slate-100 bg-white select-none ${
        isDesktop
          ? "max-w-sm rounded-2xl shadow-[0_12px_36px_rgba(15,23,42,0.12)]"
          : "rounded-2xl shadow-[0_-8px_28px_rgba(15,23,42,0.1)]"
      }`}
    >
      {!isDesktop && (
        <div className="mx-auto mt-2 h-1 w-9 rounded-full bg-slate-300" />
      )}

      <div className={isDesktop ? "p-4" : "p-3"}>
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <div className="flex min-w-0 items-center gap-1.5">
              <h2 className="truncate text-[16px] sm:text-[17px] font-extrabold leading-tight text-[var(--color-heading)]">
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

            <span className="mt-0.5 truncate text-[11px] font-semibold text-slate-500">
              {pandal.area} {" • "}
              {pandal.category.charAt(0).toUpperCase() +
                pandal.category.slice(1)}
            </span>
          </div>

          <button
            type="button"
            aria-label="Close pandal card"
            onClick={onClose}
            className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <span className="material-symbols-outlined text-[17px]">
              close
            </span>
          </button>
        </div>

        {/* Pandal information */}
        <div className="mt-2 sm:mt-2.5">
          <PandalInfoCard
            pandal={pandal}
            routeDistance={routeDistance}
            routeDuration={routeDuration}
            routeLoading={selectedPandalRouteLoading || routeLoading}
          />
        </div>

        {/* Actions */}
        <div className="mt-2 sm:mt-2.5">
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
