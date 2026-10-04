import { useEffect, useRef, useState } from "react";
import {
  Show,
  SignInButton,
  SignUpButton,
  useUser,
} from "@clerk/react";

const Header = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  searchResults = [],
  onSelectPandal,
}) => {
  const { user } = useUser();

  const [mobileSearchOpen, setMobileSearchOpen] =
    useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const searchInputRef = useRef(null);

  const displayName =
    user?.fullName ||
    user?.username ||
    "Profile";

  useEffect(() => {
    if (!mobileSearchOpen) {
      document.body.style.overflow = "";
      return undefined;
    }

    document.body.style.overflow = "hidden";

    const focusTimer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(focusTimer);
      document.body.style.overflow = "";
    };
  }, [mobileSearchOpen]);

  const closeMobileSearch = () => {
    setMobileSearchOpen(false);
    setSearchFocused(false);
  };

  const handleSelectPandal = (pandal) => {
    onSelectPandal?.(pandal);
    setSearchFocused(false);
    setMobileSearchOpen(false);
    document.body.style.overflow = "";
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      setSearchFocused(false);

      if (mobileSearchOpen) {
        closeMobileSearch();
      }
    }
  };

  const hasSearchQuery = searchQuery.trim().length > 0;
  const showResults = searchFocused && hasSearchQuery;

  return (
    <>
      {/* =========================================
          MOBILE SEARCH BACKDROP
      ========================================== */}

      {mobileSearchOpen && (
        <div
          className="fixed inset-0 z-[90] bg-slate-950/40 backdrop-blur-[2px] sm:hidden"
          onClick={closeMobileSearch}
        />
      )}

      {/* =========================================
          HEADER
      ========================================== */}

      <header
        className="fixed top-0 left-0 right-0 z-[100] bg-[var(--color-background)] border-b border-slate-200/70 shadow-sm pt-safe"
      >
        <div className="h-16 px-4 sm:px-6 max-w-7xl mx-auto flex items-center gap-4">

          {/* =====================================
              LOGO
          ====================================== */}

          <div className="flex items-center gap-3 min-w-fit">
            <div className="w-10 h-10 flex items-center justify-center flex-shrink-0">
              <img
                src="/Baahon.jpeg"
                alt="Baahon"
                className="w-10 h-10 object-contain"
              />
            </div>

            <span className="font-bold text-lg text-[var(--color-heading)] tracking-tight">
              Baahon
            </span>
          </div>

          {/* =====================================
              DESKTOP SEARCH
          ====================================== */}

          <div className="hidden sm:flex flex-1 justify-center relative">
            <div className="w-full max-w-[500px] relative">
              <div
                className={`w-full flex items-center bg-white rounded-full border px-4 py-2.5 gap-3 shadow-sm transition-all ${
                  searchFocused
                    ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/10"
                    : "border-slate-200"
                }`}
              >
                <span className="material-symbols-outlined text-[var(--color-primary)] text-[21px]">
                  search
                </span>

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pandals, areas or metro stations..."
                  aria-label="Search pandals"
                  className="w-full bg-transparent text-[14px] text-[var(--color-heading)] placeholder:text-slate-400 outline-none font-medium"
                />

                {hasSearchQuery && (
                  <button
                    type="button"
                    onClick={onClearSearch}
                    aria-label="Clear search"
                    className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      close
                    </span>
                  </button>
                )}
              </div>

              {showResults && (
                <SearchResults
                  results={searchResults}
                  onSelect={handleSelectPandal}
                />
              )}
            </div>
          </div>

          {/* =====================================
              MOBILE ACTIONS
          ====================================== */}

          <div className="flex items-center gap-1 ml-auto sm:hidden">

            <button
              type="button"
              onClick={() =>
                setMobileSearchOpen(true)
              }
              aria-label="Open search"
              className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-primary)] hover:bg-[var(--color-primary-container-light)] active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-[23px]">
                search
              </span>
            </button>

            <Show when="signed-out">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="px-2.5 py-2 text-sm font-semibold text-[var(--color-primary)]"
                >
                  Sign In
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="px-2.5 py-2 text-sm font-semibold text-[var(--color-primary)] bg-[var(--color-primary-container-light)] rounded-lg"
                >
                  Sign Up
                </button>
              </SignUpButton>
            </Show>

            <Show when="signed-in">
              <div
                className="w-9 h-9 rounded-full overflow-hidden border border-slate-200"
                title={displayName}
                aria-label={`${displayName} profile picture`}
              >
                <img
                  src={user?.imageUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              </div>
            </Show>
          </div>

          {/* =====================================
              DESKTOP AUTH
          ====================================== */}

          <div className="hidden sm:flex items-center gap-2 ml-auto">

            <Show when="signed-out">
              <SignInButton mode="modal">
                <button
                  type="button"
                  className="px-3 py-2 text-sm font-semibold text-[var(--color-primary)] hover:bg-[var(--color-primary-container-light)] rounded-lg transition-all"
                >
                  Sign In
                </button>
              </SignInButton>

              <SignUpButton mode="modal">
                <button
                  type="button"
                  className="px-3 py-2 text-sm font-semibold text-[var(--color-on-primary)] bg-[var(--color-primary)] hover:bg-[var(--color-heading-secondary)] rounded-lg transition-all shadow-sm"
                >
                  Sign Up
                </button>
              </SignUpButton>
            </Show>

            <Show when="signed-in">
              <div
                className="w-9 h-9 rounded-full overflow-hidden border border-slate-200"
                title={displayName}
                aria-label={`${displayName} profile picture`}
              >
                <img
                  src={user?.imageUrl}
                  alt={displayName}
                  className="w-full h-full object-cover"
                />
              </div>
            </Show>
          </div>
        </div>

        {/* =========================================
            MOBILE SEARCH PANEL
        ========================================== */}

        {mobileSearchOpen && (
          <div className="sm:hidden absolute top-full left-0 right-0 bg-[var(--color-background)] border-b border-slate-200 px-4 py-3 shadow-lg">
            <div className="relative">
              <div className="w-full flex items-center bg-white rounded-full border border-slate-200 px-4 py-2.5 gap-3 shadow-sm">
                <span className="material-symbols-outlined text-[var(--color-primary)] text-[21px]">
                  search
                </span>

                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={handleKeyDown}
                  placeholder="Search pandals, areas or metro..."
                  aria-label="Search pandals"
                  className="w-full bg-transparent text-[15px] text-[var(--color-heading)] placeholder:text-slate-400 outline-none font-medium"
                />

                <button
                  type="button"
                  onClick={
                    hasSearchQuery
                      ? onClearSearch
                      : closeMobileSearch
                  }
                  aria-label={
                    hasSearchQuery
                      ? "Clear search"
                      : "Close search"
                  }
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors flex-shrink-0"
                >
                  <span className="material-symbols-outlined text-[19px]">
                    close
                  </span>
                </button>
              </div>

              {showResults && (
                <SearchResults
                  results={searchResults}
                  onSelect={handleSelectPandal}
                  mobile
                />
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};

const SearchResults = ({ results, onSelect, mobile = false }) => {
  return (
    <div
      className={`absolute left-0 right-0 ${
        mobile ? "top-[52px]" : "top-[58px]"
      } bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden z-[120]`}
    >
      {results.length === 0 ? (
        <div className="px-5 py-6 text-center">
          <span className="material-symbols-outlined text-[30px] text-slate-500">
            search_off
          </span>

          <p className="mt-2 text-sm font-semibold text-slate-600">
            No pandals found
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Try searching another name or area
          </p>
        </div>
      ) : (
        <div className="py-2">
          {results.map((pandal) => (
            <button
              key={pandal.id}
              type="button"
              onClick={() => onSelect(pandal)}
              className="w-full flex items-center gap-3 px-3 py-3 text-left hover:bg-slate-50 active:bg-slate-100 transition-colors"
            >
              <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                {pandal.image ? (
                  <img
                    src={pandal.image}
                    alt={pandal.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-400">
                      temple_hindu
                    </span>
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[var(--color-heading)] truncate">
                  {pandal.name}
                </p>

                {pandal.area && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[14px] text-slate-400">
                      location_on
                    </span>
                    <span className="text-xs text-slate-500 truncate">
                      {pandal.area}
                    </span>
                  </div>
                )}

                {pandal.metroStation && (
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className="material-symbols-outlined text-[14px] text-[var(--color-primary)]">
                      directions_subway
                    </span>
                    <span className="text-[11px] text-slate-500 truncate">
                      {pandal.metroStation}
                    </span>
                  </div>
                )}
              </div>

              <span className="material-symbols-outlined text-[18px] text-slate-400 flex-shrink-0">
                arrow_forward_ios
              </span>
            </button>
          ))}

          {results.length >= 6 && (
            <div className="px-4 py-2 border-t border-slate-100">
              <p className="text-[11px] text-slate-500 text-center">
                Showing top results
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Header;