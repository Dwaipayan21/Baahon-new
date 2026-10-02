import { useEffect, useState } from "react";

const RouteSelectionBar = ({
  selectedPandals = [],
  routeData = null,
  routeError = "",
  routeLoading = false,
  onClear,
  onMetroRoute,
  onRoadRoute,
}) => {
  const [loadingRoute, setLoadingRoute] = useState("");

  useEffect(() => {
    if (!routeLoading) {
      setLoadingRoute("");
    }
  }, [routeLoading]);

  if (selectedPandals.length === 0) return null;

  return (
    <div className="w-full max-w-md mx-auto pointer-events-auto">
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.16)] border border-slate-100 p-3">
        
        <div className="flex items-center justify-between gap-3">
          
          <div className="min-w-0">
            <p className="text-sm font-bold text-[#131b2e]">
              {selectedPandals.length}{" "}
              {selectedPandals.length === 1 ? "Pandal" : "Pandals"} Selected
            </p>

            <p className="text-[11px] text-slate-500 truncate">
              Ready to create your Puja route
            </p>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {onClear && (
              <button
                type="button"
                onClick={onClear}
                aria-label="Clear selected pandals"
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 text-lg font-bold hover:bg-slate-200 transition-colors cursor-pointer flex items-center justify-center"
              >
                ×
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setLoadingRoute("metro");
                onMetroRoute?.();
              }}
              disabled={routeLoading}
              className="px-3 py-2 rounded-full bg-[#005bb3] text-white text-[10px] font-bold shadow-[0_4px_12px_rgba(0,91,179,0.25)] hover:bg-[#004d99] transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {routeLoading && loadingRoute === "metro" ? "LOADING..." : "🚇 Metro + Walk"}
            </button>

            <button
              type="button"
              onClick={() => {
                setLoadingRoute("road");
                onRoadRoute?.();
              }}
              disabled={routeLoading}
              className="px-3 py-2 rounded-full bg-slate-900 text-white text-[10px] font-bold shadow-[0_4px_12px_rgba(15,23,42,0.2)] hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {routeLoading && loadingRoute === "road" ? "LOADING..." : "🚗 By Road"}
            </button>
          </div>
        </div>

        {routeError && (
          <p className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[11px] font-semibold leading-snug text-red-700">
            {routeError}
          </p>
        )}

        {routeData?.mode === "metro" && (
          <div className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-[#005bb3]">🚇 Metro + Walk</p>
            <p>
              Walk: {routeData.walking?.toMetro?.distance?.value} {routeData.walking?.toMetro?.distance?.unit} · {routeData.walking?.toMetro?.estimatedTime?.value} min
            </p>
            <p className="truncate">
              Metro: {routeData.metro?.fromStation?.name} → {routeData.metro?.toStation?.name}
            </p>
            <p>
              Walk: {routeData.walking?.fromMetro?.distance?.value} {routeData.walking?.fromMetro?.distance?.unit} · {routeData.walking?.fromMetro?.estimatedTime?.value} min
            </p>
            {routeData.metro?.transfers > 0 && (
              <p>{routeData.metro.transfers} line change(s)</p>
            )}
          </div>
        )}

        {routeData?.mode === "car" && (
          <div className="mt-3 border-t border-slate-100 pt-3 text-[11px] text-slate-600">
            <p className="font-bold text-slate-900">🚗 By Road</p>
            <p>
              {routeData.distance?.value} {routeData.distance?.unit} · {routeData.estimatedTime?.value} min
            </p>
          </div>
        )}

      </div>
    </div>
  );
};

export default RouteSelectionBar;