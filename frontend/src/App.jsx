
import { useState, useRef, useCallback } from "react";
import { useAuth, useUser } from "@clerk/react";


import { usePandalSearch } from "./hooks/usePandalSearch";
import { usePandalData } from "./hooks/usePandalData";
import { useScorecardData } from "./hooks/useScorecardData";
import { useUserLocation } from "./hooks/useUserLocation";
import { usePandalCheckIn } from "./hooks/usePandalCheckIn";
import { useRoutePlanning } from "./hooks/useRoutePlanning";
import { useIsDesktop } from "./hooks/useIsDesktop";


import AppLayout from "./components/layout/AppLayout";

// --------------------------------------------------
// APP
// --------------------------------------------------

const App = () => {
  // --------------------------------------------------
  // USER / SCORECARD
  // --------------------------------------------------

  const { isSignedIn, userId: clerkUserId, getToken } = useAuth();
  const { user } = useUser();
  const { scorecard, setScorecard, leaderboard } = useScorecardData({
    isSignedIn,
    getToken,
  });

  // --------------------------------------------------
  // GENERAL APP STATE
  // --------------------------------------------------

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const [selectedPandal, setSelectedPandal] = useState(null);
  const [modalPandal, setModalPandal] = useState(null);

  const [metroActive, setMetroActive] = useState(true);

  // Kept for compatibility with the existing MapControls UI.
  const [activeLayer, setActiveLayer] = useState("roadmap");

  const [routeModeActive, setRouteModeActive] = useState(false);

  const [activeNavTab, setActiveNavTab] = useState("explore");

  const [userLocation, setUserLocation] = useState(null);

  const [toastMessage, setToastMessage] = useState("");

  // Kept for compatibility with previous app state.
  const [svgZoom, setSvgZoom] = useState(1.0);

  // --------------------------------------------------
  // LOCATION / ROUTE STATE
  // --------------------------------------------------

  const [selectedPandals, setSelectedPandals] = useState([]);

  // --------------------------------------------------
  // REFS
  // --------------------------------------------------

  // MapLibre exposes:
  // flyTo()
  // zoomIn()
  // zoomOut()
  const mapRef = useRef(null);

  // Keep this alias for backwards compatibility.
  const googleMapRef = mapRef;

  // --------------------------------------------------
  // TOAST
  // --------------------------------------------------

  const showToast = useCallback((msg) => {
    setToastMessage(msg);

    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  }, []);

  const {
    routeSegments,
    routeLoading,
    routeData,
    activeRouteMode,
    routeError,
    selectedPandalRoute,
    selectedPandalRouteLoading,
    handleMetroRoute,
    handleRoadRoute,
    clearRoute,
  } = useRoutePlanning({
    selectedPandal,
    userLocation,
    selectedPandals,
    setSelectedPandals,
    setMetroActive,
    showToast,
  });

  const { pandals, appReady } = usePandalData(setSelectedPandal);

  const { handleRecenter } = useUserLocation({
    mapRef,
    setUserLocation,
    showToast,
  });

  const {
    foodPlaces,
    selectedFoodPlace,
    setSelectedFoodPlace,
  } = usePandalCheckIn({
    pandals,
    userLocation,
    isSignedIn,
    clerkUserId,
    getToken,
    setScorecard,
    showToast,
  });

  const isDesktop = useIsDesktop();

  const { filteredPandals, searchResults } = usePandalSearch({
    pandals,
    searchQuery,
    activeCategory,
  });

  // --------------------------------------------------
  // ZOOM HANDLER
  // --------------------------------------------------

  const handleZoom = (delta) => {
    if (!mapRef.current) {
      return;
    }

    if (delta > 0) {
      mapRef.current.zoomIn();
    } else {
      mapRef.current.zoomOut();
    }
  };

  // --------------------------------------------------
  // MAP LAYER
  // --------------------------------------------------

  const handleToggleLayer = () => {
    setActiveLayer((prev) => {
      const next =
        prev === "roadmap"
          ? "satellite"
          : prev === "satellite"
            ? "terrain"
            : "roadmap";

      showToast(
        `Switched map layer to ${next}`
      );

      return next;
    });
  };

  // --------------------------------------------------
  // SELECT / DESELECT PANDAL
  // --------------------------------------------------

  const togglePandalSelection = (pandal) => {
    setSelectedPandals((prev) => {
      const alreadySelected = prev.some(
        (item) => item.id === pandal.id
      );

      if (alreadySelected) {
        return prev.filter(
          (item) => item.id !== pandal.id
        );
      }

      return [...prev, pandal];
    });
  };

  const handleSearchPandalSelect = (pandal) => {
    setSelectedPandal(pandal);
    setSearchQuery(pandal.name);

    if (!mapRef.current) {
      return;
    }

    const lat = Number(pandal.lat);
    const lng = Number(pandal.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return;
    }

    if (typeof mapRef.current.flyTo === "function") {
      mapRef.current.flyTo({
        center: [lng, lat],
        zoom: 16,
      });
    } else if (typeof mapRef.current.panTo === "function") {
      mapRef.current.panTo({
        lat,
        lng,
      });
    }
  };

  return (
    <AppLayout
      appReady={appReady}
      activeNavTab={activeNavTab}
      setActiveNavTab={setActiveNavTab}
      mapRef={mapRef}
      filteredPandals={filteredPandals}
      selectedPandal={selectedPandal}
      setSelectedPandal={setSelectedPandal}
      selectedPandals={selectedPandals}
      routeSegments={routeSegments}
      routeData={routeData}
      metroActive={metroActive}
      setMetroActive={setMetroActive}
      activeLayer={activeLayer}
      userLocation={userLocation}
      foodPlaces={foodPlaces}
      selectedFoodPlace={selectedFoodPlace}
      setSelectedFoodPlace={setSelectedFoodPlace}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      searchResults={searchResults}
      handleSearchPandalSelect={handleSearchPandalSelect}
      scorecard={scorecard}
      pandals={pandals}
      leaderboard={leaderboard}
      activeRouteMode={activeRouteMode}
      user={user}
      activeCategory={activeCategory}
      setActiveCategory={setActiveCategory}
      isDesktop={isDesktop}
      routeModeActive={routeModeActive}
      setRouteModeActive={setRouteModeActive}
      toastMessage={toastMessage}
      showToast={showToast}
      handleToggleLayer={handleToggleLayer}
      handleRecenter={handleRecenter}
      handleZoom={handleZoom}
      modalPandal={modalPandal}
      setModalPandal={setModalPandal}
      togglePandalSelection={togglePandalSelection}
      selectedPandalRoute={selectedPandalRoute}
      selectedPandalRouteLoading={selectedPandalRouteLoading}
      routeError={routeError}
      routeLoading={routeLoading}
      clearRoute={clearRoute}
      handleMetroRoute={handleMetroRoute}
      handleRoadRoute={handleRoadRoute}
    />
  );
};

export default App;
