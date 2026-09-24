
import { useState } from "react";

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
  const [showLegend, setShowLegend] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(false);

  return (
    <div className="flex flex-col items-end gap-2.5 select-none">

      {/* All Map Controls */}
      {controlsOpen && (
        <div className="flex flex-col items-end gap-2.5 animate-in fade-in slide-in-from-bottom-2 duration-200">

          {/* Metro Active Status */}
          <button
            type="button"
            onClick={() => setShowLegend(!showLegend)}
            className={`flex items-center justify-center transition-all cursor-pointer shadow-[0_4px_14px_rgba(0,0,0,0.08)] border ${
              showLegend
                ? "gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full border-slate-100 text-xs"
                : `w-11 h-11 rounded-full ${
                    metroActive
                      ? "bg-blue-50 border-blue-200 text-[#005bb3]"
                      : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                  }`
            }`}
          >
            {showLegend ? (
              <>
                <span
                  className={`w-2 h-2 rounded-full ${
                    metroActive
                      ? "bg-emerald-500 animate-pulse"
                      : "bg-slate-400"
                  }`}
                />

                <span className="font-semibold text-slate-800 whitespace-nowrap">
                  {metroActive ? "Metro: Active" : "Metro: Off"}
                </span>

                {metroActive && (
                  <div className="flex items-center gap-1.5 ml-1">
                    <span className="flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                      N-S
                    </span>

                    <span className="flex items-center gap-1 text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                      E-W
                    </span>
                  </div>
                )}
              </>
            ) : (
              <span className="material-symbols-outlined text-[20px]">
                subway
              </span>
            )}
          </button>

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
            <span className="material-symbols-outlined text-[20px]">
              layers
            </span>
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
              <span className="material-symbols-outlined text-[20px]">
                add
              </span>
            </button>

            <div className="h-[1px] w-6 mx-auto bg-slate-200"></div>

            <button
              type="button"
              aria-label="Zoom out"
              title="Zoom out"
              onClick={onZoomOut}
              className="w-10 h-10 flex items-center justify-center text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined text-[20px]">
                remove
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Main Map Controls Toggle Button */}
      <button
        type="button"
        aria-label={controlsOpen ? "Close map controls" : "Open map controls"}
        title={controlsOpen ? "Close map controls" : "Map controls"}
        onClick={() => setControlsOpen((prev) => !prev)}
        className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-[0_4px_14px_rgba(0,0,0,0.1)] border ${
          controlsOpen
            ? "bg-[#005bb3] text-white border-transparent shadow-[0_4px_14px_rgba(0,91,179,0.3)]"
            : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
        }`}
      >
        <span
          className={`material-symbols-outlined text-[21px] transition-transform duration-200 ${
            controlsOpen ? "rotate-90" : ""
          }`}
        >
          tune
        </span>
      </button>
    </div>
  );
};

export default MapControls;
