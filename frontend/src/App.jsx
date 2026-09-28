
import { useState, useEffect, useMemo, useRef } from "react";

import {
  getPandals,
  getNearbyPandals,
  getRoute,
  getWalkingRoute,
  getPandalCrowd,
  createCheckIn,
  getUserCheckIns,
} from "./services/api";

import { findNearestPandal } from "./utils/routeUtils";
import ScorecardPage from "./Pages/ScoreCardPage";
import Header from "./components/Header";
import MapControls from "./components/MapControls";
import GoogleMapCanvas from "./components/GoogleMapCanvas";
import PandalDetailsModal from "./components/PandalDetailsModal";
import BottomNavigation from "./components/BottomNavigation";
import LoadingScreen from "./components/LoadingScreen";
import SearchFilterOverlay from "./components/SearchFilterOverlay";
import PandalRouteOverlay from "./components/PandalRouteOverlay";
import ToastNotification from "./components/ToastNotification";

import { getGuestUserId } from "./services/scorecardService";

const getDistanceInMeters = (lat1, lng1, lat2, lng2) => {
  const earthRadius = 6371000;

  const toRadians = (degrees) => (degrees * Math.PI) / 180;

  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
};

const App = () => {
  // --------------------------------------------------
  // USER / SCORECARD
  // --------------------------------------------------

  const [guestUserId] = useState(() => getGuestUserId());

  const [scorecard, setScorecard] = useState({
    totalPoints: 0,
    visits: [],
  });

  // --------------------------------------------------
  // GENERAL APP STATE
  // --------------------------------------------------

  const [pandals, setPandals] = useState([]);
  const [loading, setLoading] = useState(true);

  console.log(
    "PANDAL LOCATIONS:",
    pandals.map((pandal) => ({
      id: pandal._id,
      name: pandal.name,
      lat: pandal.location?.coordinates?.[1],
      lng: pandal.location?.coordinates?.[0],
    }))
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const [selectedPandal, setSelectedPandal] = useState(null);
  const [modalPandal, setModalPandal] = useState(null);

  const [metroActive, setMetroActive] = useState(true);
  const [activeLayer, setActiveLayer] = useState("roadmap");

  const [routeModeActive, setRouteModeActive] = useState(false);
  const [activeNavTab, setActiveNavTab] = useState("explore");

  const [userLocation, setUserLocation] = useState(null);

  const [isDesktop, setIsDesktop] = useState(
    typeof window !== "undefined"
      ? window.innerWidth >= 768
      : true
  );

  const [toastMessage, setToastMessage] = useState("");

  const [svgZoom, setSvgZoom] = useState(1.0);

  // --------------------------------------------------
  // LOCATION / ROUTE STATE
  // --------------------------------------------------

  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState("");

  const [selectedPandals, setSelectedPandals] = useState([]);

  const [routeSegments, setRouteSegments] = useState([]);
  const [routeLoading, setRouteLoading] = useState(false);

  const [routeData, setRouteData] = useState(null);
  const [activeRouteMode, setActiveRouteMode] = useState(null);
  const [routeError, setRouteError] = useState("");

  const [selectedPandalRoute, setSelectedPandalRoute] =
    useState(null);

  const [
    selectedPandalRouteLoading,
    setSelectedPandalRouteLoading,
  ] = useState(false);

  // --------------------------------------------------
  // REFS
  // --------------------------------------------------

  const googleMapRef = useRef(null);
  const locationWatchRef = useRef(null);

  const checkedInPandalsRef = useRef(new Set());
  const checkInInProgressRef = useRef(new Set());

  // --------------------------------------------------
  // TOAST
  // --------------------------------------------------

  const showToast = (msg) => {
    setToastMessage(msg);

    setTimeout(() => {
      setToastMessage("");
    }, 3500);
  };

  // --------------------------------------------------
  // LOAD SCORECARD FROM MONGODB
  // --------------------------------------------------

  useEffect(() => {
    let cancelled = false;

    const loadScorecard = async () => {
      try {
        const data = await getUserCheckIns(guestUserId);

        if (cancelled) {
          return;
        }

        setScorecard({
          totalPoints: Number(data?.totalPoints) || 0,
          visits: Array.isArray(data?.visits)
            ? data.visits
            : [],
        });

        console.log("SCORECARD LOADED:", data);
      } catch (error) {
        console.error(
          "Failed to load Scorecard from backend:",
          error
        );

        if (!cancelled) {
          setScorecard({
            totalPoints: 0,
            visits: [],
          });
        }
      }
    };

    loadScorecard();

    return () => {
      cancelled = true;
    };
  }, [guestUserId]);

  // --------------------------------------------------
  // LOAD WALKING ROUTE FOR SELECTED PANDAL
  // --------------------------------------------------

  useEffect(() => {
    if (!selectedPandal || !userLocation) {
      setSelectedPandalRoute(null);
      setSelectedPandalRouteLoading(false);
      return;
    }

    let cancelled = false;

    const loadSelectedPandalWalkingRoute = async () => {
      try {
        setSelectedPandalRouteLoading(true);
        setSelectedPandalRoute(null);

        const route = await getRoute({
          latitude: userLocation.lat,
          longitude: userLocation.lng,
          pandalId: selectedPandal.id,
          mode: "walking",
        });

        if (!cancelled) {
          setSelectedPandalRoute(route);
        }
      } catch (error) {
        console.error(
          "Failed to fetch walking route for selected pandal:",
          error
        );

        if (!cancelled) {
          setSelectedPandalRoute(null);
        }
      } finally {
        if (!cancelled) {
          setSelectedPandalRouteLoading(false);
        }
      }
    };

    loadSelectedPandalWalkingRoute();

    return () => {
      cancelled = true;
    };
  }, [selectedPandal, userLocation]);

  // --------------------------------------------------
  // DEBUG ROUTE DATA
  // --------------------------------------------------

  useEffect(() => {
    console.log("FINAL ROUTE DATA:", routeData);
  }, [routeData]);

  // --------------------------------------------------
  // FETCH PANDALS + CROWD DATA
  // --------------------------------------------------

  useEffect(() => {
    let isMounted = true;

    const loadPandalsWithCrowd = async () => {
      try {
        const data = await getPandals();

        if (!isMounted) {
          return;
        }

        const pandalsWithCrowd = await Promise.all(
          data.map(async (pandal) => {
            try {
              const crowd = await getPandalCrowd(pandal.id);

              console.log("CROWD API:", {
                name: pandal.name,
                id: pandal.id,
                crowd,
              });

              return {
                ...pandal,
                crowdStatus:
                  crowd?.status || "UNKNOWN",
                crowdScore:
                  crowd?.score ?? null,
                crowdSampleCount:
                  crowd?.sampleCount ?? 0,
                crowdObservedAt:
                  crowd?.observedAt ?? null,
              };
            } catch (error) {
              console.error(
                `Failed to load crowd for ${pandal.name}:`,
                error
              );

              return {
                ...pandal,
                crowdStatus: "UNKNOWN",
                crowdScore: null,
                crowdSampleCount: 0,
                crowdObservedAt: null,
              };
            }
          })
        );

        if (!isMounted) {
          return;
        }

        setPandals(pandalsWithCrowd);

        if (pandalsWithCrowd.length > 0) {
          setSelectedPandal(pandalsWithCrowd[0]);
        }
      } catch (err) {
        console.error("Backend fetch error:", err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadPandalsWithCrowd();

    return () => {
      isMounted = false;
    };
  }, []);

  // --------------------------------------------------
  // AUTOMATIC LOCATION TRACKING
  // --------------------------------------------------

  useEffect(() => {
    if (!navigator.geolocation) {
      console.warn(
        "Geolocation is not supported by this browser"
      );
      return;
    }

    const handleLocationUpdate = (position) => {
      const coords = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };

      if (
        !Number.isFinite(coords.lat) ||
        !Number.isFinite(coords.lng)
      ) {
        return;
      }

      console.log("AUTO CHECK-IN GPS:", coords);

      setUserLocation(coords);
    };

    const handleLocationError = (error) => {
      console.warn(
        "Automatic location tracking error:",
        error.message
      );
    };

    locationWatchRef.current =
      navigator.geolocation.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 10000,
        }
      );

    return () => {
      if (locationWatchRef.current !== null) {
        navigator.geolocation.clearWatch(
          locationWatchRef.current
        );

        locationWatchRef.current = null;
      }
    };
  }, []);

  // --------------------------------------------------
  // AUTOMATIC CHECK-IN WITHIN 100M
  // --------------------------------------------------

  useEffect(() => {
    if (!userLocation || pandals.length === 0) {
      return;
    }

    const processAutomaticCheckIns = async () => {
      const userId = guestUserId;

      for (const pandal of pandals) {
        if (
          !Number.isFinite(pandal.lat) ||
          !Number.isFinite(pandal.lng)
        ) {
          continue;
        }

        if (
          checkedInPandalsRef.current.has(pandal.id)
        ) {
          continue;
        }

        if (
          checkInInProgressRef.current.has(pandal.id)
        ) {
          continue;
        }

        const distance = getDistanceInMeters(
          userLocation.lat,
          userLocation.lng,
          pandal.lat,
          pandal.lng
        );

        console.log(
          `Distance to ${pandal.name}: ${Math.round(
            distance
          )}m`
        );

        // Frontend pre-check.
        // Backend performs the final verification.
        if (distance > 100) {
          continue;
        }

        checkInInProgressRef.current.add(
          pandal.id
        );

        try {
          const result = await createCheckIn({
            userId,
            pandalId: pandal.id,
            latitude: userLocation.lat,
            longitude: userLocation.lng,
          });

          console.log(
            "AUTOMATIC CHECK-IN SUCCESS:",
            result
          );

          checkedInPandalsRef.current.add(
            pandal.id
          );

          showToast(
            `📍 ${result.pandalName} visited! +${result.points} points`
          );

          // Refresh Scorecard from MongoDB
          try {
            const updatedScorecard =
              await getUserCheckIns(userId);

            setScorecard({
              totalPoints:
                Number(
                  updatedScorecard?.totalPoints
                ) || 0,

              visits: Array.isArray(
                updatedScorecard?.visits
              )
                ? updatedScorecard.visits
                : [],
            });

            console.log(
              "SCORECARD REFRESHED:",
              updatedScorecard
            );
          } catch (scorecardError) {
            console.error(
              "Check-in succeeded, but failed to refresh Scorecard:",
              scorecardError
            );
          }
        } catch (error) {
          // 409 = already checked in
          if (error.status === 409) {
            checkedInPandalsRef.current.add(
              pandal.id
            );

            console.log(
              `Already checked in at ${pandal.name}`
            );
          } else if (error.status === 403) {
            console.log(
              `Backend says user is outside the check-in radius for ${pandal.name}`
            );
          } else {
            console.error(
              `Automatic check-in failed for ${pandal.name}:`,
              error
            );
          }
        } finally {
          checkInInProgressRef.current.delete(
            pandal.id
          );
        }
      }
    };

    processAutomaticCheckIns();
  }, [userLocation, pandals, guestUserId]);

  // --------------------------------------------------
  // RESPONSIVE SCREEN LISTENER
  // --------------------------------------------------

  useEffect(() => {
    const handleResize = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    window.addEventListener(
      "resize",
      handleResize
    );

    return () => {
      window.removeEventListener(
        "resize",
        handleResize
      );
    };
  }, []);

  // --------------------------------------------------
  // FILTERED PANDALS
  // --------------------------------------------------

  const filteredPandals = useMemo(() => {
    const query = searchQuery
      .toLowerCase()
      .trim();

    return pandals.filter((pandal) => {
      const searchableText =
        `${pandal.name} ${pandal.area} ${pandal.address} ${pandal.metroStation} ${pandal.category}`.toLowerCase();

      if (
        query &&
        !searchableText.includes(query)
      ) {
        return false;
      }

      if (activeCategory === "metro") {
        return Boolean(pandal.metroStation);
      }

      if (activeCategory === "low_rush") {
        return pandal.crowdType === "LOW";
      }

      if (activeCategory === "bonedi") {
        return (
          pandal.category === "bonedi" ||
          pandal.area
            ?.toLowerCase()
            .includes("north")
        );
      }

      if (activeCategory === "theme") {
        return pandal.category === "theme";
      }

      if (activeCategory === "traditional") {
        return (
          pandal.category === "traditional"
        );
      }

      return true;
    });
  }, [
    pandals,
    searchQuery,
    activeCategory,
  ]);

  // --------------------------------------------------
  // ZOOM HANDLER
  // --------------------------------------------------

  const handleZoom = (delta) => {
    if (
      googleMapRef.current &&
      window.google?.maps
    ) {
      const currentZoom =
        googleMapRef.current.getZoom() || 13;

      googleMapRef.current.setZoom(
        currentZoom + delta
      );
    } else {
      setSvgZoom((prev) =>
        Math.min(
          Math.max(
            Number(
              (
                prev +
                delta * 0.15
              ).toFixed(2)
            ),
            0.75
          ),
          2.2
        )
      );
    }
  };

  // --------------------------------------------------
  // RECENTER / LOCATE ME
  // --------------------------------------------------

  const handleRecenter = () => {
    if (!navigator.geolocation) {
      showToast(
        "Geolocation is not supported by this browser"
      );

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

        console.log(
          "MY GPS LOCATION:",
          coords
        );

        if (
          !Number.isFinite(coords.lat) ||
          !Number.isFinite(coords.lng) ||
          coords.lat < -90 ||
          coords.lat > 90 ||
          coords.lng < -180 ||
          coords.lng > 180
        ) {
          setLocationError(
            "Invalid GPS coordinates received"
          );

          setLocationLoading(false);

          showToast(
            "Unable to read your location"
          );

          return;
        }

        setUserLocation(coords);

        if (
          googleMapRef.current &&
          window.google?.maps
        ) {
          googleMapRef.current.panTo(coords);
          googleMapRef.current.setZoom(15);
        }

        try {
          const nearbyPandals =
            await getNearbyPandals({
              latitude: coords.lat,
              longitude: coords.lng,
              maxDistance: 5000,
            });

          console.log(
            "Nearby pandals:",
            nearbyPandals
          );

          showToast(
            `${nearbyPandals.length} nearby ${
              nearbyPandals.length === 1
                ? "pandal"
                : "pandals"
            } found`
          );
        } catch (error) {
          console.error(
            "Nearby pandal lookup failed:",
            error
          );

          showToast(
            "Could not load nearby pandals"
          );
        }

        setLocationLoading(false);
      },

      (error) => {
        setLocationLoading(false);

        let message =
          "Unable to get your location";

        if (
          error.code ===
          error.PERMISSION_DENIED
        ) {
          message =
            "Location permission was denied";
        } else if (
          error.code ===
          error.POSITION_UNAVAILABLE
        ) {
          message =
            "Your location is currently unavailable";
        } else if (
          error.code === error.TIMEOUT
        ) {
          message =
            "Location request timed out";
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

  // --------------------------------------------------
  // METRO + WALK ROUTE
  // --------------------------------------------------

  const handleMetroRoute = async () => {
    console.log(
      "handleMetroRoute called"
    );

    setRouteError("");

    if (selectedPandals.length === 0) {
      showToast("Select a pandal first");
      return;
    }

    if (!userLocation) {
      showToast(
        "Please use My Location before starting the route"
      );

      return;
    }

    setMetroActive(true);
    setActiveRouteMode("metro");

    setRouteLoading(true);
    setRouteData(null);

    const selectedPandalSnapshot = [
      ...selectedPandals,
    ];

    try {
      const routes = [];

      let currentLocation = userLocation;

      for (
        const pandal of selectedPandalSnapshot
      ) {
        console.log(
          "Metro getRoute request:",
          {
            mode: "metro",
            userLocation:
              currentLocation,
            pandalId: pandal.id,
          }
        );

        const route = await getRoute({
          latitude:
            currentLocation.lat,
          longitude:
            currentLocation.lng,
          pandalId: pandal.id,
          mode: "metro",
        });

        console.log(
          "Metro getRoute response:",
          {
            mode: "metro",
            userLocation:
              currentLocation,
            pandalId: pandal.id,
            route,
          }
        );

        routes.push(route);

        currentLocation = {
          lat: pandal.lat,
          lng: pandal.lng,
        };
      }

      setRouteData(
        routes.length === 1
          ? routes[0]
          : routes
      );
    } catch (error) {
      console.error(
        "Metro route failed:",
        error
      );

      setRouteError(
        "Metro route is unavailable for this pandal"
      );

      showToast(
        "Metro route is unavailable"
      );
    } finally {
      setRouteLoading(false);
    }
  };

  // --------------------------------------------------
  // ROAD ROUTE
  // --------------------------------------------------

  const handleRoadRoute = async () => {
    console.log(
      "handleRoadRoute called"
    );

    setRouteError("");

    if (selectedPandals.length === 0) {
      showToast("Select a pandal first");
      return;
    }

    if (!userLocation) {
      showToast(
        "Please use My Location before starting the route"
      );

      return;
    }

    setMetroActive(false);
    setActiveRouteMode("road");

    setRouteLoading(true);
    setRouteData(null);

    const selectedPandalSnapshot = [
      ...selectedPandals,
    ];

    try {
      const routes = [];

      let currentLocation = userLocation;

      for (
        const pandal of selectedPandalSnapshot
      ) {
        console.log(
          "Road getRoute request:",
          {
            mode: "car",
            userLocation:
              currentLocation,
            pandalId: pandal.id,
          }
        );

        const route = await getRoute({
          latitude:
            currentLocation.lat,
          longitude:
            currentLocation.lng,
          pandalId: pandal.id,
          mode: "car",
        });

        console.log(
          "Road getRoute response:",
          {
            mode: "car",
            userLocation:
              currentLocation,
            pandalId: pandal.id,
            route,
          }
        );

        routes.push(route);

        currentLocation = {
          lat: pandal.lat,
          lng: pandal.lng,
        };
      }

      setRouteData(
        routes.length === 1
          ? routes[0]
          : routes
      );
    } catch (error) {
      console.error(
        "Road route failed:",
        error
      );

      setRouteError(
        "Road route is unavailable for this pandal"
      );

      showToast(
        "Could not create road route"
      );
    } finally {
      setRouteLoading(false);
    }
  };

  // --------------------------------------------------
  // WALKING ROUTE
  // --------------------------------------------------

  const handleStartRoute = async () => {
    if (selectedPandals.length === 0) {
      showToast(
        "Add at least one pandal to your route"
      );

      return;
    }

    if (!userLocation) {
      showToast(
        "Please use My Location before starting the route"
      );

      return;
    }

    setRouteLoading(true);

    try {
      const remainingPandals = [
        ...selectedPandals,
      ];

      console.table(
        remainingPandals.map(
          (pandal) => ({
            name: pandal.name,
            lat: pandal.lat,
            lng: pandal.lng,
          })
        )
      );

      const segments = [];

      let currentLocation =
        userLocation;

      while (
        remainingPandals.length > 0
      ) {
        const nearest =
          findNearestPandal(
            currentLocation,
            remainingPandals
          );

        console.log(
          "Current location:",
          currentLocation
        );

        console.log(
          "Nearest pandal:",
          nearest
        );

        console.log(
          "Route order:",
          segments.map(
            (segment) =>
              segment.destination?.name
          )
        );

        if (!nearest) {
          break;
        }

        const { pandal } = nearest;

        const route =
          await getWalkingRoute({
            latitude:
              currentLocation.lat,
            longitude:
              currentLocation.lng,
            pandalId: pandal.id,
          });

        segments.push(route);

        currentLocation = {
          lat: route.destination.latitude,
          lng: route.destination.longitude,
        };

        const index =
          remainingPandals.findIndex(
            (item) =>
              item.id === pandal.id
          );

        remainingPandals.splice(
          index,
          1
        );
      }

      setRouteSegments(segments);

      const totalDistance =
        segments.reduce(
          (total, segment) =>
            total +
            Number(
              segment.distance?.value ||
                0
            ),
          0
        );

      const totalTime =
        segments.reduce(
          (total, segment) =>
            total +
            Number(
              segment.estimatedTime
                ?.value || 0
            ),
          0
        );

      showToast(
        `Route ready • ${totalDistance.toFixed(
          1
        )} km • ${totalTime} min`
      );
    } catch (error) {
      console.error(
        "Route creation failed:",
        error
      );

      showToast(
        "Could not create walking route"
      );
    } finally {
      setRouteLoading(false);
    }
  };

  // --------------------------------------------------
  // RENDER
  // --------------------------------------------------

  return (
    <>
      <LoadingScreen ready={!loading} />

      <div className="relative w-full h-screen h-[100dvh] flex flex-col bg-[#faf8ff] text-[#131b2e] overflow-hidden">
        {/* 1. Header Bar */}

        <Header
          onNavigate={(tab) => {
            setActiveNavTab(tab);

            if (tab !== "explore") {
              showToast(
                `${tab.toUpperCase()} coming soon!`
              );
            }
          }}
        />

        {/* 2. Main Map / Scorecard Viewport */}

        <main
          className={`relative flex-1 w-full min-h-0 ${
            activeNavTab === "scorecard"
              ? `overflow-y-auto pt-[calc(4rem+1px+env(safe-area-inset-top,0px))] ${
                  isDesktop
                    ? ""
                    : "pb-[calc(4rem+env(safe-area-inset-bottom,0px))]"
                }`
              : "overflow-hidden"
          }`}
        >
          {activeNavTab === "scorecard" ? (
            <ScorecardPage
              isActive={
                activeNavTab === "scorecard"
              }
              scorecard={scorecard}
              pandals={pandals}
              userLocation={userLocation}
              routeData={routeData}
              routeSegments={routeSegments}
              selectedPandals={
                selectedPandals
              }
              activeRouteMode={
                activeRouteMode
              }
              onBack={() =>
                setActiveNavTab("explore")
              }
            />
          ) : (
            <>
              {/* Google Map */}

              <GoogleMapCanvas
                pandals={filteredPandals}
                selectedPandal={selectedPandal}
                selectedPandals={
                  selectedPandals
                }
                routeSegments={
                  routeSegments
                }
                routeData={routeData}
                activeRouteMode={
                  activeRouteMode
                }
                onSelectPandal={(pandal) => {
                  setSelectedPandal(
                    pandal
                  );

                  setRouteData(null);
                  setRouteError("");
                  setRouteSegments(
                    []
                  );

                  setActiveRouteMode(
                    null
                  );

                  setMetroActive(true);
                }}
                onTogglePandalSelection={
                  togglePandalSelection
                }
                metroActive={metroActive}
                activeLayer={activeLayer}
                userLocation={
                  userLocation
                }
                zoom={svgZoom}
                onMapReady={(map) => {
                  googleMapRef.current =
                    map;
                }}
              />

              {/* Search + Category Filter */}

              <SearchFilterOverlay
                searchQuery={
                  searchQuery
                }
                onSearchChange={
                  setSearchQuery
                }
                activeCategory={
                  activeCategory
                }
                onSelectCategory={
                  setActiveCategory
                }
                onClearSearch={() =>
                  setSearchQuery("")
                }
                metroActive={
                  metroActive
                }
                onToggleMetro={() =>
                  setMetroActive(
                    (prev) => !prev
                  )
                }
                visibleCount={
                  filteredPandals.length
                }
                totalCount={
                  pandals.length
                }
              />

              {/* Map Controls */}

              <div
                className={`absolute right-3 sm:right-6 z-30 pointer-events-auto transition-all ${
                  selectedPandal &&
                  !isDesktop
                    ? "bottom-72 sm:bottom-8"
                    : "bottom-20 sm:bottom-8"
                }`}
              >
                <MapControls
                  metroActive={
                    metroActive
                  }
                  onToggleMetro={() =>
                    setMetroActive(
                      (prev) => !prev
                    )
                  }
                  routeModeActive={
                    routeModeActive
                  }
                  onToggleRouteMode={() => {
                    setRouteModeActive(
                      (prev) => !prev
                    );

                    showToast(
                      routeModeActive
                        ? "Route mode disabled"
                        : "Route mode enabled"
                    );
                  }}
                  activeLayer={
                    activeLayer
                  }
                  onToggleLayer={
                    handleToggleLayer
                  }
                  onRecenter={
                    handleRecenter
                  }
                  onZoomIn={() =>
                    handleZoom(1)
                  }
                  onZoomOut={() =>
                    handleZoom(-1)
                  }
                />
              </div>

              {/* Mobile Pandal + Route Stack */}

              <PandalRouteOverlay
                isDesktop={
                  isDesktop
                }
                selectedPandal={
                  selectedPandal
                }
                onClosePandal={() =>
                  setSelectedPandal(
                    null
                  )
                }
                onViewDetails={(p) =>
                  setModalPandal(p)
                }
                selectedPandals={
                  selectedPandals
                }
                onTogglePandalSelection={
                  togglePandalSelection
                }
                selectedPandalRoute={
                  selectedPandalRoute
                }
                selectedPandalRouteLoading={
                  selectedPandalRouteLoading
                }
                routeData={routeData}
                routeError={
                  routeError
                }
                routeLoading={
                  routeLoading
                }
                onClearRoute={() => {
                  setSelectedPandals(
                    []
                  );

                  setRouteSegments(
                    []
                  );

                  setRouteData(null);
                  setRouteError("");

                  setActiveRouteMode(
                    null
                  );

                  setMetroActive(
                    true
                  );
                }}
                onMetroRoute={
                  handleMetroRoute
                }
                onRoadRoute={
                  handleRoadRoute
                }
              />

              {/* Toast */}

              <ToastNotification
                message={
                  toastMessage
                }
              />
            </>
          )}
        </main>

        {/* Pandal Details Modal */}

        {modalPandal && (
          <PandalDetailsModal
            pandal={modalPandal}
            onClose={() =>
              setModalPandal(null)
            }
          />
        )}

        {/* Mobile Bottom Navigation */}

        {!isDesktop && (
          <BottomNavigation
            activeTab={
              activeNavTab
            }
            onSelectTab={(tab) => {
              setActiveNavTab(tab);
            }}
          />
        )}
      </div>
    </>
  );
};

export default App;

