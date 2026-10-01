import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { getFoodForPandal } from "../services/api";

const FOOD_CATEGORY_ICONS = {
  restaurant: "restaurant",
  cafe: "local_cafe",
  fast_food: "fastfood",
  bakery: "bakery_dining",
  ice_cream: "icecream",
  confectionery: "cake",
  food_court: "storefront",
};

const formatCategoryName = (category) => {
  if (!category) return "Eatery";
  return category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

const PandalDetailsModal = ({ pandal, onClose }) => {
  const [foodPlaces, setFoodPlaces] = useState([]);
  const [foodLoading, setFoodLoading] = useState(true);
  const [foodError, setFoodError] = useState(null);
  const [foodCategoryFilter, setFoodCategoryFilter] = useState("all");

  useEffect(() => {
    let isCancelled = false;

    const loadFood = async () => {
      const pandalIdentifier = pandal?._id || pandal?.id;
      if (!pandalIdentifier) {
        setFoodLoading(false);
        return;
      }

      setFoodLoading(true);
      setFoodError(null);

      try {
        const places = await getFoodForPandal(pandalIdentifier);
        if (!isCancelled) {
          setFoodPlaces(Array.isArray(places) ? places : []);
          setFoodLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setFoodError("Unable to load nearby food options");
          setFoodLoading(false);
        }
      }
    };

    loadFood();

    return () => {
      isCancelled = true;
    };
  }, [pandal?._id, pandal?.id]);

  const availableCategories = useMemo(() => {
    const set = new Set();
    foodPlaces.forEach((p) => {
      if (p.category) set.add(p.category.toLowerCase());
    });
    return Array.from(set);
  }, [foodPlaces]);

  const filteredFoodPlaces = useMemo(() => {
    if (foodCategoryFilter === "all") return foodPlaces;
    return foodPlaces.filter(
      (p) => (p.category || "").toLowerCase() === foodCategoryFilter
    );
  }, [foodPlaces, foodCategoryFilter]);

  if (!pandal) return null;

  const handleOpenGoogleMaps = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${pandal.lat},${pandal.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleOpenFoodMaps = (lat, lng) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-[22rem] sm:max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col animate-scale-up"
      >
        {/* Hero */}
        <div className="relative w-full h-32 sm:h-40 bg-slate-800 shrink-0">
          <img
            alt={pandal.name}
            className="w-full h-full object-cover"
            src={pandal.image}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center backdrop-blur-md transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>

          <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/60 text-white backdrop-blur-md">
              ★ {pandal.rating} / 5.0
            </span>
            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#005bb3] text-white uppercase tracking-wider">
              {pandal.category}
            </span>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-lg font-bold text-[#131b2e] leading-tight">
                {pandal.name}
              </h2>
              {pandal.verified && (
                <span
                  className="material-symbols-outlined material-symbols-filled text-amber-500 text-[18px]"
                  title="Verified Pandal"
                >
                  verified
                </span>
              )}
            </div>
            <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
              {pandal.area} • Kolkata, West Bengal
            </p>
          </div>

          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-amber-50 border border-amber-200/60 text-[11px]">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="font-bold text-amber-900">Live Status:</span>
            <span className="text-amber-800 font-medium">
              {pandal.crowdLabel}
            </span>
          </div>

          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              About This Pandal
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              {pandal.description ||
                "A grand Durga Puja celebration attracting devotees from across the city with spectacular theme artwork, traditional idol craft, and cultural heritage."}
            </p>
          </div>

          {/* Location & Transit */}
          <div className="flex flex-col gap-1.5 pt-2 border-t border-slate-100">
            <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Location & Transit
            </h3>

            <div className="flex items-start gap-2 text-[11px] text-slate-700">
              <span className="material-symbols-outlined text-slate-400 text-[16px] mt-0.5">
                pin_drop
              </span>
              <span>{pandal.address}</span>
            </div>

            {pandal.metroStation && (
              <div className="flex items-center gap-2 text-[11px] text-slate-700">
                <span className="material-symbols-outlined text-[#005bb3] text-[16px]">
                  directions_subway
                </span>
                <span>
                  Nearest Metro Station: <strong>{pandal.metroStation}</strong>
                </span>
              </div>
            )}
          </div>

          {/* Food Engine: Nearby Food & Eateries */}
          <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px] text-[#005bb3]">
                  restaurant
                </span>
                Food Engine • Nearby Eateries
              </h3>
              {foodPlaces.length > 0 && (
                <span className="text-[10px] font-bold text-[#005bb3] bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  {filteredFoodPlaces.length}{" "}
                  {filteredFoodPlaces.length === 1 ? "spot" : "spots"}
                </span>
              )}
            </div>

            {/* Category filter pills */}
            {availableCategories.length > 1 && (
              <div className="flex items-center gap-1.5 overflow-x-auto py-0.5 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setFoodCategoryFilter("all")}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    foodCategoryFilter === "all"
                      ? "bg-[#005bb3] text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  All ({foodPlaces.length})
                </button>
                {availableCategories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFoodCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                      foodCategoryFilter === cat
                        ? "bg-[#005bb3] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {formatCategoryName(cat)}
                  </button>
                ))}
              </div>
            )}

            {/* Food Loading State */}
            {foodLoading && (
              <div className="flex flex-col gap-2 py-1">
                {[1, 2].map((n) => (
                  <div
                    key={n}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 animate-pulse flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-slate-200" />
                      <div className="flex flex-col gap-1.5">
                        <div className="w-24 h-3 bg-slate-200 rounded" />
                        <div className="w-16 h-2.5 bg-slate-200 rounded" />
                      </div>
                    </div>
                    <div className="w-12 h-3 bg-slate-200 rounded" />
                  </div>
                ))}
              </div>
            )}

            {/* Food Error State */}
            {!foodLoading && foodError && (
              <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/50 text-[11px] text-amber-800 flex items-center gap-2">
                <span className="material-symbols-outlined text-[16px] text-amber-600 shrink-0">
                  info
                </span>
                <span>{foodError}</span>
              </div>
            )}

            {/* Food Empty State */}
            {!foodLoading && !foodError && filteredFoodPlaces.length === 0 && (
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-center text-slate-500 text-xs">
                <span className="material-symbols-outlined text-[20px] text-slate-400 block mb-0.5">
                  restaurant_menu
                </span>
                <span>No food options found within walking distance</span>
              </div>
            )}

            {/* Food List */}
            {!foodLoading && !foodError && filteredFoodPlaces.length > 0 && (
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-0.5">
                {filteredFoodPlaces.map((place, idx) => {
                  const icon =
                    FOOD_CATEGORY_ICONS[place.category?.toLowerCase()] ||
                    "restaurant";

                  return (
                    <div
                      key={place.id || place.sourceId || `food-${idx}`}
                      className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/60 flex items-center justify-between gap-2 transition-colors"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-[#005bb3] shrink-0">
                          <span className="material-symbols-outlined text-[16px]">
                            {icon}
                          </span>
                        </div>
                        <div className="min-w-0 flex flex-col">
                          <span className="font-bold text-xs text-[#131b2e] truncate">
                            {place.name}
                          </span>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                            <span className="capitalize font-medium">
                              {formatCategoryName(place.category)}
                            </span>
                            {place.distanceFromPandal != null && (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-[#005bb3]">
                                  {place.distanceFromPandal}m away
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {Number.isFinite(place.latitude) &&
                        Number.isFinite(place.longitude) && (
                          <button
                            type="button"
                            onClick={() =>
                              handleOpenFoodMaps(
                                place.latitude,
                                place.longitude
                              )
                            }
                            title="Navigate to eatery"
                            className="w-7 h-7 rounded-lg bg-white border border-slate-200 hover:bg-blue-50 hover:text-[#005bb3] text-slate-600 flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                          >
                            <span className="material-symbols-outlined text-[14px]">
                              near_me
                            </span>
                          </button>
                        )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 h-10 rounded-full border border-slate-200 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleOpenGoogleMaps}
            className="flex-[1.4] h-10 rounded-full bg-[#005bb3] hover:bg-[#1173dd] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-[0_4px_14px_rgba(0,91,179,0.25)] transition-all cursor-pointer whitespace-nowrap"
          >
            <span className="material-symbols-outlined text-[16px]">
              near_me
            </span>
            <span>Open in Maps</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PandalDetailsModal;