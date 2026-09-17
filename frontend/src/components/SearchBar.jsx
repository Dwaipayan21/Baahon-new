import { CATEGORIES } from "../data/constants";

const SearchBar = ({
  searchQuery,
  onSearchChange,
  activeCategory,
  onSelectCategory,
  onClearSearch,
}) => {
  return (
    <div className="w-full flex flex-col gap-2.5">
      {/* Search Input Bar */}
      <div className="w-full flex items-center bg-white/95 backdrop-blur-md rounded-full shadow-[0_4px_20px_rgba(0,0,0,0.08)] border border-slate-100 px-4 py-2.5 gap-3">
        <span className="material-symbols-outlined text-[#005bb3] text-[22px]">
          search
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search pandals, areas, routes, metro..."
          className="w-full bg-transparent text-[15px] text-[#131b2e] placeholder:text-slate-400 outline-none font-medium"
        />

        {searchQuery ? (
          <button
            type="button"
            onClick={onClearSearch}
            aria-label="Clear search"
            className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Voice search"
              className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-[#005bb3] transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">mic</span>
            </button>
          </div>
        )}
      </div>

      {/* Category Pills (Horizontal Scrollable) */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar select-none">
        {CATEGORIES.map((category) => {
          const isActive = activeCategory === category.id;
          return (
            <button
              key={category.id}
              type="button"
              onClick={() => onSelectCategory(category.id)}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shadow-xs ${
                isActive
                  ? "bg-[#005bb3] text-white shadow-[0_2px_8px_rgba(0,91,179,0.25)] scale-[1.02]"
                  : "bg-white/90 backdrop-blur-md text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[16px] ${
                  isActive
                    ? "text-white"
                    : category.id === "metro"
                    ? "text-[#005bb3]"
                    : category.id === "low_rush"
                    ? "text-emerald-600"
                    : category.id === "bonedi"
                    ? "text-amber-600"
                    : "text-slate-500"
                }`}
              >
                {category.icon}
              </span>
              <span>{category.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SearchBar;
