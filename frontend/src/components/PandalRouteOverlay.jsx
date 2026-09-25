import PandalBottomSheet from "./PandalBottomSheet";
import RouteSelectionBar from "./RouteSelectionBar";

const PandalRouteOverlay = ({
  isDesktop,
  selectedPandal,
  onClosePandal,
  onViewDetails,
  selectedPandals,
  onTogglePandalSelection,
  selectedPandalRoute,
  selectedPandalRouteLoading,
  routeData,
  routeError,
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

  return isDesktop ? (
    <>
      {selectedPandal && (
        <div className="absolute bottom-8 left-6 z-30 pointer-events-auto">
          <PandalBottomSheet
            pandal={selectedPandal}
            onClose={onClosePandal}
            onViewDetails={onViewDetails}
            isDesktop={isDesktop}
            selectedPandals={selectedPandals}
            onTogglePandalSelection={onTogglePandalSelection}
            routeDistance={routeDistance}
            routeDuration={routeDuration}
            routeLoading={selectedPandalRouteLoading}
          />
        </div>
      )}

      <RouteSelectionBar
        selectedPandals={selectedPandals}
        routeData={routeData}
        routeError={routeError}
        routeLoading={routeLoading}
        onClear={onClearRoute}
        onMetroRoute={onMetroRoute}
        onRoadRoute={onRoadRoute}
      />
    </>
  ) : (
    <div className="absolute bottom-14 inset-x-0 px-2 z-30 pointer-events-auto flex flex-col gap-2">
      {selectedPandal && (
        <PandalBottomSheet
          pandal={selectedPandal}
          onClose={onClosePandal}
          onViewDetails={onViewDetails}
          isDesktop={false}
          selectedPandals={selectedPandals}
          onTogglePandalSelection={onTogglePandalSelection}
          routeDistance={routeDistance}
          routeDuration={routeDuration}
          routeLoading={selectedPandalRouteLoading}
        />
      )}

      <RouteSelectionBar
        selectedPandals={selectedPandals}
        routeData={routeData}
        routeError={routeError}
        routeLoading={routeLoading}
        onClear={onClearRoute}
        onMetroRoute={onMetroRoute}
        onRoadRoute={onRoadRoute}
      />
    </div>
  );
};

export default PandalRouteOverlay;
