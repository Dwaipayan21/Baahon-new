import { useEffect, useRef, useState } from "react";
import { KOLKATA_CENTER, DEFAULT_ZOOM, METRO_DATA } from "../data/constants";
import KolkataSvgMap from "./KolkataSvgMap";

// Clean custom map styling for Autumn Clarity aesthetic
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
    featureType: "road.arterial",
    elementType: "geometry",
    stylers: [{ color: "#fcfaf2" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#d7ead4" }],
  },
  {
    featureType: "transit.line",
    elementType: "geometry",
    stylers: [{ color: "#cbd5e1" }],
  },
  {
    featureType: "administrative",
    elementType: "labels.text.fill",
    stylers: [{ color: "#334155" }],
  },
];

// Helper to generate custom SVG Pin Data URI for Google Maps Markers with Durga Puja Pandal design
const createPandalIcon = (isSelected = false) => {
  const svg = isSelected
    ? `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 46 58" width="46" height="58">
      <defs>
        <filter id="shadowSel" x="-30%" y="-20%" width="160%" height="150%">
          <feDropShadow dx="0" dy="3.5" stdDeviation="3" flood-color="#001b3d" flood-opacity="0.4"/>
        </filter>
        <linearGradient id="selGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#005bb3"/>
          <stop offset="100%" stop-color="#002d62"/>
        </linearGradient>
        <linearGradient id="goldGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fef08a"/>
          <stop offset="50%" stop-color="#fbbf24"/>
          <stop offset="100%" stop-color="#d97706"/>
        </linearGradient>
      </defs>
      <!-- Outer Selected Pin with Festive Gold Halo -->
      <path d="M 23 1.8 C 11.4 1.8 2 11.2 2 22.8 C 2 38.5 23 56.2 23 56.2 C 23 56.2 44 38.5 44 22.8 C 44 11.2 34.6 1.8 23 1.8 Z" fill="url(#selGrad)" stroke="url(#goldGrad)" stroke-width="2.6" filter="url(#shadowSel)"/>
      
      <!-- Inner White Medallion -->
      <circle cx="23" cy="22" r="14" fill="#ffffff" stroke="#fef08a" stroke-width="0.8"/>
      
      <!-- Durga Puja Pandal Silhouette (Selected State) -->
      <!-- Top Trishul / Kalash -->
      <path d="M 23 9 L 23 13.5 M 20.8 10.5 C 20.8 12.2 23 13 23 13 C 23 13 25.2 12.2 25.2 10.5" fill="none" stroke="#d97706" stroke-width="1.3" stroke-linecap="round"/>
      <circle cx="23" cy="13.8" r="1.3" fill="#d97706"/>
      
      <!-- Tier 1 Canopy -->
      <path d="M 23 13.5 C 20 15.8 16.5 17.5 14 18.8 C 16 19.3 19.5 19.5 23 19.5 C 26.5 19.5 30 19.3 32 18.8 C 29.5 17.5 26 15.8 23 13.5 Z" fill="#005bb3"/>
      
      <!-- Tier 2 Cornice -->
      <path d="M 13 19.8 L 33 19.8 C 33 21.6 30 22.5 23 22.5 C 16 22.5 13 21.6 13 19.8 Z" fill="#003d7a"/>
      
      <!-- Columns & Sanctum -->
      <rect x="13.8" y="23.2" width="2.8" height="8.5" rx="0.6" fill="#005bb3"/>
      <rect x="29.4" y="23.2" width="2.8" height="8.5" rx="0.6" fill="#005bb3"/>
      <path d="M 17.2 31.7 L 17.2 26.2 C 17.2 23.8 28.8 23.8 28.8 26.2 L 28.8 31.7 Z" fill="#002d62"/>
      
      <!-- Holy Sanctum Diya / Flame -->
      <path d="M 23 25.2 C 21.6 27.2 21.6 28.8 23 29.8 C 24.4 28.8 24.4 27.2 23 25.2 Z" fill="url(#goldGrad)"/>
      
      <!-- Plinth -->
      <rect x="12" y="31.7" width="22" height="2" rx="0.8" fill="#003d7a"/>
    </svg>
    `.trim()
    : `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 50" width="40" height="50">
      <defs>
        <filter id="festiveShadow" x="-25%" y="-15%" width="150%" height="140%">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2" flood-color="#580808" flood-opacity="0.32"/>
        </filter>
        <!-- Rich Durga Puja Sindoor Vermilion Gradient -->
        <linearGradient id="sindoorRed" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#e62e2e"/>
          <stop offset="60%" stop-color="#c1121f"/>
          <stop offset="100%" stop-color="#8b0000"/>
        </linearGradient>
        <linearGradient id="goldTrim" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#fffbeb"/>
          <stop offset="60%" stop-color="#fbbf24"/>
          <stop offset="100%" stop-color="#d97706"/>
        </linearGradient>
      </defs>
      
      <!-- Festive Vermilion Pin Shell with Gold Border -->
      <path d="M 20 1.5 C 9.8 1.5 1.5 9.8 1.5 20 C 1.5 33.8 20 48.8 20 48.8 C 20 48.8 38.5 33.8 38.5 20 C 38.5 9.8 30.2 1.5 20 1.5 Z" fill="url(#sindoorRed)" stroke="url(#goldTrim)" stroke-width="1.8" filter="url(#festiveShadow)"/>
      
      <!-- Inner White/Ivory Medallion -->
      <circle cx="20" cy="19.2" r="12.2" fill="#ffffff" stroke="#fef08a" stroke-width="0.6"/>
      
      <!-- Traditional Bengali Durga Puja Pandal / Mandap Architecture -->
      <!-- 1. Sacred Kalash & Trishul Finial -->
      <path d="M 20 7.8 L 20 11.8 M 18 9.2 C 18 10.6 20 11.4 20 11.4 C 20 11.4 22 10.6 22 9.2" fill="none" stroke="#d97706" stroke-width="1.2" stroke-linecap="round"/>
      <circle cx="20" cy="12.2" r="1.1" fill="#d97706"/>
      
      <!-- 2. Tiered Bengali Chala / Mandap Canopy Roof -->
      <path d="M 20 11.8 C 17.5 13.8 14.5 15.2 12.2 16.4 C 14 16.8 17 17 20 17 C 23 17 26 16.8 27.8 16.4 C 25.5 15.2 22.5 13.8 20 11.8 Z" fill="#b91c1c"/>
      
      <!-- 3. Middle Cornice / Decorative Arch -->
      <path d="M 11.4 17.2 L 28.6 17.2 C 28.6 18.8 26 19.6 20 19.6 C 14 19.6 11.4 18.8 11.4 17.2 Z" fill="#8b0000"/>
      <circle cx="20" cy="18.4" r="0.7" fill="#fbbf24"/>
      
      <!-- 4. Mandap Pillars & Sacred Sanctum (Garbhagriha) -->
      <rect x="12" y="20.2" width="2.4" height="7.2" rx="0.5" fill="#c1121f"/>
      <rect x="25.6" y="20.2" width="2.4" height="7.2" rx="0.5" fill="#c1121f"/>
      <path d="M 15 27.4 L 15 22.6 C 15 20.6 25 20.6 25 22.6 L 25 27.4 Z" fill="#780000"/>
      
      <!-- 5. Holy Diya / Sacred Flame inside Sanctum -->
      <path d="M 20 21.8 C 18.8 23.5 18.8 24.8 20 25.8 C 21.2 24.8 21.2 23.5 20 21.8 Z" fill="#fbbf24"/>
      
      <!-- 6. Mandap Plinth / Base Platform -->
      <rect x="10.5" y="27.4" width="19" height="1.8" rx="0.6" fill="#8b0000"/>
    </svg>
    `.trim();

  const width = isSelected ? 46 : 40;
  const height = isSelected ? 58 : 50;
  const base64Svg = btoa(unescape(encodeURIComponent(svg)));

  return {
    url: `data:image/svg+xml;base64,${base64Svg}`,
    scaledSize: window.google ? new window.google.maps.Size(width, height) : null,
    anchor: window.google ? new window.google.maps.Point(width / 2, height) : null,
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
  const metroPolylinesRef = useRef([]);
  const metroMarkersRef = useRef([]);

  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(
    () => typeof window !== "undefined" && Boolean(window.google?.maps)
  );
  const [loadError, setLoadError] = useState(false);

  const onMapReadyRef = useRef(onMapReady);
  const onSelectPandalRef = useRef(onSelectPandal);

  useEffect(() => {
    onMapReadyRef.current = onMapReady;
  }, [onMapReady]);

  useEffect(() => {
    onSelectPandalRef.current = onSelectPandal;
  }, [onSelectPandal]);

  // 1. Script Loader for Google Maps JavaScript API
  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey || window.google?.maps) return;

    const scriptId = "google-maps-script";
    let script = document.getElementById(scriptId);

    const handleLoad = () => setGoogleMapsLoaded(true);
    const handleError = () => {
      console.warn("Failed to load Google Maps script. Using fallback canvas.");
      setLoadError(true);
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
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
  }, []);

  // 2. Initialize Google Map Instance
  useEffect(() => {
    if (!googleMapsLoaded || !containerRef.current || !window.google?.maps) return;

    if (!mapRef.current) {
      const map = new window.google.maps.Map(containerRef.current, {
        center: KOLKATA_CENTER,
        zoom: DEFAULT_ZOOM,
        styles: MAP_STYLES,
        disableDefaultUI: true,
        gestureHandling: "greedy",
      });

      mapRef.current = map;
      onMapReadyRef.current?.(map);

      // Create Metro Transit Polylines
      const blueLine = new window.google.maps.Polyline({
        path: METRO_DATA.blueLine.path,
        geodesic: true,
        strokeColor: METRO_DATA.blueLine.color,
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map: metroActive ? map : null,
      });

      const greenLine = new window.google.maps.Polyline({
        path: METRO_DATA.greenLine.path,
        geodesic: true,
        strokeColor: METRO_DATA.greenLine.color,
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map: metroActive ? map : null,
      });

      metroPolylinesRef.current = [blueLine, greenLine];

      // Metro Station Node Markers
      const stationMarkers = [];
      [...METRO_DATA.blueLine.path, ...METRO_DATA.greenLine.path].forEach((station) => {
        const stationMarker = new window.google.maps.Marker({
          position: { lat: station.lat, lng: station.lng },
          map: metroActive ? map : null,
          title: `Metro: ${station.name}`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 4,
            fillColor: "#ffffff",
            fillOpacity: 1,
            strokeColor: "#005bb3",
            strokeWeight: 2,
          },
        });
        stationMarkers.push(stationMarker);
      });
      metroMarkersRef.current = stationMarkers;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [googleMapsLoaded]);

  // 3. Update Metro Layers Visibility
  useEffect(() => {
    if (!mapRef.current) return;
    metroPolylinesRef.current.forEach((poly) => poly.setMap(metroActive ? mapRef.current : null));
    metroMarkersRef.current.forEach((marker) => marker.setMap(metroActive ? mapRef.current : null));
  }, [metroActive]);

  // 4. Update Map Type (Roadmap, Satellite, Terrain)
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;
    mapRef.current.setMapTypeId(activeLayer);
  }, [activeLayer]);

  // 5. Update Pandal Markers
  useEffect(() => {
    if (!mapRef.current || !window.google?.maps) return;

    // Clear previous markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    pandals.forEach((pandal) => {
      const isSelected = selectedPandal?.id === pandal.id;
      const marker = new window.google.maps.Marker({
        position: { lat: pandal.lat, lng: pandal.lng },
        map: mapRef.current,
        title: pandal.name,
        icon: createPandalIcon(isSelected),
        zIndex: isSelected ? 999 : 1,
      });

      marker.addListener("click", () => {
        onSelectPandalRef.current?.(pandal);
      });

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [pandals, selectedPandal, googleMapsLoaded]);

  // 6. Pan to Selected Pandal
  useEffect(() => {
    if (selectedPandal && mapRef.current) {
      mapRef.current.panTo({ lat: selectedPandal.lat, lng: selectedPandal.lng });
    }
  }, [selectedPandal]);

  // 7. Pan to User Location
  useEffect(() => {
    if (userLocation && mapRef.current) {
      mapRef.current.panTo(userLocation);
      mapRef.current.setZoom(14);
    }
  }, [userLocation]);

  // Fallback to Kolkata SVG Map if Google Maps script is unconfigured or errored
  if (!googleMapsLoaded || loadError) {
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
