import { useState, useEffect, useMemo, useRef } from "react";
import { getPandals } from "./services/api";
import { KOLKATA_CENTER } from "./data/constants";

import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import MetroLegend from "./components/MetroLegend";
import MapControls from "./components/MapControls";
import GoogleMapCanvas from "./components/GoogleMapCanvas";
import PandalBottomSheet from "./components/PandalBottomSheet";
import PandalDetailsModal from "./components/PandalDetailsModal";
import BottomNavigation from "./components/BottomNavigation";

const App = () => {
  const [pandals, setPandals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedPandal, setSelectedPandal] = useState(null);
  const [metroActive, setMetroActive] = useState(true);
  const [activeLayer, setActiveLayer] = useState("roadmap");
  const [routeModeActive, setRouteModeActive] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState("explore");
  const [userLocation, setUserLocation] = useState(null);
  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined" ? window.innerWidth >= 768 : true
  );
  const [toastMessage, setToastMessage] = useState("");
  const [modalPandal, setModalPandal] = useState(null);
  const [svgZoom, setSvgZoom] = useState(1.0);

  const googleMapRef = useRef(null);

  // 1. Fetch Pandals from Backend API on Mount
  useEffect(() => {
    let isMounted = true;

    getPandals()
      .then((data) => {
        if (!isMounted) return;
        setPandals(data);
        if (data.length > 0) {
          setSelectedPandal(data[0]);
        }
      })
      .catch((err) => {
        console.error("Backend fetch error:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Responsive Screen Listener
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 3. Filtered Pandals Computation
  const filteredPandals = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    return pandals.filter((pandal) => {
      // Text search matching name, area, address, metro station
      const searchableText = `${pandal.name} ${pandal.area} ${pandal.address} ${pandal.metroStation} ${pandal.category}`.toLowerCase();

      if (query && !searchableText.includes(query)) {
        return false;
      }

      // Category chip filters
      if (activeCategory === "metro") return Boolean(pandal.metroStation);
      if (activeCategory === "low_rush") return pandal.crowdType === "low";
      if (activeCategory === "bonedi") return pandal.category === "bonedi" || pandal.area?.toLowerCase().includes("north");
      if (activeCategory === "theme") return pandal.category === "theme";
      if (activeCategory === "traditional") return pandal.category === "traditional";

      return true;
    });
  }, [pandals, searchQuery, activeCategory]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3500);
  };

  // Zoom Handler
  const handleZoom = (delta) => {
    if (googleMapRef.current && window.google?.maps) {
      const currentZoom = googleMapRef.current.getZoom() || 13;
      googleMapRef.current.setZoom(currentZoom + delta);
    } else {
      setSvgZoom((prev) => Math.min(Math.max(Number((prev + delta * 0.15).toFixed(2)), 0.75), 2.2));
    }
  };

  // Recenter / Locate Me Handler
  const handleRecenter = () => {
    if (!navigator.geolocation) {
      if (googleMapRef.current && window.google?.maps) {
        googleMapRef.current.panTo(KOLKATA_CENTER);
        googleMapRef.current.setZoom(13);
      } else {
        setSvgZoom(1.0);
      }
      showToast("Centered to Kolkata");
      return;
    }

    showToast("Finding your current location...");

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setUserLocation(coords);
        if (googleMapRef.current && window.google?.maps) {
          googleMapRef.current.panTo(coords);
          googleMapRef.current.setZoom(14);
        }
        showToast("Centered to your location");
      },
      () => {
        if (googleMapRef.current && window.google?.maps) {
          googleMapRef.current.panTo(KOLKATA_CENTER);
          googleMapRef.current.setZoom(13);
        } else {
          setSvgZoom(1.0);
        }
        showToast("Defaulted to Kolkata center");
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Toggle Map Layer Type
  const handleToggleLayer = () => {
    setActiveLayer((prev) => {
      const next = prev === "roadmap" ? "satellite" : prev === "satellite" ? "terrain" : "roadmap";
      showToast(`Switched map layer to ${next}`);
      return next;
    });
  };

  // Start Navigation Trigger
  const handleStartWalking = (pandal) => {
    setRouteModeActive(true);
    showToast(`Navigating to ${pandal.name}`);
    const url = `https://www.google.com/maps/dir/?api=1&destination=${pandal.lat},${pandal.lng}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative w-full h-screen h-[100dvh] flex flex-col bg-[#faf8ff] text-[#131b2e] overflow-hidden">
      {/* 1. Header Bar */}
      <Header
        metroActive={metroActive}
        onToggleMetro={() => setMetroActive((prev) => !prev)}
      />

      {/* 2. Main Map Canvas Viewport */}
      <main className="relative flex-1 w-full h-full pt-16 overflow-hidden">
        {/* Google Maps / Fallback SVG Map */}
        <GoogleMapCanvas
          pandals={filteredPandals}
          selectedPandal={selectedPandal}
          onSelectPandal={(pandal) => {
            setSelectedPandal(pandal);
          }}
          metroActive={metroActive}
          activeLayer={activeLayer}
          userLocation={userLocation}
          zoom={svgZoom}
          onMapReady={(map) => {
            googleMapRef.current = map;
          }}
        />

        {/* 3. Floating Search & Category Filter Section (Top) */}
        <div className="absolute top-19 inset-x-0 px-3 sm:px-6 pointer-events-none z-30 flex flex-col items-center">
          <div className="w-full max-w-md pointer-events-auto flex flex-col gap-2">
            <SearchBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              activeCategory={activeCategory}
              onSelectCategory={setActiveCategory}
              onClearSearch={() => setSearchQuery("")}
            />

            <MetroLegend
              metroActive={metroActive}
              onToggleMetro={() => setMetroActive((prev) => !prev)}
              visibleCount={filteredPandals.length}
              totalCount={pandals.length}
            />
          </div>
        </div>

        {/* 4. Floating Map Utility Controls (Right Side) */}
        <div
          className={`absolute right-3 sm:right-6 z-30 pointer-events-auto transition-all ${
            selectedPandal && !isDesktop
              ? "bottom-72 sm:bottom-8"
              : "bottom-20 sm:bottom-8"
          }`}
        >
          <MapControls
            metroActive={metroActive}
            onToggleMetro={() => setMetroActive((prev) => !prev)}
            routeModeActive={routeModeActive}
            onToggleRouteMode={() => {
              setRouteModeActive((prev) => !prev);
              showToast(routeModeActive ? "Route mode disabled" : "Route mode enabled");
            }}
            activeLayer={activeLayer}
            onToggleLayer={handleToggleLayer}
            onRecenter={handleRecenter}
            onZoomIn={() => handleZoom(1)}
            onZoomOut={() => handleZoom(-1)}
          />
        </div>

        {/* 5. Selected Pandal Bottom Sheet / Drawer */}
        {selectedPandal && (
          <div
            className={`z-30 pointer-events-auto transition-all duration-300 ${
              isDesktop
                ? "absolute bottom-8 left-6"
                : "absolute bottom-16 inset-x-0 px-2 sm:px-0"
            }`}
          >
            <PandalBottomSheet
              pandal={selectedPandal}
              onClose={() => setSelectedPandal(null)}
              onViewDetails={(p) => setModalPandal(p)}
              onStartWalking={handleStartWalking}
              isDesktop={isDesktop}
            />
          </div>
        )}

        {/* 6. Toast Notification */}
        {toastMessage && (
          <div className="absolute top-36 left-1/2 -translate-x-1/2 z-50 pointer-events-none bg-slate-900/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur-md transition-all animate-bounce">
            {toastMessage}
          </div>
        )}

        {/* 7. Loading Spinner if Initial Load */}
        {loading && (
          <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/70 backdrop-blur-xs">
            <div className="flex flex-col items-center gap-2 text-[#005bb3]">
              <span className="material-symbols-outlined text-[36px] animate-spin">
                progress_activity
              </span>
              <span className="text-xs font-bold tracking-wide">
                Loading Kolkata Pandals...
              </span>
            </div>
          </div>
        )}
      </main>

      {/* 8. Pandal Extended Details Modal */}
      {modalPandal && (
        <PandalDetailsModal
          pandal={modalPandal}
          onClose={() => setModalPandal(null)}
        />
      )}

      {/* 9. Mobile Bottom Navigation */}
      {!isDesktop && (
        <BottomNavigation
          activeTab={activeNavTab}
          onSelectTab={(tab) => {
            setActiveNavTab(tab);
            if (tab !== "explore") {
              showToast(`${tab.charAt(0).toUpperCase() + tab.slice(1)} tab coming soon!`);
            }
          }}
        />
      )}
    </div>
  );
};

export default App;