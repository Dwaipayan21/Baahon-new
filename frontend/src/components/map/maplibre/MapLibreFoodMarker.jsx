import { useEffect, useRef } from "react";
import * as maplibregl from "maplibre-gl";

/* =========================================================
   MapLibreFoodMarkers
   Renders food places as MapLibre HTML markers.
========================================================= */

const createFoodMarkerElement = () => {
  const element = document.createElement("div");

  element.innerHTML = `
    <svg
      width="34"
      height="34"
      viewBox="0 0 34 34"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        cx="17"
        cy="17"
        r="13"
        fill="#ffffff"
        stroke="#d97706"
        stroke-width="2"
      />

      <text
        x="17"
        y="22"
        text-anchor="middle"
        font-size="15"
        font-family="Arial, sans-serif"
      >
        🍴
      </text>
    </svg>
  `;

  element.style.width = "34px";
  element.style.height = "34px";
  element.style.cursor = "pointer";

  return element;
};

const MapLibreFoodMarkers = ({
  map,
  foodPlaces = [],
  selectedFoodPlace,
  onSelectFoodPlace,
}) => {
  const markersRef = useRef([]);
  const onSelectRef = useRef(onSelectFoodPlace);

  useEffect(() => {
    onSelectRef.current = onSelectFoodPlace;
  }, [onSelectFoodPlace]);

  useEffect(() => {
    if (!map) {
      return;
    }

    markersRef.current.forEach((marker) => {
      marker.remove();
    });

    markersRef.current = [];

    const validPlaces = foodPlaces.filter(
      (place) =>
        Number.isFinite(Number(place.latitude)) &&
        Number.isFinite(Number(place.longitude))
    );

    markersRef.current = validPlaces.map((place) => {
      const isSelected =
        selectedFoodPlace?.id === place.id;

      const element = createFoodMarkerElement();

      element.style.zIndex = isSelected
        ? "850"
        : "300";

      element.title = place.name || "Food place";

      element.addEventListener("click", (event) => {
        event.stopPropagation();
        onSelectRef.current?.(place);
      });

      return new maplibregl.Marker({
        element,
        anchor: "center",
      })
        .setLngLat([
          Number(place.longitude),
          Number(place.latitude),
        ])
        .addTo(map);
    });

    return () => {
      markersRef.current.forEach((marker) => {
        marker.remove();
      });

      markersRef.current = [];
    };
  }, [
    map,
    foodPlaces,
    selectedFoodPlace,
  ]);

  return null;
};

export default MapLibreFoodMarkers;