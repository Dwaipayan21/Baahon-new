import { useState, useEffect, useMemo, useRef } from "react";
import {
  getPandals,
  getNearbyPandals,
  getWalkingRoute,
} from "./services/api";

import Header from "./components/Header";
import SearchBar from "./components/SearchBar";
import MetroLegend from "./components/MetroLegend";
import MapControls from "./components/MapControls";
import GoogleMapCanvas from "./components/GoogleMapCanvas";
import PandalBottomSheet from "./components/PandalBottomSheet";
import PandalDetailsModal from "./components/PandalDetailsModal";
import BottomNavigation from "./components/BottomNavigation";
import LoadingScreen from "./components/LoadingScreen";
import RouteSelectionBar from "./components/RouteSelectionBar";

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

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [selectedPandals, setSelectedPandals] = useState([]);
  const [routeSegments, setRouteSegments] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);

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
      showToast("Geolocation is not supported by this browser");
      return;
    }

    setLocationLoading(true);
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const coords = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        console.log("MY GPS LOCATION:", coords);

        if (
          !Number.isFinite(coords.lat) ||
          !Number.isFinite(coords.lng) ||
          coords.lat < -90 ||
          coords.lat > 90 ||
          coords.lng < -180 ||
          coords.lng > 180
        ) {
          setLocationError("Invalid GPS coordinates received");
          setLocationLoading(false);
          showToast("Unable to read your location");
          return;
        }

        setUserLocation(coords);

        if (googleMapRef.current && window.google?.maps) {
          googleMapRef.current.panTo(coords);
          googleMapRef.current.setZoom(15);
        }

        try {
          const nearbyPandals = await getNearbyPandals({
            latitude: coords.lat,
            longitude: coords.lng,
            maxDistance: 5000,
          });

          console.log("Nearby pandals:", nearbyPandals);

          showToast(
            `${nearbyPandals.length} nearby ${
              nearbyPandals.length === 1 ? "pandal" : "pandals"
            } found`
          );
        } catch (error) {
          console.error("Nearby pandal lookup failed:", error);
          showToast("Could not load nearby pandals");
        }

        setLocationLoading(false);
      },

      (error) => {
        setLocationLoading(false);

        let message = "Unable to get your location";

        if (error.code === error.PERMISSION_DENIED) {
          message = "Location permission was denied";
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          message = "Your location is currently unavailable";
        } else if (error.code === error.TIMEOUT) {
          message = "Location request timed out";
        }

        setLocationError(message);
        showToast(message);
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
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
  const togglePandalSelection = (pandal) => {
    setSelectedPandals((prev) => {
      const alreadySelected = prev.some(
        (item) => item.id === pandal.id
      );

      if (alreadySelected) {
        return prev.filter((item) => item.id !== pandal.id);
      }

      return [...prev, pandal];
    });
  };

  const handleStartRoute = async () => {
    if (selectedPandals.length === 0) {
      showToast("Add at least one pandal to your route");
      return;
    }

    if (!userLocation) {
      showToast("Please use My Location before starting the route");
      return;
    }

    setRouteLoading(true);

    try {
      const segments = [];

      let start = {
        latitude: userLocation.lat,
        longitude: userLocation.lng,
      };

      for (const pandal of selectedPandals) {
        const route = await getWalkingRoute({
          latitude: start.latitude,
          longitude: start.longitude,
          pandalId: pandal.id,
        });

        segments.push(route);

        start = {
          latitude: route.destination.latitude,
          longitude: route.destination.longitude,
        };
      }

      setRouteSegments(segments);

      const totalDistance = segments.reduce(
        (total, segment) =>
          total + Number(segment.distance?.value || 0),
        0
      );

      const totalTime = segments.reduce(
        (total, segment) =>
          total + Number(segment.estimatedTime?.value || 0),
        0
      );

      showToast(
        `Route ready • ${totalDistance.toFixed(1)} km • ${totalTime} min`
      );
    } catch (error) {
      console.error("Route creation failed:", error);
      showToast("Could not create walking route");
    } finally {
      setRouteLoading(false);
    }
  };

  return (
    <>
      <LoadingScreen ready={!loading} />

      <div className="relative w-full h-screen h-[100dvh] flex flex-col bg-[#faf8ff] text-[#131b2e] overflow-hidden">
        {/* 1. Header Bar */}
        <Header
          metroActive={metroActive}
          onToggleMetro={() => setMetroActive((prev) => !prev)}
          onNavigate={(tab) => {
            setActiveNavTab(tab);
            if (tab !== "explore") {
              showToast(`${tab.toUpperCase()} coming soon!`);
            }
          }}
        />

        {/* 2. Main Map Canvas Viewport */}
        <main className="relative flex-1 w-full min-h-0 overflow-hidden">
          {/* Google Maps / Fallback SVG Map */}
          <GoogleMapCanvas
            pandals={filteredPandals}
            selectedPandal={selectedPandal}
            selectedPandals={selectedPandals}
            routeSegments={routeSegments}
            onSelectPandal={(pandal) => {
              setSelectedPandal(pandal);
            }}
            onTogglePandalSelection={togglePandalSelection}
            metroActive={metroActive}
            activeLayer={activeLayer}
            userLocation={userLocation}
            zoom={svgZoom}
            onMapReady={(map) => {
              googleMapRef.current = map;
            }}
          />

          {/* 3. Floating Search & Category Filter Section (Top) */}
          <div className="absolute top-3 sm:top-4 inset-x-0 px-3 sm:px-6 pointer-events-none z-40 flex flex-col items-center">
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
                  : "absolute bottom-14 inset-x-0 px-2 sm:px-0"
              }`}
            >
              <PandalBottomSheet
                pandal={selectedPandal}
                onClose={() => setSelectedPandal(null)}
                onViewDetails={(p) => setModalPandal(p)}
                isDesktop={isDesktop}
                selectedPandals={selectedPandals}
                onTogglePandalSelection={togglePandalSelection}
              />
            </div>
          )}

          {/* 6. Route Selection Bar */}
          <RouteSelectionBar
            selectedPandals={selectedPandals}
            routeLoading={routeLoading}
            onClear={() => {
              setSelectedPandals([]);
              setRouteSegments([]);
            }}
            onStartRoute={handleStartRoute}
          />

          {/* 7. Toast Notification */}
          {toastMessage && (
            <div className="absolute top-36 left-1/2 -translate-x-1/2 z-50 pointer-events-none bg-slate-900/90 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-lg backdrop-blur-md transition-all animate-bounce">
              {toastMessage}
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
    </>
  );
};

export default App;