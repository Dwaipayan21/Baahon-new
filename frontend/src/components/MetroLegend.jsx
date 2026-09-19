const MetroLegend = ({
  metroActive,
  onToggleMetro,
  visibleCount = 0,
  totalCount = 0,
}) => {
  return (
    <div className="w-full flex items-center justify-end text-xs select-none">


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
