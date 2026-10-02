const PandalSheetActions = ({
  pandal,
  isSelected,
  onViewDetails,
  onTogglePandalSelection,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2.5 pt-0.5">
      {/* VIEW DETAILS */}
      <button
        type="button"
        onClick={() => onViewDetails(pandal)}
        className="h-11 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
      >
        <span className="material-symbols-outlined text-[17px]">
          info
        </span>

        <span>View Details</span>
      </button>

      {/* ADD STOP / ADDED */}
      <button
        type="button"
        onClick={() => onTogglePandalSelection?.(pandal)}
        className={`h-11 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
          isSelected
            ? "bg-emerald-600 text-white shadow-[0_4px_14px_rgba(5,150,105,0.25)]"
            : "bg-[#005bb3] text-white shadow-[0_4px_14px_rgba(0,91,179,0.25)]"
        }`}
      >
        <span className="material-symbols-outlined text-[18px]">
          {isSelected ? "check" : "add_location"}
        </span>

        <span>{isSelected ? "ADDED" : "ADD STOP"}</span>
      </button>
    </div>
  );
};

export default PandalSheetActions;
