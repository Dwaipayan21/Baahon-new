const PandalSheetActions = ({
  pandal,
  isSelected,
  onViewDetails,
  onTogglePandalSelection,
}) => {
  return (
    <div className="grid grid-cols-2 gap-2 pt-0.5">
      {/* VIEW DETAILS */}
      <button
        type="button"
        onClick={() => onViewDetails(pandal)}
        className="h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
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
        className={`h-10 rounded-full text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 ${
          isSelected
            ? "bg-[var(--color-success-container)] text-[var(--color-heading-secondary)] shadow-sm"
            : "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm"
        }`}
      >
        <span className={`material-symbols-outlined text-[18px] ${isSelected ? "text-[var(--color-success)]" : ""}`}>
          {isSelected ? "check" : "add_location"}
        </span>

        <span>{isSelected ? "ADDED" : "ADD STOP"}</span>
      </button>
    </div>
  );
};

export default PandalSheetActions;
