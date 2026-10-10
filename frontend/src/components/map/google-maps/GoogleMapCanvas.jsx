import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  KOLKATA_CENTER,
  DEFAULT_ZOOM,
} from "../../../data/constants";
import { MAP_STYLES } from "../../../utils/mapCanvasUtils";
import UserLocationMarker from "./UserLocationMarker";
import GoogleMapMetroLayer from "./GoogleMapMetroLayer";
import GoogleMapRouteLayer from "./GoogleMapRouteLayer";
import GoogleMapPandalMarkers from "./GoogleMapPandalMarkers";
import GoogleMapToilet from "./GoogleMapToilet";
import GoogleMapMedicine from "./GoogleMapMedicine";
import FoodMarkers from "../../food/FoodMarker";

const GoogleMapCanvas = forwardRef(function GoogleMapCanvas(
  {
    pandals = [],
    selectedPandal,
    selectedPandals = [],
    routeSegments = [],
    routeData = null,
    onSelectPandal,
    metroActive = true,
    toiletsActive = false,
    medicinesActive = false,
    activeLayer = "roadmap",
    userLocation,
    foodPlaces = [],
    selectedFoodPlace = null,
    onSelectFoodPlace,
    onMapReady,
    onMapError,
    zoom = 1,
  },
  ref
) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const hasCenteredOnUserRef = useRef(false);

  const [loaded, setLoaded] = useState(
    () => typeof window !== "undefined" && !!window.google?.maps
  );

  const [error, setError] = useState(false);
  const [mapInstance, setMapInstance] = useState(null);
  void zoom;

  useImperativeHandle(ref, () => ({
    getMap: () => mapInstance,
    flyTo: ({ center, zoom: targetZoom }) => {
      if (!mapInstance || !Array.isArray(center)) return;

      const [lng, lat] = center;

      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        mapInstance.panTo({ lat, lng });
      }

      if (Number.isFinite(targetZoom)) {
        mapInstance.setZoom(targetZoom);
      }
    },
    zoomIn: () => {
      const currentZoom = mapInstance?.getZoom();

      if (typeof currentZoom === "number") {
        mapInstance.setZoom(currentZoom + 1);
      }
    },
    zoomOut: () => {
      const currentZoom = mapInstance?.getZoom();

      if (typeof currentZoom === "number") {
        mapInstance.setZoom(currentZoom - 1);
      }
    },
  }), [mapInstance]);

  // ---------------------------------------------------------
  // Google Maps authentication failure
  // ---------------------------------------------------------
  useEffect(() => {
    if (typeof window === "undefined") return;

    const previousAuthFailure = window.gm_authFailure;

    window.gm_authFailure = () => {
      console.error("Google Maps authentication failed.");
      setError(true);
      onMapError?.();

      previousAuthFailure?.();
    };

    return () => {
      window.gm_authFailure = previousAuthFailure;
    };
  }, [onMapError]);

  // ---------------------------------------------------------
  // Load Google Maps
  // ---------------------------------------------------------
  useEffect(() => {
    if (loaded || typeof window === "undefined") return;

    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

    if (!key) {
      setError(true);
      return;
    }

    const id = "google-maps-script";
    let script = document.getElementById(id);

    const handleLoad = () => setLoaded(true);
    const handleError = () => setError(true);

    if (!script) {
      script = document.createElement("script");
      script.id = id;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${key}`;
      script.async = true;
      script.defer = true;
      script.onload = handleLoad;
      script.onerror = handleError;

      document.head.appendChild(script);
    } else {
      script.addEventListener("load", handleLoad);
      script.addEventListener("error", handleError);

      return () => {
        script.removeEventListener("load", handleLoad);
        script.removeEventListener("error", handleError);
      };
    }
  }, [loaded]);

  useEffect(() => {
    if (error) {
      onMapError?.();
    }
  }, [error, onMapError]);

  // ---------------------------------------------------------
  // Initialize Google Map
  // ---------------------------------------------------------
  useEffect(() => {
    if (!loaded || !containerRef.current || mapRef.current) {
      return;
    }

    try {
      const map = new window.google.maps.Map(
        containerRef.current,
        {
          center: KOLKATA_CENTER,
          zoom: DEFAULT_ZOOM,
          styles: MAP_STYLES,
          disableDefaultUI: true,
          gestureHandling: "greedy",
        }
      );

      mapRef.current = map;
      setMapInstance(map);

      onMapReady?.(map);
    } catch (mapError) {
      console.error(
        "Google Maps initialization failed:",
        mapError
      );

      setError(true);
      onMapError?.();
    }

    return () => {
      mapRef.current = null;
      setMapInstance(null);
    };
  }, [loaded, onMapReady, onMapError]);

  // ---------------------------------------------------------
  // Map type
  // ---------------------------------------------------------
  useEffect(() => {
    mapRef.current?.setMapTypeId(activeLayer);
  }, [activeLayer]);

  // ---------------------------------------------------------
  // Pan to selected pandal
  // ---------------------------------------------------------
  useEffect(() => {
    if (selectedPandal && mapRef.current) {
      mapRef.current.panTo({
        lat: selectedPandal.lat,
        lng: selectedPandal.lng,
      });
    }
  }, [selectedPandal]);

  // ---------------------------------------------------------
  // Pan to user location
  // ---------------------------------------------------------
  useEffect(() => {
    if (!mapInstance || !userLocation || hasCenteredOnUserRef.current) {
      return;
    }

    hasCenteredOnUserRef.current = true;

    mapInstance.panTo(userLocation);
    mapInstance.setZoom(14);
  }, [mapInstance, userLocation]);

  // ---------------------------------------------------------
  // Google Maps fallback
  // ---------------------------------------------------------
  if (!loaded || error) {
    return null;
  }

  // ---------------------------------------------------------
  // Google Map
  // ---------------------------------------------------------
  return (
    <>
      <div
        ref={containerRef}
        className="w-full h-full"
      />

      <GoogleMapMetroLayer
        map={mapInstance}
        metroActive={metroActive}
      />

      <GoogleMapToilet
        map={mapInstance}
        toiletsActive={toiletsActive}
      />

      <GoogleMapMedicine
        map={mapInstance}
        medicinesActive={medicinesActive}
      />

      <GoogleMapRouteLayer
        map={mapInstance}
        routeData={routeData}
        routeSegments={routeSegments}
      />

      <GoogleMapPandalMarkers
        map={mapInstance}
        pandals={pandals}
        selectedPandal={selectedPandal}
        selectedPandals={selectedPandals}
        onSelectPandal={onSelectPandal}
      />

      <FoodMarkers
        map={mapInstance}
        foodPlaces={foodPlaces}
        selectedFoodPlace={selectedFoodPlace}
        onSelectFoodPlace={onSelectFoodPlace}
      />

      <UserLocationMarker
        map={mapInstance}
        position={userLocation}
      />
    </>
  );
});

export default GoogleMapCanvas;