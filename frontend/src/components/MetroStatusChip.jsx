const MetroStatusChip = ({
  metroActive,
  showLegend,
  onToggleLegend,
}) => {
  return (
    <button
      type="button"
      onClick={onToggleLegend}
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
  );
};

export default MetroStatusChip;
