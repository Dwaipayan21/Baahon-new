import SearchBar from "./SearchBar";

const SearchFilterOverlay = ({
  searchQuery,
  onSearchChange,
  activeCategory,
  onSelectCategory,
  onClearSearch,
}) => {
  return (
    <div
      className="absolute top-20 inset-x-0 px-3 sm:px-6 pointer-events-none flex flex-col items-center"
      style={{
        zIndex: 200,
      }}
    >
      <div className="w-full max-w-md pointer-events-auto flex flex-col gap-2">
        <SearchBar
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          activeCategory={activeCategory}
          onSelectCategory={onSelectCategory}
          onClearSearch={onClearSearch}
        />

      </div>
    </div>
  );
};

export default SearchFilterOverlay;
