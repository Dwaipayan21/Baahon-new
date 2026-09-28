import { useEffect, useRef } from "react";
import { createPandalIcon } from "../utils/mapCanvasUtils";

const GoogleMapPandalMarkers = ({
  map,
  pandals = [],
  selectedPandal,
  selectedPandals = [],
  onSelectPandal,
}) => {
  const markersRef = useRef([]);
  const onSelectRef = useRef(onSelectPandal);

  useEffect(() => {
    onSelectRef.current = onSelectPandal;
  }, [onSelectPandal]);

  useEffect(() => {
    if (!map || !window.google?.maps) return;

    // Remove existing markers
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });

    markersRef.current = pandals.map((pandal) => {
      const isRouteSelected = selectedPandals.some(
        (selected) => selected.id === pandal.id
      );

      const isOpened = selectedPandal?.id === pandal.id;

      const marker = new window.google.maps.Marker({
        position: {
          lat: pandal.lat,
          lng: pandal.lng,
        },
        map,
        title: pandal.name,
        icon: createPandalIcon(isRouteSelected),
        zIndex: isOpened ? 1000 : isRouteSelected ? 500 : 1,
      });

      marker.addListener("click", () => {
        onSelectRef.current?.(pandal);
      });

      return marker;
    });

    return () => {
      markersRef.current.forEach((marker) => {
        marker.setMap(null);
      });

      markersRef.current = [];
    };
  }, [pandals, selectedPandal, selectedPandals, map]);

  return null;
};

export default GoogleMapPandalMarkers;
