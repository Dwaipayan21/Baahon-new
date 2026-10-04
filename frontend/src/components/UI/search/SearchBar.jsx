import { CATEGORIES } from "../../../data/constants";

const SearchBar = ({
  activeCategory,
  onSelectCategory,
}) => {
  return (
    <div className="w-full">
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
                  ? "bg-[var(--color-primary)] text-[var(--color-on-primary)] shadow-sm scale-[1.02]"
                  : "bg-white/90 backdrop-blur-md text-slate-600 border border-slate-200/80 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[16px] ${
                  isActive
                    ? "text-white"
                    : category.id === "metro"
                    ? "text-[var(--color-primary)]"
                    : category.id === "low_rush"
                    ? "text-emerald-600"
                    : category.id === "bonedi"
                    ? "text-[var(--color-heritage)]"
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