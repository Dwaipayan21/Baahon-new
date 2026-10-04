import { useState } from "react";
import MetroStatusChip from "./MetroStatusChip";
import ZoomControlPill from "./ZoomControlPill";

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
          <MetroStatusChip
            metroActive={metroActive}
            showLegend={showLegend}
            onToggleLegend={() => setShowLegend(!showLegend)}
          />

          {/* Metro Lines Layer Toggle */}
          <button
            type="button"
            aria-label="Toggle Metro Transit Lines"
            title="Toggle Metro Transit Lines"
            onClick={onToggleMetro}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md border ${
              metroActive
                ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] border-transparent shadow-md"
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
                ? "bg-[var(--color-marigold-container)] text-[var(--color-marigold-text)] border-transparent shadow-md"
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
            className="w-11 h-11 rounded-full bg-white text-slate-700 border border-slate-200 shadow-md flex items-center justify-center hover:bg-slate-50 transition-colors cursor-pointer"
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
            className="w-11 h-11 rounded-full bg-white text-[var(--color-primary)] border border-slate-200 shadow-md flex items-center justify-center hover:bg-[var(--color-primary-container-light)] transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">
              my_location
            </span>
          </button>

          {/* Zoom In & Out Segmented Pill */}
          <ZoomControlPill
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
          />
        </div>
      )}

      {/* Main Map Controls Toggle Button */}
      <button
        type="button"
        aria-label={controlsOpen ? "Close map controls" : "Open map controls"}
        title={controlsOpen ? "Close map controls" : "Map controls"}
        onClick={() => setControlsOpen((prev) => !prev)}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer shadow-md border ${
          controlsOpen
            ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] border-transparent shadow-md"
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
