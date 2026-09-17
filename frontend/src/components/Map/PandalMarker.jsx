import { useEffect, useRef } from "react";

const PandalMarker = ({
  map,
  mapsApi,
  pandals = [],
  selectedPandal,
  onSelectPandal,
}) => {
  const markersRef = useRef([]);

  useEffect(() => {
    if (!map || !mapsApi) return;

    // Remove old markers
    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    pandals.forEach((pandal) => {
      const [lng, lat] = pandal.location?.coordinates || [];

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

      const marker = new mapsApi.Marker({
        map,
        position: { lat, lng },
        title: pandal.name,
        label: {
          text: "🛕",
          fontSize: "22px",
        },
      });

      marker.addListener("click", () => {
        onSelectPandal?.(pandal);
      });

      markersRef.current.push(marker);
    });

    return () => {
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
    };
  }, [map, mapsApi, pandals, onSelectPandal]);

  return null;
};

export default PandalMarker;