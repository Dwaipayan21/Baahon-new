const MetroLegend = ({
  metroActive,
  onToggleMetro,
  visibleCount = 0,
  totalCount = 0,
}) => {
  return (
    <div className="w-full flex items-center justify-between text-xs select-none">
      {/* Metro Status Indicator */}
      <button
        type="button"
        onClick={onToggleMetro}
        className="flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
      >
        <span
          className={`w-2 h-2 rounded-full ${
            metroActive ? "bg-emerald-500 animate-pulse" : "bg-slate-400"
          }`}
        />
        <span className="font-semibold text-slate-800">
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
      </button>

      {/* Pandal Counter Chip */}
      <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.06)] border border-slate-100 font-semibold text-slate-700">
        <span className="text-[#005bb3] font-bold">{visibleCount}</span>
        <span className="text-slate-400 mx-1">/</span>
        <span>{totalCount} Pandals</span>
      </div>
    </div>
  );
};

export default MetroLegend;
