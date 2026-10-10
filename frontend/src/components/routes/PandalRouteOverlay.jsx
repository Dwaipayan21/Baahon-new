import PandalBottomSheet from "../pandal/PandalBottomSheet";

const PandalRouteOverlay = ({
  isDesktop,
  selectedPandal,
  onClosePandal,
  onViewDetails,
  selectedPandals,
  onTogglePandalSelection,
  selectedPandalRoute,
  selectedPandalRouteLoading,
  routeLoading,
  onClearRoute,
  onMetroRoute,
  onRoadRoute,
}) => {
  const routeDistance =
    selectedPandalRoute?.distance?.value != null
      ? `${Number(selectedPandalRoute.distance.value).toFixed(1)} km`
      : null;

  const routeDuration =
    selectedPandalRoute?.estimatedTime?.value != null
      ? `${Number(selectedPandalRoute.estimatedTime.value)} min`
      : null;

  const selectionCard =
    selectedPandals.length > 0 && (
      <div className="bg-white border border-slate-100 px-4 py-3 shadow-sm">
        {/* Selection count */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[13px] font-extrabold leading-tight text-slate-900">
              {selectedPandals.length}{" "}
              {selectedPandals.length === 1 ? "Pandal" : "Pandals"} Selected
            </p>

            <p className="mt-0.5 text-[10px] leading-tight text-slate-500">
              Ready to create route
            </p>
          </div>

          <button
            type="button"
            onClick={onClearRoute}
            aria-label="Clear selected pandals"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
          >
            <span className="material-symbols-outlined text-[15px]">
              close
            </span>
          </button>
        </div>

        {/* Route buttons */}
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onClosePandal?.();
              onMetroRoute?.();
            }}
            disabled={routeLoading}
            className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-indigo-600 px-2.5 py-2 text-[10px] font-bold text-white transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[14px]">
              train
            </span>

            <span className="material-symbols-outlined text-[13px]">
              directions_walk
            </span>

            <span className="truncate">
              {routeLoading ? "Loading..." : "Metro + Walk"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              onClosePandal?.();
              onRoadRoute?.();
            }}
            disabled={routeLoading}
            className="flex min-w-0 items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-2.5 py-2 text-[10px] font-bold text-white transition-all hover:bg-slate-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <span className="material-symbols-outlined text-[15px]">
              directions_car
            </span>

            <span className="truncate">
              {routeLoading ? "Loading..." : "By Road"}
            </span>
          </button>
        </div>
      </div>
    );

  const pandalCard = selectedPandal && (
    <PandalBottomSheet
      pandal={selectedPandal}
      onClose={onClosePandal}
      onViewDetails={onViewDetails}
      isDesktop={isDesktop}
      selectedPandals={selectedPandals}
      onTogglePandalSelection={onTogglePandalSelection}
      routeDistance={routeDistance}
      routeDuration={routeDuration}
      selectedPandalRouteLoading={selectedPandalRouteLoading}
      routeLoading={routeLoading}
    />
  );

  if (isDesktop) {
    return (
      <div
        className="absolute bottom-8 left-6 z-30 pointer-events-auto w-full max-w-sm"
        style={{ zIndex: 30 }}
      >
        <div className="flex flex-col gap-2">
          {selectionCard}
          {pandalCard}
        </div>
      </div>
    );
  }

  return (
    <div
      className="absolute inset-x-0 px-2 z-30 pointer-events-auto"
      style={{
        zIndex: 30,
        bottom: "calc(76px + env(safe-area-inset-bottom, 0px))",
        maxHeight: "calc(100% - 160px - env(safe-area-inset-bottom, 0px))",
      }}
    >
      <div className="flex flex-col gap-2">
        {selectionCard}
        {pandalCard}
      </div>
    </div>
  );
};

export default PandalRouteOverlay;