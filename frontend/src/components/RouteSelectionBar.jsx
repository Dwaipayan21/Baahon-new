const RouteSelectionBar = ({
  selectedPandals = [],
  routeLoading = false,
  onClear,
  onStartRoute,
}) => {
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
            
            <button
              type="button"
              onClick={onClear}
              className="px-3 py-2 rounded-full bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Clear
            </button>

            <button
              type="button"
              onClick={onStartRoute}
              disabled={routeLoading}
              className="px-4 py-2 rounded-full bg-[#005bb3] text-white text-xs font-bold shadow-[0_4px_12px_rgba(0,91,179,0.25)] hover:bg-[#004d99] transition-colors cursor-pointer"
            >
              {routeLoading ? "CREATING ROUTE..." : "START ROUTE"}
            </button>

          </div>
        </div>

      </div>
    </div>
  );
};

export default RouteSelectionBar;