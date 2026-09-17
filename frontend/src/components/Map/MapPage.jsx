
import { useState, useEffect, useMemo, useRef } from "react";
import axios from "axios";

import SearchBar from "./SearchBar";
import MapLegend from "./MapLegend";
import MapControls from "./MapControls";
import KolkataMapCanvas from "./KolkataMapCanvas";
import PandalBottomSheet from "./PandalBottomSheet";
import BottomNavigation from "./BottomNavigation";
import { KOLKATA_CENTER } from "../../data/pandalData";

const MapPage = () => {
  const [pandals, setPandals] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedPandal, setSelectedPandal] = useState(null);
  const [metroActive, setMetroActive] = useState(true);
  const [activeLayer, setActiveLayer] = useState("roadmap");
  const [routeModeActive, setRouteModeActive] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState("explore");
  const [userLocation, setUserLocation] = useState(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);
  const [toastMessage, setToastMessage] = useState("");

  const mapRef = useRef(null);

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/pandals")
      .then(({ data }) => {
        const list = Array.isArray(data)
          ? data
          : data.data || data.pandals || [];

        setPandals(Array.isArray(list) ? list : []);
      })
      .catch((err) => console.error("Failed to fetch pandals:", err));
  }, []);

  useEffect(() => {
    if (pandals.length) {
      setSelectedPandal((prev) => prev || pandals[0]);
    }
  }, [pandals]);

  useEffect(() => {
    const resize = () => setIsDesktop(window.innerWidth >= 768);

    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  const filteredPandals = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return pandals.filter((pandal) => {
      const text = [
        pandal.name,
        pandal.zone,
        pandal.address,
        ...(pandal.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      if (query && !text.includes(query)) return false;

      return (
        activeCategory === "all" ||
        (activeCategory === "metro" && pandal.metroStation) ||
        (activeCategory === "low_rush" && pandal.crowdLevel === "low") ||
        (activeCategory === "bonedi" && pandal.isBonediBari) ||
        (activeCategory === "theme" && pandal.category === "theme")
      );
    });
  }, [pandals, searchQuery, activeCategory]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const handleZoom = (amount) => {
    const map = mapRef.current;
    if (map) map.setZoom(map.getZoom() + amount);
  };

  const handleRecenter = () => {
    if (!navigator.geolocation) {
      mapRef.current?.panTo(KOLKATA_CENTER);
      mapRef.current?.setZoom(13);
      showToast("Centered to Kolkata");
      return;
    }

    showToast("Locating your position...");

    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const pos = {
          lat: coords.latitude,
          lng: coords.longitude,
        };

        setUserLocation(pos);
        mapRef.current?.panTo(pos);
        mapRef.current?.setZoom(14);
        showToast("Centered to your location");
      },
      () => {
        mapRef.current?.panTo(KOLKATA_CENTER);
        mapRef.current?.setZoom(13);
        showToast("Centered to Kolkata");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleToggleMetro = () => {
    setMetroActive((prev) => !prev);
  };

  const handleToggleLayer = () => {
    setActiveLayer((prev) =>
      prev === "roadmap"
        ? "satellite"
        : prev === "satellite"
          ? "terrain"
          : "roadmap"
    );
  };

  const handleToggleRouteMode = () => {
    setRouteModeActive((prev) => !prev);
  };

  return (
    <div className="relative w-full h-screen h-[100dvh] flex flex-col bg-[#faf8ff] text-[#131b2e] overflow-hidden">

      <header className="fixed top-0 inset-x-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-100/80 pt-safe shadow-[0_1px_8px_rgba(0,0,0,0.03)] select-none">
        <div className="h-14 px-4 sm:px-6 max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#005bb3] to-[#257ce6] flex items-center justify-center text-white shadow-[0_2px_8px_rgba(0,91,179,0.3)]">
              <span className="material-symbols-outlined text-[20px]">
                temple_hindu
              </span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-base tracking-tight text-[#131b2e]">
                  PujoPath
                </span>
                <span className="text-[10px] font-bold text-[#005bb3] bg-blue-50 border border-blue-100 px-1.5 py-0.2 rounded-full uppercase tracking-wider">
                  Live Map
                </span>
              </div>

              <span className="text-[10px] text-slate-500 font-medium">
                Maa Asche • Kolkata 2026
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleMetro}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                metroActive
                  ? "bg-blue-50 border-blue-200 text-[#005bb3]"
                  : "bg-slate-50 border-slate-200 text-slate-600"
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">
                directions_subway
              </span>
              Metro Lines
            </button>

            <button
              type="button"
              className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center"
              title="Account"
            >
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                alt="User profile"
                className="w-full h-full object-cover"
              />
            </button>
          </div>
        </div>
      </header>

      <main className="relative flex-1 w-full h-full pt-14 overflow-hidden">

        <KolkataMapCanvas
          pandals={filteredPandals}
          selectedPandal={selectedPandal}
          onSelectPandal={setSelectedPandal}
          metroActive={metroActive}
          activeLayer={activeLayer}
          routeModeActive={routeModeActive}
          userLocation={userLocation}
          onMapReady={(map) => (mapRef.current = map)}
        />

        <div className="absolute top-16 sm:top-18 inset-x-0 px-3 sm:px-6 pointer-events-none z-30 flex flex-col items-center">
          <div className="w-full max-w-md pointer-events-auto flex flex-col gap-2">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              onClearSearch={() => setSearchQuery("")}
            />

            <MapLegend
              metroActive={metroActive}
              onToggleMetro={handleToggleMetro}
              visiblePandalCount={filteredPandals.length}
              totalPandalCount={pandals.length}
            />
          </div>
        </div>

        <div
          className={`absolute right-3 sm:right-6 z-30 pointer-events-auto ${
            selectedPandal && !isDesktop
              ? "bottom-[290px]"
              : "bottom-20 sm:bottom-8"
          }`}
        >
          <MapControls
            metroActive={metroActive}
            onToggleMetro={handleToggleMetro}
            onRecenter={handleRecenter}
            onZoomIn={() => handleZoom(1)}
            onZoomOut={() => handleZoom(-1)}
            activeLayer={activeLayer}
            onToggleLayer={handleToggleLayer}
            routeModeActive={routeModeActive}
            onToggleRouteMode={handleToggleRouteMode}
          />
        </div>

        {selectedPandal && (
          <div
            className={`z-30 pointer-events-auto ${
              isDesktop
                ? "absolute top-20 left-6"
                : "absolute bottom-15 inset-x-0 px-2 sm:px-0"
            }`}
          >
            <PandalBottomSheet
              pandal={selectedPandal}
              onClose={() => setSelectedPandal(null)}
              onViewDetails={(p) =>
                showToast(`Opening details for ${p.name}...`)
              }
              onStartWalking={(p) => {
                setRouteModeActive(true);
                showToast(`Walking route to ${p.name}`);
              }}
              isDesktop={isDesktop}
            />
          </div>
        )}

        {toastMessage && (
          <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none bg-slate-900/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur-md">
            {toastMessage}
          </div>
        )}
      </main>

      {!isDesktop && (
        <BottomNavigation
          activeTab={activeNavTab}
          onSelectTab={setActiveNavTab}
        />
      )}
    </div>
  );
};

export default MapPage;