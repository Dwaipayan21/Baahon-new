
import { useEffect, useRef, useState } from "react";
import {
  KOLKATA_CENTER,
  DEFAULT_ZOOM,
  METRO_DATA,
  METRO_GEOJSON,
} from "../data/constants";
import KolkataSvgMap from "./KolkataSvgMap";

const geoJsonToGooglePath = (geojson) => {
  const paths = [];

  const processFeature = (feature) => {
    if (!feature?.geometry) return;

    const { type, coordinates } = feature.geometry;

    if (type === "LineString") {
      paths.push(
        coordinates.map(([lng, lat]) => ({
          lat,
          lng,
        }))
      );
    }

    if (type === "MultiLineString") {
      coordinates.forEach((line) => {
        paths.push(
          line.map(([lng, lat]) => ({
            lat,
            lng,
          }))
        );
      });
    }
  };

  if (geojson.type === "FeatureCollection") {
    geojson.features.forEach(processFeature);
  } else if (geojson.type === "Feature") {
    processFeature(geojson);
  }

  return paths;
};

const MAP_STYLES = [
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#cae8f2" }],
  },
  {
    featureType: "landscape",
    elementType: "geometry",
    stylers: [{ color: "#f4f3ef" }],
  },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#d7ead4" }],
  },
];

const createPandalIcon = (selected = false) => {
  const color = selected ? "#005bb3" : "#c1121f";
  const size = selected ? 46 : 40;
  const height = selected ? 58 : 50;

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg"
      width="${size}" height="${height}" viewBox="0 0 40 50">

      <path d="M20 1.5C9.8 1.5 1.5 9.8 1.5 20
        C1.5 33.8 20 48.8 20 48.8
        C20 48.8 38.5 33.8 38.5 20
        C38.5 9.8 30.2 1.5 20 1.5Z"
        fill="${color}" stroke="#fbbf24" stroke-width="1.8"/>

      <circle cx="20" cy="19.2" r="12.2"
        fill="#fff" stroke="#fef08a" stroke-width=".6"/>

      <path d="M20 8V12M17.5 10C17.5 11.5 20 12 20 12
        C20 12 22.5 11.5 22.5 10"
        fill="none" stroke="#d97706" stroke-width="1.2"/>

      <path d="M20 12C17 14 14 15.5 12 16.5
        C15 17 17 17 20 17
        C23 17 25 17 28 16.5
        C26 15.5 23 14 20 12Z"
        fill="${color}"/>

      <path d="M12 17H28C28 19 25 20 20 20
        C15 20 12 19 12 17Z"
        fill="#780000"/>

      <rect x="12.5" y="20" width="2.5" height="7" fill="${color}"/>
      <rect x="25" y="20" width="2.5" height="7" fill="${color}"/>

      <path d="M15 27V22.5C15 20.5 25 20.5 25 22.5V27Z"
        fill="#780000"/>

      <path d="M20 22C18.5 24 18.5 25 20 26
        C21.5 25 21.5 24 20 22Z"
        fill="#fbbf24"/>

      <rect x="10.5" y="27" width="19" height="1.8" fill="#8b0000"/>
    </svg>
  `;

  const url = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;

  return {
    url,
    scaledSize: new window.google.maps.Size(size, height),
    anchor: new window.google.maps.Point(size / 2, height),
  };
};

const GoogleMapCanvas = ({
  pandals = [],
  selectedPandal,
  onSelectPandal,
  metroActive = true,
  activeLayer = "roadmap",
  userLocation,
  onMapReady,
  zoom = 1,
}) => {

 
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef([]);
  const metroLinesRef = useRef([]);
  const onSelectRef = useRef(onSelectPandal);

  const [loaded, setLoaded] = useState(
    () => typeof window !== "undefined" && !!window.google?.maps
  );
  const [error, setError] = useState(false);

  useEffect(() => {
    onSelectRef.current = onSelectPandal;
  }, [onSelectPandal]);

  // Load Google Maps
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

  // Initialize map and metro
  useEffect(() => {
    if (!loaded || !containerRef.current || mapRef.current) return;

    const map = new window.google.maps.Map(containerRef.current, {
      center: KOLKATA_CENTER,
      zoom: DEFAULT_ZOOM,
      styles: MAP_STYLES,
      disableDefaultUI: true,
      gestureHandling: "greedy",
    });

    mapRef.current = map;
    onMapReady?.(map);

    metroLinesRef.current.forEach((line) => {
      line.setMap(null);
    });
    metroLinesRef.current = [];

    const lines = [
      ["blueLine", METRO_DATA.blueLine],
      ["greenLine", METRO_DATA.greenLine],
      ["yellowLine", METRO_DATA.yellowLine],
      ["orangeLine", METRO_DATA.orangeLine],
      ["purpleLine", METRO_DATA.purpleLine],
    ];

    let cancelled = false;

    const loadMetroLines = async () => {
      for (const [lineKey, line] of lines) {
        if (!line) continue;

        try {
          const response = await fetch(METRO_GEOJSON[lineKey]);

          if (!response.ok) {
            throw new Error(`Failed to load ${METRO_GEOJSON[lineKey]}`);
          }

          const geojson = await response.json();
          const paths = geoJsonToGooglePath(geojson);

          if (cancelled) return;

          paths.forEach((path) => {
            if (path.length < 2) return;

            const polyline = new window.google.maps.Polyline({
              path,
              geodesic: false,
              strokeColor: line.color,
              strokeOpacity: 0.95,
              strokeWeight: 5,
              map: metroActive ? map : null,
            });

            metroLinesRef.current.push(polyline);
          });
        } catch (error) {
          console.error(`Error loading ${line.name}:`, error);
        }
      }
    };

    loadMetroLines();

    return () => {
      cancelled = true;
      metroLinesRef.current.forEach((line) => line.setMap(null));
      metroLinesRef.current = [];
      mapRef.current = null;
    };
  }, [loaded]);

  // Metro visibility
  useEffect(() => {
    metroLinesRef.current.forEach((line) => {
      line.setMap(metroActive ? mapRef.current : null);
    });
  }, [metroActive]);

  // Map type
  useEffect(() => {
    mapRef.current?.setMapTypeId(activeLayer);
  }, [activeLayer]);

  // Pandal markers
  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach((marker) => marker.setMap(null));

    markersRef.current = pandals.map((pandal) => {
      const selected = selectedPandal?.id === pandal.id;

      const marker = new window.google.maps.Marker({
        position: {
          lat: pandal.lat,
          lng: pandal.lng,
        },
        map: mapRef.current,
        title: pandal.name,
        icon: createPandalIcon(selected),
        zIndex: selected ? 999 : 1,
      });

      marker.addListener("click", () => {
        onSelectRef.current?.(pandal);
      });

      return marker;
    });

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [pandals, selectedPandal, loaded]);

  // Pan to selected pandal
  useEffect(() => {
    if (selectedPandal && mapRef.current) {
      mapRef.current.panTo({
        lat: selectedPandal.lat,
        lng: selectedPandal.lng,
      });
    }
  }, [selectedPandal]);

  // Pan to user location
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(14);
    }
  }, [userLocation]);

  if (!loaded || error) {
    return (
      <KolkataSvgMap
        pandals={pandals}
        selectedPandal={selectedPandal}
        onSelectPandal={onSelectPandal}
        metroActive={metroActive}
        zoom={zoom}
      />
    );
  }

  return <div ref={containerRef} className="w-full h-full" />;
};

export default GoogleMapCanvas;