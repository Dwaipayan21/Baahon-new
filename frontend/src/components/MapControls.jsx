const MapControls = ({
  metroActive,
  onToggleMetro,
  routeModeActive,
  onToggleRouteMode,
  activeLayer,
  onToggleLayer,
  onRecenter,
  onZoomIn,
  onZoomOut,
}) => {
  return (
    <div className="flex flex-col items-center gap-2.5 select-none">
      {/* Metro Lines Layer Toggle */}
      <button
        type="button"
        aria-label="Toggle Metro Transit Lines"
        title="Toggle Metro Transit Lines"
        onClick={onToggleMetro}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-[0_4px_14px_rgba(0,0,0,0.08)] border ${
          metroActive
            ? "bg-[#005bb3] text-white border-transparent shadow-[0_4px_14px_rgba(0,91,179,0.3)]"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">
          directions_subway
        </span>
      </button>

      {/* Walking Route Mode Toggle */}
      <button
        type="button"
        aria-label="Walking Route Mode"
        title="Pedestrian Route Guidance"
        onClick={onToggleRouteMode}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-[0_4px_14px_rgba(0,0,0,0.08)] border ${
          routeModeActive
            ? "bg-amber-500 text-white border-transparent shadow-[0_4px_14px_rgba(245,158,11,0.3)]"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
        }`}
      >
        <span className="material-symbols-outlined text-[20px]">
          directions_walk
        </span>
      </button>

      {/* Map Layer Switcher */}
      <button
        type="button"
        aria-label="Switch Map Layer"
        title={`Layer: ${activeLayer || "roadmap"}`}
        onClick={onToggleLayer}
        className="w-11 h-11 rounded-full bg-white text-slate-700 border border-slate-200 shadow-[0_4px_14px_rgba(0,0,0,0.08)] flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[20px]">layers</span>
      </button>

      {/* Locate Me / Recenter Map */}
      <button
        type="button"
        aria-label="Recenter Map / My Location"
        title="My Location / Recenter Kolkata"
        onClick={onRecenter}
        className="w-11 h-11 rounded-full bg-white text-[#005bb3] border border-slate-200 shadow-[0_4px_14px_rgba(0,0,0,0.08)] flex items-center justify-center hover:bg-blue-50 transition-colors cursor-pointer"
      >
        <span className="material-symbols-outlined text-[20px]">
          my_location
        </span>
      </button>

      {/* Zoom In & Out Segmented Pill */}
      <div className="flex flex-col bg-white rounded-full shadow-[0_4px_14px_rgba(0,0,0,0.08)] border border-slate-200 overflow-hidden">
        <button
          type="button"
          aria-label="Zoom in"
          title="Zoom in"
          onClick={onZoomIn}
          className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
        </button>
        <div className="h-[1px] w-6 mx-auto bg-slate-200"></div>
        <button
          type="button"
          aria-label="Zoom out"
          title="Zoom out"
          onClick={onZoomOut}
          className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-[20px]">remove</span>
        </button>
      </div>
    </div>
  );
};

export default MapControls;
